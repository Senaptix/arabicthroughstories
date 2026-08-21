import { getBook } from "@/lib/parse";
import { getParentId } from "@/lib/account";

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
 * TODAY: a confirmed, signed-in parent account IS the membership. There is
 * no entitlement table yet — book activation, subscriptions and the app
 * stores are all still to come (ACCOUNTS_PLAN.md) — so signing in is what
 * separates a buyer from a passer-by.
 *
 * WHEN ACTIVATION LANDS, this becomes:
 *
 *   const parentId = await getParentId();
 *   if (!parentId) return false;
 *   return hasActiveEntitlement(parentId);   // <- the only line to add
 *
 * Keeping that check here, rather than at any call site, is the whole point
 * of this file: the answer to "is this person allowed in" is decided once.
 */
export async function hasMembership(): Promise<boolean> {
  return (await getParentId()) !== null;
}

/**
 * Master switch. While false NOTHING is gated and the site behaves exactly
 * as it does today.
 *
 * ON since 2026-08-21, now that `hasMembership()` reads a real session.
 * Before that it was off precisely because the stub returned false — with
 * the two out of step, flipping this would have locked out every visitor
 * including paying ones.
 *
 * Turning it off again is a legitimate emergency lever: it reopens the whole
 * companion to everyone rather than taking the site down, which is the right
 * failure direction for a children's book. It is not a way to skip fixing
 * whatever went wrong.
 */
export const GATE_ENABLED = true;

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
