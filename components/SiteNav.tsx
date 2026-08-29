import Link from "next/link";
import { buyLabel, CATALOGUE } from "@/lib/catalogue";
import { getBook } from "@/lib/parse";

/**
 * The site's navigation: inline links on a wide screen, a disclosure menu on
 * a narrow one.
 *
 * "Why we made this" previously existed only as a line in the landing-page
 * footer, which meant the long-form case for the book was reachable only by
 * scrolling past everything it was meant to support. Anything worth writing
 * is worth being able to find.
 *
 * NO JAVASCRIPT. This is a native <details>, the same instinct as the
 * checkbox-driven `.flip` card in globals.css — the platform already has a
 * disclosure widget, it is keyboard accessible and screen-reader announced
 * for free, and it works before hydration. A click-outside-to-close handler
 * would be the only thing a JS version bought, and it is not worth shipping
 * a client component on eight otherwise-static routes for it.
 *
 * TWO buttons stay OUTSIDE the menu at every width, and their order is the
 * whole funnel:
 *
 *   The buy button is primary and blue, and NAMES the part — "Get Volume 1,
 *   Part 1". Never "Book one": to a teacher "Book 1" means the whole first
 *   volume. Most people arriving here have not bought anything, and selling the
 *   book is what this site is for.
 *
 *   "Book companion" is now the outline button rather than the blue one. It
 *   is the way in for someone who ALREADY owns the book, so it must never be
 *   a tap away behind a hamburger — but it should not out-shout the sale.
 */

/**
 * Where the buy button points and what it says, or null if nothing is on sale.
 *
 * Prefers the book being read, so a Yusuf page sells Yusuf the day it lists.
 * Falls back to the first published book that has a listing, because this nav
 * also renders where there is no book in context — the landing page.
 *
 * Returns null rather than guessing when nothing has a buy_url, so the button
 * disappears entirely rather than pointing nowhere. Same rule the hero CTA
 * has always followed.
 */
function buyUrlFor(bookSlug?: string): { url: string; label: string } | null {
  const urlOf = (slug: string): { url: string; label: string } | null => {
    try {
      const b = getBook(slug);
      return b.buy_url ? { url: b.buy_url, label: buyLabel(slug) } : null;
    } catch {
      return null;
    }
  };
  if (bookSlug) {
    const own = urlOf(bookSlug);
    if (own) return own;
  }
  for (const entry of CATALOGUE) {
    if (entry.status === "on-sale" && entry.slug) {
      const url = urlOf(entry.slug);
      if (url) return url;
    }
  }
  return null;
}

type Props = {
  /** When set, adds the link to that book's full page index. */
  bookSlug?: string;
  /** The landing page already renders "Look inside" a screen below; linking
   *  to an anchor on the page you are on is noise, so it can be dropped. */
  hideInside?: boolean;
  /**
   * Whether a parent is signed in, so the link can say so.
   *
   * Passed only by routes that already read the session, which is why it is
   * optional rather than looked up here: reading it inside this component
   * would make the static landing page render per request for one word.
   * Left unset, the link reads "Sign in" as it always did.
   */
  signedIn?: boolean;
};

