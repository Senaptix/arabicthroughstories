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

/** PADDLE_PRICE_IBRAHIM, PADDLE_PRICE_YUSUF, PADDLE_PRICE_BUNDLE... One Paddle price per book or bundle. */
export function priceIdFor(slug: string): string | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  if (slug === "both" || slug === "bundle") {
    return process.env.PADDLE_PRICE_BUNDLE?.trim() || process.env.PADDLE_PRICE_BOTH?.trim() || null;
  }
  return process.env[`PADDLE_PRICE_${slug.toUpperCase().replaceAll("-", "_")}`]?.trim() || null;
}

/**
 * The books a Paddle price sells. The price, not custom_data, decides the book.
 * A bundle price (PADDLE_PRICE_BUNDLE) sells both Ibrahim and Yusuf.
 */
export function booksForPrice(priceId: string): string[] {
  if (!priceId) return [];
  const bundlePrice = process.env.PADDLE_PRICE_BUNDLE?.trim();
  const bothPrice = process.env.PADDLE_PRICE_BOTH?.trim();
  if ((bundlePrice && priceId === bundlePrice) || (bothPrice && priceId === bothPrice)) {
    return [...BUNDLE_BOOKS];
  }
  for (const [key, value] of Object.entries(process.env)) {
    if (
      key.startsWith("PADDLE_PRICE_") &&
      key !== "PADDLE_PRICE_BUNDLE" &&
      key !== "PADDLE_PRICE_BOTH" &&
      value?.trim() === priceId
    ) {
      return [key.slice("PADDLE_PRICE_".length).toLowerCase().replaceAll("_", "-")];
    }
  }
  return [];
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

export type PurchaseRecordStatus =
  | "granted"
  | "code_issued"
  | "duplicate"
  | "collision"
  | "no_email"
  | "invalid_code"
  | "not_authorised";

export type PurchaseRecordResult = {
  status: PurchaseRecordStatus;
  code: string | null;
  emailed: boolean;
};

export type PaddlePurchaseDb = {
  recordPurchase: (params: {
    transactionId: string;
    book: string;
    parentId: string | null;
    email: string | null;
    code: string;
  }) => Promise<PurchaseRecordResult>;
  markCodeEmailed?: (code: string) => Promise<boolean>;
  sendActivationEmail?: (email: string, code: string, book: string) => Promise<void>;
  generateCode?: () => string;
};

export type FulfillResult = {
  status: "ok" | "unknown_price" | "email_failed" | "db_error" | "not_recorded";
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
    custom_data?: { parent_id?: string } | null;
    items: { price: { id: string } }[];
  },
  db: PaddlePurchaseDb,
  emailLookup?: (customerId: string) => Promise<string | null>,
): Promise<FulfillResult> {
  const books = Array.from(new Set(txn.items.flatMap((i) => booksForPrice(i.price.id))));
  if (books.length === 0) {
    return { status: "unknown_price", books: [], records: [] };
  }

  const parent = txn.custom_data?.parent_id;
  const parentId = parent && UUID.test(parent) ? parent : null;
  const email = txn.customer_id && emailLookup ? await emailLookup(txn.customer_id) : null;

  const records: { book: string; status: PurchaseRecordStatus; code: string | null; isNew: boolean }[] = [];

  for (const book of books) {
    let result: PurchaseRecordResult | undefined;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = db.generateCode ? db.generateCode() : `QK-TEST-CODE`;
      result = await db.recordPurchase({
        transactionId: txn.id,
        book,
        parentId,
        email,
        code,
      });
      if (result.status !== "collision") break;
    }

    if (!result) {
      return { status: "not_recorded", books, records };
    }

    const isNew = result.status === "granted" || result.status === "code_issued";
    records.push({ book, status: result.status, code: result.code, isNew });

    switch (result.status) {
      case "granted":
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

  return { status: "ok", books, records };
}
