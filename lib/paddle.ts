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

/** PADDLE_PRICE_IBRAHIM, PADDLE_PRICE_YUSUF, ... One Paddle price per book. */
export function priceIdFor(slug: string): string | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  return process.env[`PADDLE_PRICE_${slug.toUpperCase().replaceAll("-", "_")}`]?.trim() || null;
}

/** The book a Paddle price sells. The price, not custom_data, decides the book. */
export function bookForPrice(priceId: string): string | null {
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("PADDLE_PRICE_") && value?.trim() === priceId) {
      return key.slice("PADDLE_PRICE_".length).toLowerCase().replaceAll("_", "-");
    }
  }
  return null;
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
