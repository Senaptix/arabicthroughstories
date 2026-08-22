import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { siteOrigin } from "@/lib/site-origin";

/**
 * Where an email link lands: exchange the code for a session, then send the
 * visitor on.
 *
 * The origin comes from siteOrigin(), NOT from `request.url`. Behind nginx in
 * standalone mode Next builds request.url as `https://localhost:3000` even
 * though nginx forwards Host correctly, so every absolute redirect here was
 * pointing at the visitor's own machine. Only the query string is taken from
 * the incoming URL.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = await siteOrigin();
  const code = url.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(
        new URL(
          safeRedirectPath(url.searchParams.get("next"), origin),
          origin,
        ),
      );
    }
  }
  return NextResponse.redirect(new URL("/account/sign-in?error=link", origin));
}
