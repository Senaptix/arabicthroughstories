import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AdminAccess = {
  signedIn: boolean;
  allowed: boolean;
  email: string | null;
};

function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Server-only authorization. Call it in both the page and every action. */
export async function getAdminAccess(): Promise<AdminAccess> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const subject = data?.claims?.sub;
  const rawEmail = data?.claims?.email;
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : null;

  if (error || typeof subject !== "string") {
    return { signedIn: false, allowed: false, email: null };
  }

  return {
    signedIn: true,
    allowed: email !== null && adminEmails().has(email),
    email,
  };
}
