"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminAccess } from "@/lib/admin";
import {
  activationIssuerSecret,
  generateActivationCode,
} from "@/lib/activation-codes";
import { sendActivationCodeEmail } from "@/lib/activation-email";
import { catalogueEntry } from "@/lib/catalogue";
import { createClient } from "@/lib/supabase/server";

export type IssueCodeState = {
  message?: string;
  code?: string;
  issuedTo?: string;
  emailed?: boolean;
};

const issueSchema = z.object({
  email: z.string().trim().email().max(254),
  note: z.string().trim().max(160).optional(),
});

export async function issueActivationCode(
  _state: IssueCodeState,
  formData: FormData,
): Promise<IssueCodeState> {
  const admin = await getAdminAccess();
  if (!admin.allowed) return { message: "You are not authorised to issue activation codes." };

  const parsed = issueSchema.safeParse({
    email: formData.get("email"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { message: "Enter a valid email address and keep the note under 160 characters." };
  }

  let issuerSecret: string;
  try {
    issuerSecret = activationIssuerSecret();
  } catch {
    return { message: "Code issuing is not configured on this server." };
  }

  const supabase = await createClient();
  let code = "";
  let issued = false;

  for (let attempt = 0; attempt < 5 && !issued; attempt += 1) {
    code = generateActivationCode();
    const { data, error } = await supabase.rpc("issue_activation_code", {
      p_code: code,
      p_email: parsed.data.email,
      p_note: parsed.data.note ?? "",
      p_issuer_secret: issuerSecret,
    });
    if (error) return { message: "The code could not be recorded. Please try again." };
    if (data === "not_authorised") return { message: "The server refused this issuing request." };
    if (data === "invalid_code") return { message: "The generated code was rejected. Please try again." };
    issued = data === "ok";
  }

  if (!issued) return { message: "A unique code could not be generated. Please try again." };

  let emailed = false;
  try {
    await sendActivationCodeEmail(parsed.data.email, code);
    const { data, error } = await supabase.rpc("mark_activation_code_emailed", {
      p_code: code,
      p_issuer_secret: issuerSecret,
    });
    emailed = !error && data === true;
  } catch (error) {
    // The on-screen code is the reliable delivery path at a busy stall. SMTP
    // failure is recorded by leaving emailed_at null and must not undo issuance.
    console.error(
      "Activation code email failed:",
      error instanceof Error ? error.message : "Unknown SMTP error",
    );
  }

  return {
    code,
    issuedTo: parsed.data.email,
    emailed,
    message: emailed
      ? "Code created and emailed. Confirm the address with the buyer before they leave."
      : "Code created. The email was not confirmed, so give the buyer the code shown below.",
  };
}

/* ------------------------------------------------------------------ *
 * Approving Amazon activations
 *
 * This used to be done by hand in the Supabase table editor. It should never
 * have been: it puts a production database in front of someone doing a
 * clerical job, one mistyped cell from granting or destroying access, with no
 * record of who changed what.
 *
 * Approval grants a year on EACH book ticked. One Amazon order routinely
 * contains both titles, and the receipt is what says which — so the reviewer's
 * selection wins over whatever the parent claimed at signup.
 * ------------------------------------------------------------------ */

export type ReviewState = { message?: string; ok?: boolean };

export async function approveActivation(
  _state: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const admin = await getAdminAccess();
  if (!admin.allowed) return { message: "You are not authorised to approve activations." };

  const id = z.string().uuid().safeParse(formData.get("activation_id"));
  if (!id.success) return { message: "That activation could not be identified." };

  // getAll: the reviewer ticks one box per book on the receipt.
  const books = formData
    .getAll("book")
    .map(String)
    .filter((slug) => catalogueEntry(slug) !== undefined);
  if (books.length === 0) {
    return { message: "Tick at least one book before approving." };
  }

  let issuerSecret: string;
  try {
    issuerSecret = activationIssuerSecret();
  } catch {
    return { message: "Approval is not configured on this server." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("approve_activation", {
    p_activation_id: id.data,
    p_book_slugs: books,
    p_issuer_secret: issuerSecret,
  });

  if (error) return { message: "The approval could not be recorded. Try again." };
  if (data === "not_authorised") return { message: "The server refused this approval." };
  if (data === "no_books") return { message: "Tick at least one book before approving." };
  if (data === "not_found") return { message: "That activation no longer exists." };
  if (data === "already_approved") return { message: "That activation was already approved." };
  if (data === "order_already_approved") {
    return { message: "Another activation for this order number is already approved." };
  }
  if (data !== "ok") return { message: "The approval did not complete. Try again." };

  revalidatePath("/admin/activation-codes");
  return {
    ok: true,
    message: `Approved. ${books.length === 1 ? "One book" : `${books.length} books`} granted for 12 months.`,
  };
}

export async function rejectActivation(
  _state: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const admin = await getAdminAccess();
  if (!admin.allowed) return { message: "You are not authorised to reject activations." };

  const id = z.string().uuid().safeParse(formData.get("activation_id"));
  if (!id.success) return { message: "That activation could not be identified." };
  const note = z.string().trim().max(200).safeParse(formData.get("note") ?? "");

  let issuerSecret: string;
  try {
    issuerSecret = activationIssuerSecret();
  } catch {
    return { message: "Rejection is not configured on this server." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reject_activation", {
    p_activation_id: id.data,
    p_note: note.success ? note.data : "",
    p_issuer_secret: issuerSecret,
  });

  if (error) return { message: "The rejection could not be recorded. Try again." };
  if (data === "not_authorised") return { message: "The server refused this rejection." };
  if (data === "not_found") return { message: "That activation is no longer pending." };
  if (data !== "ok") return { message: "The rejection did not complete. Try again." };

  revalidatePath("/admin/activation-codes");
  // Rejection does NOT revoke the 30 days already granted. Provisional access
  // runs its course and lapses on its own; taking it away mid-window would
  // punish a parent for a receipt that may simply have gone to the wrong inbox.
  return { ok: true, message: "Rejected. Provisional access still lapses on its own." };
}
