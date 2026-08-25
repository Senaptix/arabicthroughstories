import Link from "next/link";
import { CATALOGUE } from "@/lib/catalogue";
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
 *   "Get the book" is primary and blue. Most people arriving here have not
 *   bought anything, and selling the book is what this site is for.
 *
 *   "Book companion" is now the outline button rather than the blue one. It
 *   is the way in for someone who ALREADY owns the book, so it must never be
 *   a tap away behind a hamburger — but it should not out-shout the sale.
 */

/**
 * Where "Get the book" points, or null if nothing is on sale yet.
 *
 * Prefers the book being read, so a Yusuf page sells Yusuf the day it lists.
 * Falls back to the first published book that has a listing, because this nav
 * also renders where there is no book in context — the landing page.
 *
 * Returns null rather than guessing when nothing has a buy_url, so the button
 * disappears entirely rather than pointing nowhere. Same rule the hero CTA
 * has always followed.
 */
function buyUrlFor(bookSlug?: string): string | null {
  const urlOf = (slug: string): string | null => {
    try {
      return getBook(slug).buy_url || null;
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
};

export default function SiteNav({ bookSlug, hideInside }: Props) {
  const buyUrl = buyUrlFor(bookSlug);

  const links = [
    { href: "/#stories", label: "The stories" },
    ...(hideInside ? [] : [{ href: "/#inside", label: "Look inside" }]),
    { href: "/about", label: "Why we made this" },
    ...(bookSlug
      ? [{ href: `/books/${bookSlug}#every-page`, label: "Page by page" }]
      : []),
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-4">
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

      {/* Narrow screens: disclosure menu. */}
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
          {buyUrl && (
            <>
              <a
                href={buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand-blue text-paper flex min-h-[48px] items-center justify-center rounded-xl px-3 text-[15px] font-medium"
              >
                Get the book on Amazon
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

      {/* The sale. Blue, present at every width, never behind the hamburger.
          The label shortens below sm for the same reason the companion label
          does: three controls plus the lockup is tight on a 360px phone. */}
      {buyUrl && (
        <a
          href={buyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-brand-blue text-paper inline-flex min-h-[44px] shrink-0 items-center rounded-xl px-3 text-[14px] font-medium whitespace-nowrap sm:px-4 transition-transform duration-150 ease-out hover:-translate-y-0.5"
        >
          <span className="sm:hidden">Buy</span>
          <span className="hidden sm:inline">Get the book</span>
        </a>
      )}

      {/* Shortened below sm for breathing room, not because it broke:
          measured in a real 360px viewport, "Book companion" still fits
          beside the lockup and the menu button with no overflow. It just
          leaves the bar edge-to-edge, and ~30px of air is worth more than
          the word "Book" on a phone. The label still names what it opens —
          the thing that came with the book, not "sign in".

          Headless screenshots said this was clipped at 390px. They were
          wrong: `chrome --headless --window-size` did not give a true 390px
          CSS viewport here, and the rendering it produced had the wrong
          breakpoint applied. Measure getBoundingClientRect in a real
          viewport before believing a screenshot harness about layout. */}
      <Link
        href="/account"
        aria-label="Book companion"
        className="border-brand-blue/40 text-brand-blue hover:border-brand-blue inline-flex min-h-[44px] shrink-0 items-center rounded-xl border px-3 text-[14px] font-medium whitespace-nowrap transition-colors sm:px-4 duration-150 ease-out"
      >
        {/* Icon-only below sm. Measured: with a text label the row needed
            390px, which overflows a 360px Android phone — and 360 is one of
            the two commonest widths there is. The companion is the secondary
            action now that the book is on sale, so it is the one that gives
            up its label rather than the sale. aria-label keeps it announced. */}
        <svg
          className="sm:hidden"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2.5 3.5h5a2 2 0 0 1 2 2v9a1.6 1.6 0 0 0-1.6-1.6H2.5zM15.5 3.5h-5a2 2 0 0 0-2 2v9a1.6 1.6 0 0 1 1.6-1.6h5.4z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
        <span className="hidden sm:inline">Book companion</span>
      </Link>
    </div>
  );
}
