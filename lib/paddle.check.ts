// Run: npx tsx lib/paddle.check.ts
// Self-check for the Paddle webhook signature, price -> book mapping, and transaction fulfillment.
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  booksForPrice,
  bookForPrice,
  fulfillPaddleTransaction,
  type PaddlePurchaseDb,
  priceIdFor,
  type PurchaseRecordStatus,
  verifyPaddleSignature,
} from "./paddle";

const secret = "pdl_ntfset_test_secret";
const body = '{"event_type":"transaction.completed"}';
const ts = 1_800_000_000;
const h1 = createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex");
const now = ts * 1000;

assert.equal(verifyPaddleSignature(body, `ts=${ts};h1=${h1}`, secret, now), true);
assert.equal(verifyPaddleSignature(body, `ts=${ts};h1=deadbeef;h1=${h1}`, secret, now), true, "rotation: any h1 may match");
assert.equal(verifyPaddleSignature(body + " ", `ts=${ts};h1=${h1}`, secret, now), false, "tampered body");
assert.equal(verifyPaddleSignature(body, `ts=${ts};h1=${h1}`, "wrong", now), false, "wrong secret");
assert.equal(verifyPaddleSignature(body, `ts=${ts};h1=${h1}`, secret, now + 301_000), false, "stale replay");
assert.equal(verifyPaddleSignature(body, null, secret, now), false);
assert.equal(verifyPaddleSignature(body, `ts=${ts};h1=${h1}`, "", now), false, "unset secret never verifies");

// --- Price mapping checks -----------------------------------------
process.env.PADDLE_PRICE_IBRAHIM = "pri_ibrahim";
process.env.PADDLE_PRICE_YUSUF = "pri_yusuf";
process.env.PADDLE_PRICE_BUNDLE = "pri_bundle";
process.env.PADDLE_PRICE_IBRAHIM_MONTHLY = "pri_ibrahim_mo";
process.env.PADDLE_PRICE_YUSUF_MONTHLY = "pri_yusuf_mo";
process.env.PADDLE_PRICE_BUNDLE_MONTHLY = "pri_bundle_mo";

assert.equal(priceIdFor("ibrahim"), "pri_ibrahim");
assert.equal(priceIdFor("yusuf"), "pri_yusuf");
assert.equal(priceIdFor("both"), "pri_bundle");
assert.equal(priceIdFor("bundle"), "pri_bundle");
assert.equal(priceIdFor("ibrahim", "monthly"), "pri_ibrahim_mo");
assert.equal(priceIdFor("yusuf", "monthly"), "pri_yusuf_mo");
assert.equal(priceIdFor("both", "monthly"), "pri_bundle_mo");
assert.equal(priceIdFor("../etc"), null);

assert.equal(bookForPrice("pri_ibrahim"), "ibrahim");
assert.equal(bookForPrice("pri_unknown"), null);
assert.deepEqual(booksForPrice("pri_ibrahim"), ["ibrahim"]);

// Bundle price maps to both books
assert.deepEqual(booksForPrice("pri_bundle"), ["ibrahim", "yusuf"], "bundle price maps to both books");
assert.deepEqual(booksForPrice("pri_bundle_mo"), ["ibrahim", "yusuf"], "bundle monthly price maps to both books");

