import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/safe-redirect";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(
        new URL(
          safeRedirectPath(url.searchParams.get("next"), url.origin),
          url.origin,
        ),
      );
    }
  }
  return NextResponse.redirect(new URL("/account/sign-in?error=link", url.origin));
}
