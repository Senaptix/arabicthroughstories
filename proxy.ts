import type { NextRequest } from "next/server";
import { refreshSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return refreshSession(request);
}

// Book routes are in this list, and have to be. They ask the access seam
// whether the visitor may see the page, which reads the session — and Supabase
// rotates the refresh token when it does. A Server Component cannot write
// cookies, so the rotated token was dropped while the old one was already
// spent: the next request found no valid session, and opening a gated page
// silently signed the reader out.
//
// Only the proxy can persist that rotation, so any route that reads the
// session belongs here.
export const config = {
  matcher: [
    "/account/:path*",
    "/admin/:path*",
    "/auth/:path*",
    "/api/progress/:path*",
    "/books/:path*",
  ],
};