// --- Fulfillment checks: Unknown price grants nothing -------------
async function runFulfillmentChecks() {
  let dbCallCount = 0;
  const dummyDb: PaddlePurchaseDb = {
    recordPurchase: async () => {
      dbCallCount++;
      return { status: "granted", code: null, emailed: true };
    },
  };

  const unknownRes = await fulfillPaddleTransaction(
    {
      id: "txn_unknown_price",
      items: [{ price: { id: "pri_unknown" } }],
    },
    dummyDb,
  );
  assert.equal(unknownRes.status, "unknown_price");
  assert.equal(unknownRes.books.length, 0);
  assert.equal(unknownRes.records.length, 0);
  assert.equal(dbCallCount, 0, "unknown price grants nothing and touches no DB");

  // --- Fulfillment checks: Bundle grants both books & replay grants nothing new ---
  const inMemorySubscriptions = new Map<string, string>();
  const inMemoryTransactions = new Map<string, { status: PurchaseRecordStatus; code: string | null; emailed: boolean; kind?: string; expiresAt?: string | null }>();
  let generatedCodeSeq = 1;

  const mockDb: PaddlePurchaseDb = {
    lookupSubscription: async (subId) => inMemorySubscriptions.get(subId) ?? null,
    storeSubscription: async ({ subscriptionId, parentId }) => {
      inMemorySubscriptions.set(subscriptionId, parentId);
    },
    generateCode: () => `QK-TEST-${String(generatedCodeSeq++).padStart(4, "0")}`,
    recordPurchase: async ({ transactionId, book, parentId, code, kind, expiresAt }) => {
      const key = `${transactionId}:${book}`;
      const existing = inMemoryTransactions.get(key);
      if (existing) {
        return { status: "duplicate", code: existing.code, emailed: existing.emailed };
      }
      if (parentId) {
        const rec = { status: "granted" as const, code: null, emailed: true, kind, expiresAt };
        inMemoryTransactions.set(key, rec);
        return rec;
      }
      if (kind === "monthly") {
        const rec = { status: "unmatched" as const, code: null, emailed: false, kind, expiresAt };
        inMemoryTransactions.set(key, rec);
        return rec;
      }
      const rec = { status: "code_issued" as const, code, emailed: false, kind, expiresAt };
      inMemoryTransactions.set(key, rec);
      return rec;
    },
    markCodeEmailed: async (code) => {
      for (const [, val] of inMemoryTransactions) {
        if (val.code === code) {
          val.emailed = true;
          return true;
        }
      }
      return false;
    },
  };

  // Signed-in bundle purchase
  const parentTxn = {
    id: "txn_bundle_parent_1",
    items: [{ price: { id: "pri_bundle" } }],
    custom_data: { parent_id: "11111111-1111-1111-1111-111111111111" },
  };

  const parentRes1 = await fulfillPaddleTransaction(parentTxn, mockDb);
  assert.equal(parentRes1.status, "ok");
  assert.deepEqual(parentRes1.books, ["ibrahim", "yusuf"], "bundle price maps to both books in transaction");
  assert.equal(parentRes1.records.length, 2);
  assert.equal(parentRes1.records.filter((r) => r.isNew).length, 2, "grants both ibrahim and yusuf entitlements");

  // Replaying the same txn grants nothing new
  const parentRes2 = await fulfillPaddleTransaction(parentTxn, mockDb);
  assert.equal(parentRes2.status, "ok");
  assert.equal(parentRes2.records.length, 2);
  assert.equal(parentRes2.records.every((r) => r.status === "duplicate"), true);
  assert.equal(parentRes2.records.filter((r) => r.isNew).length, 0, "replaying the same txn grants nothing new");

  // Guest bundle purchase grants two QK- codes
  const emailedCodes: string[] = [];
  mockDb.sendActivationEmail = async (_email, code) => {
    emailedCodes.push(code);
  };

  const guestTxn = {
    id: "txn_bundle_guest_1",
    customer_id: "ctm_guest_1",
    items: [{ price: { id: "pri_bundle" } }],
  };

  const guestRes1 = await fulfillPaddleTransaction(
    guestTxn,
    mockDb,
    async () => "buyer@example.com",
  );
  assert.equal(guestRes1.status, "ok");
  assert.deepEqual(guestRes1.books, ["ibrahim", "yusuf"]);
  assert.equal(guestRes1.records.length, 2);
  assert.equal(guestRes1.records.filter((r) => r.status === "code_issued").length, 2, "grants two QK- codes for a guest");
  assert.ok(guestRes1.records[0].code?.startsWith("QK-"));
  assert.ok(guestRes1.records[1].code?.startsWith("QK-"));
  assert.notEqual(guestRes1.records[0].code, guestRes1.records[1].code, "each book gets a distinct code");
  assert.equal(emailedCodes.length, 2, "both codes emailed");

  // Replaying the guest transaction grants nothing new
  const guestRes2 = await fulfillPaddleTransaction(
    guestTxn,
    mockDb,
    async () => "buyer@example.com",
  );
  assert.equal(guestRes2.status, "ok");
  assert.equal(guestRes2.records.every((r) => r.status === "duplicate"), true);
  assert.equal(guestRes2.records.filter((r) => r.isNew).length, 0, "replaying guest txn grants nothing new");
  assert.equal(emailedCodes.length, 2, "no extra emails sent on replay");
  assert.equal(guestRes2.records[0].code, guestRes1.records[0].code, "replay returns the original codes");
  assert.equal(guestRes2.records[1].code, guestRes1.records[1].code, "replay returns the original codes");

  // Book is decided by PRICE id only, never by custom_data
  const forgedTxn = {
    id: "txn_forged_custom_data",
    items: [{ price: { id: "pri_ibrahim" } }],
    custom_data: { book: "yusuf", parent_id: "11111111-1111-1111-1111-111111111111" },
  };
  const forgedRes = await fulfillPaddleTransaction(forgedTxn, mockDb);
  assert.deepEqual(forgedRes.books, ["ibrahim"], "price id decides book, custom_data is never used for book");

  // --- Monthly subscription checks ----------------------------------
  // 1. monthly price -> kind monthly, expiry = billing_period.ends_at + 3 days
  const billingEnd = "2026-11-20T00:00:00.000Z";
  const expectedGraceMs = 3 * 86_400_000;
  const expectedExpiry = new Date(new Date(billingEnd).getTime() + expectedGraceMs).toISOString();

  let recordedKind: string | undefined;
  let recordedExpiry: string | null | undefined;
  const spyDb: PaddlePurchaseDb = {
    ...mockDb,
    recordPurchase: async (params) => {
      recordedKind = params.kind;
      recordedExpiry = params.expiresAt;
      return mockDb.recordPurchase(params);
    },
  };

  const firstMonthlyTxn = {
    id: "txn_monthly_first_1",
    subscription_id: "sub_parent_1",
    billing_period: { ends_at: billingEnd },
    items: [{ price: { id: "pri_ibrahim_mo" } }],
    custom_data: { parent_id: "22222222-2222-2222-2222-222222222222" },
  };

  const firstMonthlyRes = await fulfillPaddleTransaction(firstMonthlyTxn, spyDb);
  assert.equal(firstMonthlyRes.status, "ok");
  assert.equal(recordedKind, "monthly", "monthly price -> kind monthly");
  assert.equal(recordedExpiry, expectedExpiry, "expiry = billing_period.ends_at + 3 days");
  assert.equal(inMemorySubscriptions.get("sub_parent_1"), "22222222-2222-2222-2222-222222222222", "stores subscription mapping");

  // 2. renewal with only subscription_id resolves the stored parent
  const renewalTxn = {
    id: "txn_monthly_renewal_1",
    subscription_id: "sub_parent_1",
    billing_period: { ends_at: "2026-12-20T00:00:00.000Z" },
    items: [{ price: { id: "pri_ibrahim_mo" } }],
    // No custom_data on renewal!
  };

  let renewalParentId: string | null | undefined;
  const renewalSpyDb: PaddlePurchaseDb = {
    ...mockDb,
    recordPurchase: async (params) => {
      renewalParentId = params.parentId;
      return mockDb.recordPurchase(params);
    },
  };

  const renewalRes1 = await fulfillPaddleTransaction(renewalTxn, renewalSpyDb);
  assert.equal(renewalRes1.status, "ok");
  assert.equal(renewalParentId, "22222222-2222-2222-2222-222222222222", "renewal with only subscription_id resolves the stored parent");
  assert.equal(renewalRes1.records[0].status, "granted");
  assert.equal(renewalRes1.records[0].isNew, true);

  // 3. replaying a renewal grants nothing new
  const renewalRes2 = await fulfillPaddleTransaction(renewalTxn, renewalSpyDb);
  assert.equal(renewalRes2.status, "ok");
  assert.equal(renewalRes2.records[0].status, "duplicate");
  assert.equal(renewalRes2.records[0].isNew, false, "replaying a renewal grants nothing new");

  // 4. monthly guest purchase issues NO code and grants nothing
  const guestMonthlyTxn = {
    id: "txn_monthly_guest_1",
    customer_id: "ctm_guest_monthly",
    subscription_id: "sub_guest_1",
    billing_period: { ends_at: "2026-11-20T00:00:00.000Z" },
    items: [{ price: { id: "pri_ibrahim_mo" } }],
  };

  let guestCodeGenerated = false;
  const guestSpyDb: PaddlePurchaseDb = {
    ...mockDb,
    generateCode: () => {
      guestCodeGenerated = true;
      return "QK-SHOULD-NOT-BE-CALLED";
    },
  };

  const guestMonthlyRes = await fulfillPaddleTransaction(
    guestMonthlyTxn,
    guestSpyDb,
    async () => "monthly-guest@example.com",
  );
  assert.equal(guestMonthlyRes.status, "unmatched");
  assert.equal(guestMonthlyRes.records[0].status, "unmatched");
  assert.equal(guestMonthlyRes.records[0].code, null, "monthly guest purchase issues NO code");
  assert.equal(guestMonthlyRes.records[0].isNew, false, "monthly guest grants nothing");
  assert.equal(guestCodeGenerated, false, "no QK- code generated for monthly guest");
}

runFulfillmentChecks()
  .then(() => {
    console.log("paddle.check: ok");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
