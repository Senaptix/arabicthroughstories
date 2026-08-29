import { cache } from "react";
import { getBook } from "@/lib/parse";
import { getParentId, requireProgressContext } from "@/lib/account";
import { getAdminAccess } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

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
 * An account alone grants nothing. The parent must have an entitlement whose
 * expiry is still in the future. Keeping that check here, rather than at any
 * call site, is the whole point of this file: the answer to "is this person
 * allowed in" is decided once.
 */
export type MembershipState =
  | "signed-out"
  | "not-activated"
  | "active"
  | "lapsed";

/**
 * How the entitlement was earned. `provisional` is the 30-day window granted
 * at signup and is the only one still waiting on a receipt.
 */
export type EntitlementSource =
  | "provisional"
  | "book_activation"
  | "direct_sale";

export type Entitlement = {
  source: EntitlementSource;
  /** Epoch ms. */
  expiresAt: number;
  /** Already lapsed. */
  expired: boolean;
  /** Whole days remaining, never negative. */
  daysLeft: number;
};

/**
 * Every entitlement this parent holds, keyed by book slug.
 *
 * ONE row per book since 2026-08-24. Buying a book opens that book; it does
 * not open the series. The site hosts the full text and audio of each title,
 * so a shared entitlement was a substitute for the next purchase rather than a
 * reward for the last one.
 *
 * Cached per request, so the page card, the gate notice and the account banner
 * each ask without three round trips.
 */
export const getEntitlements = cache(
  async (): Promise<Map<string, Entitlement>> => {
    const out = new Map<string, Entitlement>();
    const parentId = await getParentId();
    if (!parentId) return out;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("entitlements")
      .select("book_slug, source, expires_at")
      .eq("parent_id", parentId);

    if (error || !data) return out;

    // Read the clock HERE, not in a component. This function is cached per
    // request, so every caller sees the same instant — and a React component
    // that called Date.now() itself would be impure by the letter of the rule
    // and unstable in spirit if it ever re-rendered.
    const now = Date.now();

    for (const row of data) {
      const expiresAt = Date.parse(row.expires_at);
      out.set(row.book_slug, {
        source: row.source as EntitlementSource,
        expiresAt,
        expired: expiresAt <= now,
        daysLeft: Math.max(0, Math.ceil((expiresAt - now) / 86_400_000)),
      });
    }
    return out;
  },
);

/** This parent's entitlement for one book, or null. */
export async function getEntitlement(
  slug: string,
): Promise<Entitlement | null> {
  return (await getEntitlements()).get(slug) ?? null;
}

/**
 * The entitlement running out soonest, across every book.
 *
 * For account-page notices that are about the PARENT rather than about a
 * particular book — "your receipt is still outstanding" is one claim, not one
 * per title, and the deadline that matters is the nearest one.
 */
export async function getSoonestEntitlement(): Promise<Entitlement | null> {
  const all = [...(await getEntitlements()).values()];
  if (all.length === 0) return null;
  return all.reduce((a, b) => (b.expiresAt < a.expiresAt ? b : a));
}

/**
 * Does this parent have an order number waiting on a receipt?
 *
 * The receipt prompt keys off THIS, not the entitlement's source. The
 * provisional trigger only updates `expires_at` on conflict, so an existing
 * member who claims another book keeps source `book_activation` while very
 * much owing us a receipt. A pending row is the actual question.
 */
export const hasPendingActivation = cache(async (): Promise<boolean> => {
  const parentId = await getParentId();
  if (!parentId) return false;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activations")
    .select("id")
    .eq("parent_id", parentId)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();

  return !error && Boolean(data);
});

/**
 * Membership state FOR ONE BOOK. A parent can be active on Ibrahim and
 * not-activated on Yusuf at the same time, and the gate notice has to say
 * which of those it is.
 */
export async function getMembershipState(
  slug: string,
): Promise<MembershipState> {
  if (!(await getParentId())) return "signed-out";
  const entitlement = await getEntitlement(slug);
  if (!entitlement) return "not-activated";
  return entitlement.expiresAt > Date.now() ? "active" : "lapsed";
}

export async function hasMembership(slug: string): Promise<boolean> {
  return (await getMembershipState(slug)) === "active";
}

/**
 * Master switch. While false NOTHING is gated and the site behaves exactly
 * as it does today.
 *
 * ON since 2026-08-21. `hasMembership()` now reads the purchase entitlement,
 * so a session without an activation remains outside the full companion.
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
  if (await isAdmin()) return true;
  return hasMembership(slug);
}

/**
 * Admins see every page of every book.
 *
 * Not a convenience: the audio, the line cues and the word lists all have to
 * be checked on the page a reader actually sees, and most of a book sits
 * behind the gate long before it is published. Without this the only ways to
 * proof a page were to grant yourself an entitlement or to widen the preview,
 * and widening the preview to check page 11 publishes page 11.
 *
 * Membership is unaffected — this is a separate question with a separate
 * answer, decided by ADMIN_EMAILS rather than by anything a visitor controls.
 */
async function isAdmin(): Promise<boolean> {
  const { allowed } = await getAdminAccess();
  return allowed;
}

/**
 * Progress context, plus the access check the progress routes were missing.
 *
 * They gated on "signed in with a profile" and never asked the seam, so a
 * lapsed or never-activated account could record progress against pages it
 * cannot open. Nothing leaked — but writes landed where the gate says the
 * reader is not.
 *
 * Deliberately per-page rather than per-membership: a family reading the free
 * preview should still have that progress saved, entitlement or not. That is
 * exactly the question canViewPage already answers.
 */
export async function requireProgressAccess(slug: string, page: number) {
  const context = await requireProgressContext();
  if ("error" in context) return context;
  if (!(await canViewPage(slug, page))) return { error: "no_access" as const };
  return context;
}