export default function SiteNav({ bookSlug, hideInside, signedIn }: Props) {
  const buy = buyUrlFor(bookSlug);

  const links = [
    { href: "/#stories", label: "The stories" },
    ...(hideInside ? [] : [{ href: "/#inside", label: "Look inside" }]),
    { href: "/about", label: "Why we made this" },
    ...(bookSlug
      ? [{ href: `/books/${bookSlug}#every-page`, label: "Page by page" }]
      : []),
  ];

  return (
    /* ml-auto below sm is load-bearing, not tidying. On the landing page the
       header is flex-wrap: a hero-size lockup plus these three controls does
       not fit a phone, so the nav wraps onto its own line — and
       `justify-between` with one item on a line puts it hard LEFT. The menu
       panel below is anchored `right-0`, so it opened at x = -172 and was
       clipped away by the page's overflow-x-hidden. Measured on the live site
       at 375px AND at 412px, so it was never an iPhone bug; Android just
       tends to meet this menu on a book page, where HomeBar never wraps.
       Right-aligning the wrapped row is what keeps `right-0` pointing at
       screen. sm:ml-0 leaves the desktop header's justify-between alone. */
    <div className="ml-auto flex items-center gap-2 sm:ml-0 sm:gap-4">
      {/* Wide screens: the links are short enough to simply show. A
          hamburger on a desktop hides three words behind a click. */}
      <div className="hidden items-center gap-5 sm:flex">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-ink/70 hover:text-brand-blue inline-flex min-h-[44px] items-center text-[14px] transition-colors duration-150 ease-out"
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* The sale. Blue, present at every width, never behind the hamburger.
          The label shortens below sm for the same reason the companion label
          does: three controls plus the lockup is tight on a 360px phone. */}
      {buy && (
        <a
          href={buy.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-brand-blue text-paper inline-flex min-h-[44px] shrink-0 items-center rounded-xl px-3 text-[14px] font-medium whitespace-nowrap sm:px-4 transition-transform duration-150 ease-out hover:-translate-y-0.5"
        >
          <span className="sm:hidden">Buy</span>
          <span className="hidden sm:inline">{buy.label}</span>
        </a>
      )}

      {/* The way in for a parent. Named "Sign in" rather than "Book
          companion", and labelled at EVERY width rather than icon-only on a
          phone: bug reports said the site looked like it had no accounts at
          all, which is exactly what an unlabelled book glyph looks like.
          Measured at 360px on a book page — lockup, menu, Buy and this label
          end at 336 of 360, no overflow — so the label costs nothing that the
          icon was buying.

          /account, not /account/sign-in, because /account redirects a
          signed-out visitor to sign-in and sign-in redirects a signed-in one
          back to /account. One href is right in both states.

          The label was state-blind, and it was reported: a book page saying
          "Saving progress for Sara" above a button offering to sign you in
          reads as a broken session. It is now told, rather than looking the
          session up itself — see `signedIn` above for why. Routes that do not
          pass it still read "Sign in", which is right for the landing page
          and harmless elsewhere, since the href is correct in both states. */}
      <Link
        href="/account"
        className="border-brand-blue/40 text-brand-blue hover:border-brand-blue inline-flex min-h-[44px] shrink-0 items-center rounded-xl border px-3 text-[14px] font-medium whitespace-nowrap transition-colors duration-150 ease-out sm:px-4"
      >
        {signedIn ? "Your account" : "Sign in"}
      </Link>

      {/* Narrow screens: disclosure menu, and LAST in the row on purpose.
          The panel is anchored `right-0` to this <details>, so wherever the
          hamburger sits is where the panel's right edge sits. With the menu
          first, its right edge was ~200px from the left on a phone and a
          240px panel opened at x = -29, off-screen and clipped. Last in the
          row puts that edge at the row's own right edge, which is the one
          place the panel can always open inward. Verified by measuring
          getBoundingClientRect at 320/360/375/412 on both the landing header
          and HomeBar. Measure the rect; a screenshot harness has lied about
          this bar's layout before. */}
      <details className="group relative sm:hidden">
        <summary
          aria-label="Menu"
          className="text-ink/70 border-ink/15 [&::-webkit-details-marker]:hidden flex min-h-[44px] min-w-[44px] cursor-pointer list-none items-center justify-center rounded-xl border px-3"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 4.5h14M2 9h14M2 13.5h14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </summary>
        <nav className="border-ink/10 bg-paper absolute right-0 z-20 mt-2 w-[240px] rounded-2xl border p-2 shadow-[0_18px_40px_-24px_rgba(26,42,74,0.45)]">
          {buy && (
            <>
              <a
                href={buy.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand-blue text-paper flex min-h-[48px] items-center justify-center rounded-xl px-3 text-[15px] font-medium"
              >
                {buy.label} on Amazon
              </a>
              <div className="border-ink/10 my-2 border-t" />
            </>
          )}
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-ink/80 hover:bg-sand/30 flex min-h-[48px] items-center rounded-xl px-3 text-[15px]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </details>
    </div>
  );
}
