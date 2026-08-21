import Link from "next/link";
import BrandLockup from "@/components/BrandLockup";

/**
 * A slim sticky bar with a link home and, where a book is in context, a
 * link to that book's full page index ("Every page" — see BookOverview).
 *
 * WEBSITE_PLAN.md originally said the QR landing page should carry no
 * navigation chrome at all — "a page a parent hands a five-year-old
 * shouldn't have anything else to tap". In practice a scanned page was a
 * dead end: no way out except the browser's own back button, which does
 * nothing when the scan opened a fresh tab. One link out, in the same place
 * on every page, is the smallest thing that fixes that.
 *
 * The index itself stays where it already lives, at the bottom of the book
 * page — this only adds a one-click way to reach it from a page card
 * without scrolling back up through the whole book overview first.
 *
 * Server component — it is links, not an interaction.
 */
export default function HomeBar({ bookSlug }: { bookSlug?: string }) {
  return (
    <div className="border-ink/10 bg-paper/90 sticky top-0 z-10 border-b backdrop-blur">
      <nav className="mx-auto flex min-h-[58px] w-full max-w-[640px] items-center justify-between gap-4 px-6 sm:px-8">
        <BrandLockup />
        <div className="flex items-center gap-4">
          {bookSlug && (
            <Link
              href={`/books/${bookSlug}#every-page`}
              className="text-brand-blue hidden min-h-[48px] items-center text-[14px] underline-offset-4 hover:underline sm:inline-flex"
            >
              Page by page
            </Link>
          )}
          {/* "Book companion", not "Parent area": the label has to name what
              is behind it. A parent who has just bought the book is looking
              for the thing that came with the book, not for an account
              settings screen. Styled as a button for the same reason — it is
              the way in to everything the book paid for, so it should not
              read as chrome. */}
          <Link
            href="/account"
            className="bg-brand-blue text-paper inline-flex min-h-[44px] items-center rounded-xl px-4 text-[14px] font-medium"
          >
            Book companion
          </Link>
        </div>
      </nav>
    </div>
  );
}
