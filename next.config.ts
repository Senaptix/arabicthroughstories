import type { NextConfig } from "next";

/*
 * Nothing platform-specific here on purpose (WEBSITE_BUILD.md): Vercel for
 * the dev phase, Hostinger VPS later. Moving to the VPS is a one-line
 * addition of `output: "standalone"` — verified to build — not a rebuild.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
