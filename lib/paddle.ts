// Server-only by use (reads non-public env); no "server-only" import so the self-check runs under tsx.
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Paddle (merchant of record) for direct digital sales. See PADDLE_CHECKOUT.md.
 *
 * Paddle is legally the seller: it charges and remits VAT per customer
 * country, then pays the company. Nothing here handles tax.
 *
 * HIDDEN UNTIL LAUNCH. Every route that sells checks `checkoutEnabled()` and
 * 404s otherwise, and a book is only sellable once its price id is set.
 */

export type PaddleEnvironment = "sandbox" | "production";

export function paddleEnvironment(): PaddleEnvironment {
  return process.env.PADDLE_ENV === "production" ? "production" : "sandbox";
}

export function checkoutEnabled(): boolean {
  return process.env.PADDLE_CHECKOUT_ENABLED === "true" && !!process.env.PADDLE_CLIENT_TOKEN;
}

/** Client-side token (safe to send to the browser; not the API key). */
export function paddleClientToken(): string {
  return process.env.PADDLE_CLIENT_TOKEN ?? "";
}

export const BUNDLE_BOOKS = ["ibrahim", "yusuf"] as const;

export type PurchaseKind = "annual" | "monthly";

export type PriceInfo = {
  books: string[];
  kind: PurchaseKind;
};

/**
 * PADDLE_PRICE_IBRAHIM, PADDLE_PRICE_YUSUF, PADDLE_PRICE_BUNDLE...
 * PADDLE_PRICE_IBRAHIM_MONTHLY, PADDLE_PRICE_YUSUF_MONTHLY, PADDLE_PRICE_BUNDLE_MONTHLY...
 * Any of these may be empty; an empty one simply isn't offered.
 */
export function priceIdFor(slug: string, kind: PurchaseKind = "annual"): string | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const isBundle = slug === "both" || slug === "bundle";
  if (kind === "monthly") {
    if (isBundle) {
      return (
        process.env.PADDLE_PRICE_BUNDLE_MONTHLY?.trim() ||
        process.env.PADDLE_PRICE_BOTH_MONTHLY?.trim() ||
        null
      );
    }
    if (slug === "ibrahim") return process.env.PADDLE_PRICE_IBRAHIM_MONTHLY?.trim() || null;
    if (slug === "yusuf") return process.env.PADDLE_PRICE_YUSUF_MONTHLY?.trim() || null;
    return null;
  }
  if (isBundle) {
    return process.env.PADDLE_PRICE_BUNDLE?.trim() || process.env.PADDLE_PRICE_BOTH?.trim() || null;
  }
  if (slug === "ibrahim") return process.env.PADDLE_PRICE_IBRAHIM?.trim() || null;
  if (slug === "yusuf") return process.env.PADDLE_PRICE_YUSUF?.trim() || null;
  return null;
}

/**
 * Builds the lookup table: priceId -> { books: string[], kind: "annual" | "monthly" }.
 * Books are decided by PRICE ID only, never custom_data.
 */
export function priceTable(): Map<string, PriceInfo> {
  const table = new Map<string, PriceInfo>();

  const register = (priceId: string | undefined, books: string[], kind: PurchaseKind) => {
    const id = priceId?.trim();
    if (id) {
      table.set(id, { books, kind });
    }
  };

  register(process.env.PADDLE_PRICE_IBRAHIM, ["ibrahim"], "annual");
  register(process.env.PADDLE_PRICE_YUSUF, ["yusuf"], "annual");
  register(process.env.PADDLE_PRICE_BUNDLE || process.env.PADDLE_PRICE_BOTH, [...BUNDLE_BOOKS], "annual");

  register(process.env.PADDLE_PRICE_IBRAHIM_MONTHLY, ["ibrahim"], "monthly");
  register(process.env.PADDLE_PRICE_YUSUF_MONTHLY, ["yusuf"], "monthly");
  register(process.env.PADDLE_PRICE_BUNDLE_MONTHLY || process.env.PADDLE_PRICE_BOTH_MONTHLY, [...BUNDLE_BOOKS], "monthly");

  return table;
}

export function lookupPrice(priceId: string): PriceInfo | null {
  if (!priceId) return null;
  return priceTable().get(priceId.trim()) ?? null;
}

/** The books a Paddle price sells. Derived from lookupPrice. */
export function booksForPrice(priceId: string): string[] {
  return lookupPrice(priceId)?.books ?? [];
}

