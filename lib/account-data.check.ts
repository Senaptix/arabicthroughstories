// Run: npx tsx lib/account-data.check.ts
// Self-check for GDPR account data export, purchase record anonymisation, and subscription cancellation.
import assert from "node:assert/strict";
import {
  anonymisePurchaseRecord,
  buildAccountExport,
  type ActivationRow,
  type BookProgressRow,
  type ChildProfileRow,
  type EntitlementRow,
  type PageProgressRow,
  type PaddleTransactionRow,
  type VocabWord,
} from "./account-data";
import { cancelPaddleSubscription } from "./paddle";

// --- 1. Account Export Checks -------------------------------------
const mockProfiles: ChildProfileRow[] = [
  {
    id: "child-1-uuid",
    display_name: "Hamza",
    avatar_key: "moon",
    created_at: "2026-08-25T10:00:00Z",
  },
];

const mockBookProgress: BookProgressRow[] = [
  {
    child_id: "child-1-uuid",
    book_slug: "ibrahim",
    last_page: 5,
    started_at: "2026-08-25T10:05:00Z",
    last_seen_at: "2026-08-25T11:00:00Z",
  },
  // Foreign child progress that should be filtered out
  {
    child_id: "other-family-child-uuid",
    book_slug: "ibrahim",
    last_page: 20,
    started_at: "2026-08-20T10:05:00Z",
    last_seen_at: "2026-08-20T11:00:00Z",
  },
];

const mockPageProgress: PageProgressRow[] = [
  {
    child_id: "child-1-uuid",
    book_slug: "ibrahim",
    page_number: 3,
    viewed_at: "2026-08-25T10:10:00Z",
    read_completed_at: "2026-08-25T10:15:00Z",
    practice_completed_at: "2026-08-25T10:20:00Z",
    best_correct: 5,
    graded_total: 5,
    updated_at: "2026-08-25T10:20:00Z",
  },
  {
    child_id: "child-1-uuid",
    book_slug: "ibrahim",
    page_number: 4,
    viewed_at: "2026-08-25T10:25:00Z",
    read_completed_at: null, // Not marked read -> words should not be collected
    practice_completed_at: null,
    best_correct: null,
    graded_total: null,
    updated_at: "2026-08-25T10:25:00Z",
  },
  // Foreign child page progress that should be filtered out
  {
    child_id: "other-family-child-uuid",
    book_slug: "ibrahim",
    page_number: 10,
    viewed_at: "2026-08-20T10:10:00Z",
    read_completed_at: "2026-08-20T10:15:00Z",
    practice_completed_at: null,
    best_correct: null,
    graded_total: null,
    updated_at: "2026-08-20T10:15:00Z",
  },
];

const mockVocabByBook: Record<string, VocabWord[]> = {
  ibrahim: [
    { index: 1, ar: "قَرْيَةٌ", en: "village", page: 3 },
    { index: 2, ar: "صَنَمٌ", en: "idol", page: 4 },
  ],
};

const mockEntitlements: EntitlementRow[] = [
  {
    book_slug: "ibrahim",
    source: "direct_sale",
    starts_at: "2026-08-25T10:00:00Z",
    expires_at: "2027-08-25T10:00:00Z",
  },
];

const mockActivations: ActivationRow[] = [
  {
    id: "act-1",
    order_number: "QK-2345-6789",
    status: "approved",
    note: null,
    book_slugs: ["ibrahim"],
    created_at: "2026-08-25T10:00:00Z",
    reviewed_at: "2026-08-25T10:00:00Z",
  },
];

const mockPurchases: PaddleTransactionRow[] = [
  {
    transaction_id: "txn_test_123",
    book_slug: "ibrahim",
    parent_id: "parent-uuid",
    customer_email: "parent@example.com",
    kind: "monthly",
    status: "granted",
    created_at: "2026-08-25T10:00:00Z",
  },
];

