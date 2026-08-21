"use server";

import { z } from "zod";
import { getAdminAccess } from "@/lib/admin";
import {
  activationIssuerSecret,
  generateActivationCode,
} from "@/lib/activation-codes";
import { sendActivationCodeEmail } from "@/lib/activation-email";
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
