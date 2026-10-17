import { createClient } from "@supabase/supabase-js";
import { activationIssuerSecret, generateActivationCode } from "@/lib/activation-codes";
import { sendActivationCodeEmail } from "@/lib/activation-email";
import { getBook } from "@/lib/parse";
import {
  fetchCustomerEmail,
  fulfillPaddleTransaction,
  type PaddlePurchaseDb,
  verifyPaddleSignature,
} from "@/lib/paddle";
import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Paddle notification destination. Subscribe it to `transaction.completed` only.
 *
 * Answer 2xx only once the buyer has what they paid for. Anything else makes
 * Paddle retry, and record_paddle_purchase is idempotent on (transaction id, book),
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

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.PADDLE_WEBHOOK_SECRET ?? "";
  if (!verifyPaddleSignature(raw, request.headers.get("paddle-signature"), secret)) {
    return new Response("bad signature", { status: 401 });
  }

  const event = JSON.parse(raw) as TransactionCompleted;
  if (event.event_type !== "transaction.completed") return new Response("ignored");

  let issuer: string;
  try {
    issuer = activationIssuerSecret();
  } catch {
    return new Response("not configured", { status: 500 });
  }

  // Anon client: no user session here. The RPC is gated by the issuer secret.
  const { url, publishableKey } = supabaseEnv();
  const db = createClient(url, publishableKey, { auth: { persistSession: false } });

  const dbAdapter: PaddlePurchaseDb = {
    generateCode: generateActivationCode,
    recordPurchase: async ({ transactionId, book, parentId, email, code }) => {
      const { data, error } = await db.rpc("record_paddle_purchase", {
        p_transaction: transactionId,
        p_book: book,
        p_parent: parentId,
        p_email: email,
        p_code: code,
        p_issuer_secret: issuer,
      });
      if (error) {
        console.error("Paddle: record_paddle_purchase failed", transactionId, book, error.message);
        throw new Error(error.message);
      }
      return data?.[0] ?? { status: "not_authorised", code: null, emailed: false };
    },
    markCodeEmailed: async (code) => {
      const { data, error } = await db.rpc("mark_paddle_code_emailed", {
        p_code: code,
        p_issuer_secret: issuer,
      });
      if (error) {
        console.error("Paddle: mark_paddle_code_emailed failed", code, error.message);
        return false;
      }
      return !!data;
    },
    sendActivationEmail: async (email, code, book) => {
      let bookTitle: string | undefined;
      try {
        bookTitle = getBook(book).title_en;
      } catch {
        // Fallback if not found
      }
      await sendActivationCodeEmail(email, code, "online", bookTitle);
    },
  };

  try {
    const result = await fulfillPaddleTransaction(event.data, dbAdapter, fetchCustomerEmail);
    switch (result.status) {
      case "ok":
        return new Response("ok");
      case "unknown_price":
        return new Response("unknown price", { status: 200 }); // retrying cannot fix config
      case "email_failed":
        return new Response("email failed", { status: 500 });
      default:
        return new Response("not recorded", { status: 500 });
    }
  } catch (e) {
    console.error("Paddle: fulfillment failed", event.data.id, e instanceof Error ? e.message : e);
    return new Response("db error", { status: 500 });
  }
}
