import { createClient } from "@supabase/supabase-js";
import { activationIssuerSecret, generateActivationCode } from "@/lib/activation-codes";
import { sendActivationCodeEmail } from "@/lib/activation-email";
import { bookForPrice, fetchCustomerEmail, verifyPaddleSignature } from "@/lib/paddle";
import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Paddle notification destination. Subscribe it to `transaction.completed` only.
 *
 * Answer 2xx only once the buyer has what they paid for. Anything else makes
 * Paddle retry, and record_paddle_purchase is idempotent on the transaction id,
 * so a retry finishes the job (e.g. resends a code whose email failed) rather
 * than granting twice.
 */

type TransactionCompleted = {
  event_type: string;
  data: {
    id: string;
    customer_id: string | null;
    custom_data: { parent_id?: string } | null;
    items: { price: { id: string } }[];
  };
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.PADDLE_WEBHOOK_SECRET ?? "";
  if (!verifyPaddleSignature(raw, request.headers.get("paddle-signature"), secret)) {
    return new Response("bad signature", { status: 401 });
  }

  const event = JSON.parse(raw) as TransactionCompleted;
  if (event.event_type !== "transaction.completed") return new Response("ignored");

  const txn = event.data;
  // ponytail: one book per checkout, because the buy page sells one price. A
  // basket of several books needs a loop here and one row per (txn, book).
  const book = txn.items.map((i) => bookForPrice(i.price.id)).find(Boolean);
  if (!book) {
    console.error("Paddle: no book for prices", txn.id, txn.items.map((i) => i.price.id));
    return new Response("unknown price", { status: 200 }); // retrying cannot fix config
  }

  const parent = txn.custom_data?.parent_id;
  const parentId = parent && UUID.test(parent) ? parent : null;
  const email = txn.customer_id ? await fetchCustomerEmail(txn.customer_id) : null;

  let issuer: string;
  try {
    issuer = activationIssuerSecret();
  } catch {
    return new Response("not configured", { status: 500 });
  }

  // Anon client: no user session here. The RPC is gated by the issuer secret.
  const { url, publishableKey } = supabaseEnv();
  const db = createClient(url, publishableKey, { auth: { persistSession: false } });

  let result: { status: string; code: string | null; emailed: boolean } | undefined;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await db.rpc("record_paddle_purchase", {
      p_transaction: txn.id,
      p_book: book,
      p_parent: parentId,
      p_email: email,
      p_code: generateActivationCode(),
      p_issuer_secret: issuer,
    });
    if (error) {
      console.error("Paddle: record_paddle_purchase failed", txn.id, error.message);
      return new Response("db error", { status: 500 });
    }
    result = data?.[0];
    if (result?.status !== "collision") break;
  }

  switch (result?.status) {
    case "granted":
      return new Response("ok");
    case "code_issued":
    case "duplicate":
      if (!result.code || result.emailed) return new Response("ok");
      if (!email) return new Response("no email yet", { status: 500 });
      try {
        await sendActivationCodeEmail(email, result.code, "online");
      } catch (e) {
        console.error("Paddle: code email failed", txn.id, e instanceof Error ? e.message : e);
        return new Response("email failed", { status: 500 });
      }
      await db.rpc("mark_paddle_code_emailed", { p_code: result.code, p_issuer_secret: issuer });
      return new Response("ok");
    default:
      console.error("Paddle: unexpected result", txn.id, result?.status);
      return new Response("not recorded", { status: 500 });
  }
}
