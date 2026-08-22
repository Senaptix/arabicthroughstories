import "server-only";
import { headers } from "next/headers";

/**
 * Our own public origin, e.g. "https://qasaskids.com".
 *
 * DO NOT derive this from `request.url`. Behind nginx in standalone mode Next
 * builds that as `https://localhost:3000`, regardless of nginx forwarding the
 * Host header correctly — so anything constructed from it points at a machine
 * the visitor does not have. That is not theoretical: it is what sent a real
 * tester to localhost after she confirmed her email, and it is invisible in
 * development, where localhost happens to be right.
 *
 * The configured value is the only thing that is true in every environment.
 */
export async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  return (await headers()).get("origin") ?? "https://qasaskids.com";
}
