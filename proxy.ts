import type { NextRequest } from "next/server";
import { refreshSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return refreshSession(request);
}

// The published book routes stay outside the session proxy, preserving their
// static rendering. Only account and progress requests need cookie refreshes.
export const config = {
  matcher: [
    "/account/:path*",
    "/admin/:path*",
    "/auth/:path*",
    "/api/progress/:path*",
  ],
};
