import { getBook } from "@/lib/parse";

/**
 * THE ACCESS SEAM.
 *
 * Every decision about "may this visitor see the full companion, or only the
 * free preview?" goes through this file and nowhere else. When the login and
 * entitlement database land, `hasMembership()` is the ONLY function that
 * changes — no route, component or page needs touching.
 *
 * Why a seam rather than gating inline: the answer to "is this gated?" has to
 * be identical on the page card, the practice screen, the API and anything
 * added later. Scattered checks drift, and a gate that is 95% applied is not
 * a gate. See ACCESS_MODEL.md in the book repo.
 *
 * WHAT IS DELIBERATELY NOT GATED, and must stay ungated (ACCESS_MODEL.md):
 *   - the landing page
 *   - the book preview (first `preview_pages` pages)
 *   - the full vocabulary index and the root-family appendix
 *   - any URL printed in the book — a printed link must NEVER dead-end;
 *     signed out it explains and offers sign-in, at the same URL.
 */

/** Free-tier depth for a book: pages 1..N are open to everyone. */
export function previewDepth(slug: string): number {
  return getBook(slug).preview_pages;
}

/**
 * Is this page inside the free preview?
 *
 * Non-story pages (cover, contents, appendix) are always open: they carry no
 * story text, so gating them protects nothing and only breaks links.
 */
export function isFreePage(slug: string, page: number): boolean {
  const book = getBook(slug);
  if (book.non_story_pages.includes(page)) return true;
  return page <= book.preview_pages;
}

/**
 * Does the current visitor hold an active membership?
 *
 * STUB — always false. Nothing is gated yet because `GATE_ENABLED` is off
 * (see below); this returning false is what makes the gate *testable* the
 * moment the flag flips, rather than silently letting everyone through
 * because the stub said yes.
 *
 * TO WIRE THIS UP, replace the body with a session lookup:
 *
 *   const session = await auth.api.getSession({ headers: await headers() });
 *   if (!session) return false;
 *   return hasActiveEntitlement(session.user.id);
 *
 * It is async already so that change needs no signature edit at any call
 * site. See ACCOUNTS_PLAN.md for the entitlement model — one parent account
 * owns the entitlement, child profiles hang off it, and the source (book
 * activation / web subscription / app store) does not matter here.
 */
export async function hasMembership(): Promise<boolean> {
  return false;
}

/**
 * Master switch. While false NOTHING is gated and the site behaves exactly
 * as it does today.
 *
 * This exists so the gate can be built, reviewed and deployed in a state
 * where it cannot break a live site, then turned on in one commit. Flip it
 * only once `hasMembership()` is real — turning it on against the stub locks
 * every visitor, including paying ones, out of everything past the preview.
 *
 * Target: on before the book is listed (25 Aug 2026). Until then the whole
 * companion is public, which is the state the landing page copy assumes is
 * temporary.
 */
export const GATE_ENABLED = false;

/**
 * The one question callers should ask.
 *
 * Returns true when the visitor may see the full content for this page.
 * Order matters: the free preview is checked before membership, so a
 * signed-out visitor never gets a sign-in prompt for a page that was always
 * free.
 */
export async function canViewPage(
  slug: string,
  page: number,
): Promise<boolean> {
  if (!GATE_ENABLED) return true;
  if (isFreePage(slug, page)) return true;
  return hasMembership();
}
