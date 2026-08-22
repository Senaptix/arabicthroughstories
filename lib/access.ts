import { cache } from "react";
import { getBook } from "@/lib/parse";
import { getParentId, requireProgressContext } from "@/lib/account";
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
 * The parent's entitlement row, or null.
 *
 * Cached per request, so the page card, the gate notice and the account
 * banner can each ask without three round trips to the database.
 */
export const getEntitlement = cache(async (): Promise<Entitlement | null> => {
  const parentId = await getParentId();
  if (!parentId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entitlements")
    .select("source, expires_at")
    .eq("parent_id", parentId)
    .maybeSingle();

  if (error || !data) return null;

  // Read the clock HERE, not in a component. This function is cached per
  // request, so every caller sees the same instant — and a React component
  // that called Date.now() itself would be impure by the letter of the rule
  // and unstable in spirit if it ever re-rendered.
  const expiresAt = Date.parse(data.expires_at);
  const now = Date.now();

  return {
    source: data.source as EntitlementSource,
    expiresAt,
    expired: expiresAt <= now,
    daysLeft: Math.max(0, Math.ceil((expiresAt - now) / 86_400_000)),
  };
});

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

export const getMembershipState = cache(async (): Promise<MembershipState> => {
  if (!(await getParentId())) return "signed-out";
  const entitlement = await getEntitlement();
  if (!entitlement) return "not-activated";
  return entitlement.expiresAt > Date.now() ? "active" : "lapsed";
});

export async function hasMembership(): Promise<boolean> {
  return (await getMembershipState()) === "active";
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
  return hasMembership();
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
