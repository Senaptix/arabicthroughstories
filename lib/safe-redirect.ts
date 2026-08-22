/**
 * The ONE place that decides whether a caller-supplied redirect is safe.
 *
 * Every auth flow ends by sending the visitor somewhere they asked to go, and
 * that destination arrives from a URL or a form field — so it is attacker
 * controlled. An unchecked one is an open redirect: a crafted link takes
 * someone to qasaskids.com, they genuinely sign in or confirm their email,
 * and are then handed to a lookalike site at the exact moment they have most
 * reason to trust what happens next.
 *
 * WHY RESOLVE RATHER THAN STRING-MATCH. The obvious guard is
 *
 *     value.startsWith("/") && !value.startsWith("//")
 *
 * and it does not work. `/\evil.com` passes both tests, but the WHATWG URL
 * parser normalises the backslash to a forward slash, so the browser resolves
 * it to `https://evil.com/`. Tabs and encoded separators have similar tricks.
 * Parsing the URL and comparing the resolved origin is immune to all of them,
 * because it asks the same parser the browser will use.
 *
 * WHY THIS FILE EXISTS AT ALL. There were two copies of this function. One was
 * fixed and the other was not, and the unfixed one stayed live on the email
 * confirmation path for days — the fix looked done because the file someone
 * happened to open was correct. One implementation, imported everywhere, is
 * the actual remedy; patching the second copy would only have set up a third.
 */

/** Fallback for anything that does not resolve to our own origin. */
const HOME = "/account";

/**
 * Returns a path safe to redirect to, always on `origin`.
 *
 * The return value is deliberately path-only (no scheme, no host) so a caller
 * cannot accidentally hand an absolute URL onward.
 */
export function safeRedirectPath(
  value: string | FormDataEntryValue | null | undefined,
  origin: string,
  fallback: string = HOME,
): string {
  if (typeof value !== "string" || value === "") return fallback;

  try {
    const destination = new URL(value, origin);
    if (destination.origin !== origin) return fallback;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    // Unparseable is not "probably fine".
    return fallback;
  }
}