const exported = buildAccountExport({
  email: "parent@example.com",
  profiles: mockProfiles,
  bookProgress: mockBookProgress,
  pageProgress: mockPageProgress,
  vocabByBook: mockVocabByBook,
  entitlements: mockEntitlements,
  activations: mockActivations,
  purchases: mockPurchases,
  exportedAt: "2026-10-19T12:00:00Z",
});

// Check account email
assert.equal(exported.account.email, "parent@example.com");

// Check child profiles
assert.equal(exported.child_profiles.length, 1);
assert.equal(exported.child_profiles[0].display_name, "Hamza");
assert.equal(exported.child_profiles[0].avatar_key, "moon");

// Check progress scoping: foreign child data is filtered out
assert.equal(exported.progress.books.length, 1, "filters out foreign child book progress");
assert.equal(exported.progress.books[0].child_id, "child-1-uuid");
assert.equal(exported.progress.pages.length, 2, "filters out foreign child page progress");
assert.equal(
  exported.progress.pages.every((p) => p.child_id === "child-1-uuid"),
  true,
);

// Check saved words extraction
assert.equal(exported.saved_words.length, 1);
assert.equal(exported.saved_words[0].child_id, "child-1-uuid");
assert.equal(exported.saved_words[0].child_name, "Hamza");
assert.equal(exported.saved_words[0].book_slug, "ibrahim");
assert.equal(exported.saved_words[0].words.length, 1, "only completed page 3 words collected");
assert.equal(exported.saved_words[0].words[0].ar, "قَرْيَةٌ");
assert.equal(exported.saved_words[0].words[0].page, 3);

// Check entitlements & activations
assert.equal(exported.entitlements.length, 1);
assert.equal(exported.entitlements[0].book_slug, "ibrahim");
assert.equal(exported.activations.length, 1);
assert.equal(exported.activations[0].order_number, "QK-2345-6789");

// Check purchases (own rows only, formatted)
assert.equal(exported.purchases.length, 1);
assert.equal(exported.purchases[0].transaction_id, "txn_test_123");
assert.equal(exported.purchases[0].book_slug, "ibrahim");
assert.equal(exported.purchases[0].kind, "monthly");
assert.equal(exported.purchases[0].status, "granted");

// Security check: no password, secret or foreign IDs leak into export
const jsonStr = JSON.stringify(exported);
assert.equal(jsonStr.includes("other-family-child-uuid"), false, "never exports foreign data");
assert.equal(jsonStr.includes("password"), false, "never exports password fields");

// --- 2. Anonymisation Checks --------------------------------------
const rawPurchaseRow: PaddleTransactionRow = {
  transaction_id: "txn_tax_record_999",
  book_slug: "yusuf",
  parent_id: "11111111-2222-3333-4444-555555555555",
  customer_email: "parent@example.com",
  kind: "annual",
  status: "granted",
  created_at: "2026-09-01T15:30:00Z",
};

const anonymised = anonymisePurchaseRecord(rawPurchaseRow);
assert.equal(anonymised.customer_email, null, "nulls customer_email");
assert.equal(anonymised.parent_id, null, "nulls parent_id");
assert.equal(anonymised.transaction_id, "txn_tax_record_999", "keeps transaction_id for tax");
assert.equal(anonymised.book_slug, "yusuf", "keeps book_slug for tax");
assert.equal(anonymised.kind, "annual", "keeps kind for tax");
assert.equal(anonymised.status, "granted", "keeps status");
assert.equal(anonymised.created_at, "2026-09-01T15:30:00Z", "keeps date for tax (6-year retention)");

// --- 3. Paddle Cancellation Guard Checks -------------------------
async function runPaddleCancelChecks() {
  const savedKey = process.env.PADDLE_API_KEY;
  delete process.env.PADDLE_API_KEY;

  const noKeyResult = await cancelPaddleSubscription("sub_test_123");
  assert.equal(noKeyResult, false, "without PADDLE_API_KEY, returns false");

  process.env.PADDLE_API_KEY = savedKey;

  const emptySubResult = await cancelPaddleSubscription("");
  assert.equal(emptySubResult, false, "empty subscriptionId returns false");
}

runPaddleCancelChecks()
  .then(() => {
    console.log("account-data.check: ok");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