/** The book a Paddle price sells (single-book prices). */
export function bookForPrice(priceId: string): string | null {
  const books = booksForPrice(priceId);
  return books.length === 1 ? books[0] : null;
}

/**
 * Paddle-Signature: "ts=1671552777;h1=<hex>" (h1 may repeat during secret
 * rotation). Signed payload is `${ts}:${rawBody}`, HMAC-SHA256 with the
 * notification destination's secret. Rejects anything older than 5 minutes.
 */
export function verifyPaddleSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  nowMs = Date.now(),
): boolean {
  if (!header || !secret) return false;
  const parts = header.split(";").map((p) => p.trim().split("="));
  const ts = parts.find(([k]) => k === "ts")?.[1];
  const sigs = parts.filter(([k]) => k === "h1").map(([, v]) => v);
  if (!ts || !/^\d+$/.test(ts) || sigs.length === 0) return false;
  if (Math.abs(nowMs / 1000 - Number(ts)) > 300) return false;

  const expected = createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest();
  return sigs.some((s) => {
    const got = Buffer.from(s ?? "", "hex");
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}

/** transaction.completed carries a customer id, not an email. */
export async function fetchCustomerEmail(customerId: string): Promise<string | null> {
  const key = process.env.PADDLE_API_KEY;
  if (!key || !customerId) return null;
  const base = paddleEnvironment() === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
  const res = await fetch(`${base}/customers/${encodeURIComponent(customerId)}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { data?: { email?: string } };
  return body.data?.email ?? null;
}

export async function createCustomerPortalSession(
  customerId: string,
  subscriptionIds?: string[],
): Promise<string | null> {
  const key = process.env.PADDLE_API_KEY;
  if (!key || !customerId) return null;
  const base = paddleEnvironment() === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
  const payload = subscriptionIds && subscriptionIds.length > 0 ? { subscription_ids: subscriptionIds } : {};
  const res = await fetch(`${base}/customers/${encodeURIComponent(customerId)}/portal-sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("Paddle: createCustomerPortalSession failed", res.status, errText);
    return null;
  }
  const body = (await res.json()) as {
    data?: {
      urls?: {
        general?: { overview?: string };
      };
    };
  };
  return body.data?.urls?.general?.overview ?? null;
}

/**
 * Cancel an active Paddle subscription immediately via the Paddle API.
 * Returns true if the subscription was successfully canceled or was already canceled.
 */
export async function cancelPaddleSubscription(subscriptionId: string): Promise<boolean> {
  const key = process.env.PADDLE_API_KEY;
  if (!key || !subscriptionId) return false;
  const base = paddleEnvironment() === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
  try {
    // Ask first: cancelling a subscription that is already cancelled errors, and
    // that must not block a parent from deleting their account.
    const current = await fetch(`${base}/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (current.ok) {
      const body = (await current.json().catch(() => null)) as { data?: { status?: string } } | null;
      if (body?.data?.status === "canceled") return true;
    }

    const res = await fetch(`${base}/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ effective_from: "immediately" }),
      cache: "no-store",
    });
    if (res.ok) return true;

    // Paddle returns 400 or 409 if subscription is already canceled
    const body = (await res.json().catch(() => null)) as {
      error?: { code?: string; message?: string };
    } | null;
    const code = body?.error?.code?.toLowerCase();
    const msg = body?.error?.message?.toLowerCase();
    if (
      code === "subscription_cancelled_already" ||
      code === "subscription_canceled_already" ||
      msg?.includes("already cancel")
    ) {
      return true;
    }

    console.error("Paddle cancel subscription failed:", res.status, body);
    return false;
  } catch (err) {
    console.error("Paddle cancel subscription error:", err);
    return false;
  }
}

export type PurchaseRecordStatus =
  | "granted"
  | "code_issued"
  | "duplicate"
  | "collision"
  | "no_email"
  | "invalid_code"
  | "not_authorised"
  | "unmatched";

export type PurchaseRecordResult = {
  status: PurchaseRecordStatus;
  code: string | null;
  emailed: boolean;
};

