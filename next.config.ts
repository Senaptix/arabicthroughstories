import type { NextConfig } from "next";

/*
 * Nothing platform-specific here on purpose (WEBSITE_BUILD.md): Vercel for
 * the dev phase, Hostinger VPS later.
 */
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