export type PaddlePurchaseDb = {
  lookupSubscription?: (subscriptionId: string) => Promise<string | null>;
  storeSubscription?: (params: {
    subscriptionId: string;
    parentId: string;
    customerId: string | null;
  }) => Promise<void>;
  recordPurchase: (params: {
    transactionId: string;
    book: string;
    parentId: string | null;
    email: string | null;
    code: string;
    kind: PurchaseKind;
    expiresAt: string | null;
  }) => Promise<PurchaseRecordResult>;
  markCodeEmailed?: (code: string) => Promise<boolean>;
  sendActivationEmail?: (email: string, code: string, book: string) => Promise<void>;
  generateCode?: () => string;
};

export type FulfillResult = {
  status: "ok" | "unknown_price" | "email_failed" | "db_error" | "not_recorded" | "unmatched";
  books: string[];
  records: { book: string; status: PurchaseRecordStatus; code: string | null; isNew: boolean }[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fulfills a completed Paddle transaction.
 *
 * Books are determined solely by the items' price IDs, never by custom_data.
 * For a bundle price, both Ibrahim and Yusuf are granted.
 * Idempotent on (transaction.id, book): replaying grants nothing new.
 */
export async function fulfillPaddleTransaction(
  txn: {
    id: string;
    customer_id?: string | null;
    subscription_id?: string | null;
    billing_period?: {
      starts_at?: string;
      ends_at?: string;
    } | null;
    custom_data?: { parent_id?: string } | null;
    items: { price: { id: string } }[];
  },
  db: PaddlePurchaseDb,
  emailLookup?: (customerId: string) => Promise<string | null>,
): Promise<FulfillResult> {
  const bookMap = new Map<string, PurchaseKind>();
  for (const item of txn.items) {
    const info = lookupPrice(item.price.id);
    if (!info) continue;
    for (const b of info.books) {
      bookMap.set(b, info.kind);
    }
  }

  if (bookMap.size === 0) {
    return { status: "unknown_price", books: [], records: [] };
  }
  const books = Array.from(bookMap.keys());

  // Parent resolution: stored subscription mapping -> fallback to custom_data.parent_id
  let parentId: string | null = null;
  if (txn.subscription_id && db.lookupSubscription) {
    parentId = await db.lookupSubscription(txn.subscription_id);
  }
  if (!parentId) {
    const customParent = txn.custom_data?.parent_id;
    if (customParent && UUID.test(customParent)) {
      parentId = customParent;
    }
  }

  // If monthly subscription has a parent, record the mapping
  if (parentId && txn.subscription_id && db.storeSubscription) {
    await db.storeSubscription({
      subscriptionId: txn.subscription_id,
      parentId,
      customerId: txn.customer_id ?? null,
    });
  }

  const monthlyExpiresAt = txn.billing_period?.ends_at
    ? new Date(new Date(txn.billing_period.ends_at).getTime() + 3 * 86_400_000).toISOString()
    : new Date(Date.now() + 33 * 86_400_000).toISOString();

  const email = txn.customer_id && emailLookup ? await emailLookup(txn.customer_id) : null;
  const records: { book: string; status: PurchaseRecordStatus; code: string | null; isNew: boolean }[] = [];

  for (const book of books) {
    const kind = bookMap.get(book) ?? "annual";
    const expiresAt = kind === "monthly" ? monthlyExpiresAt : null;

    // Online purchases require an account: no guest checkout and no QK- codes.
    // With no parent the blank code makes the DB record it 'unmatched'
    // (annual and monthly alike) and nothing is granted.
    const result = await db.recordPurchase({
      transactionId: txn.id,
      book,
      parentId,
      email,
      code: "",
      kind,
      expiresAt,
    });

    const isNew = result.status === "granted" || result.status === "code_issued";
    records.push({ book, status: result.status, code: result.code, isNew });

    switch (result.status) {
      case "granted":
      case "unmatched":
        break;
      case "code_issued":
      case "duplicate": {
        if (!result.code || result.emailed) break;
        if (!email) return { status: "not_recorded", books, records };
        if (db.sendActivationEmail) {
          try {
            await db.sendActivationEmail(email, result.code, book);
          } catch {
            return { status: "email_failed", books, records };
          }
        }
        if (db.markCodeEmailed) {
          await db.markCodeEmailed(result.code);
        }
        break;
      }
      default:
        return { status: "not_recorded", books, records };
    }
  }

  if (records.some((r) => r.status === "unmatched")) {
    return { status: "unmatched", books, records };
  }

  return { status: "ok", books, records };
}
