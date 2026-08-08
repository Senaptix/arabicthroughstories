import Link from "next/link";

/**
 * A slim sticky bar with one link home.
 *
 * WEBSITE_PLAN.md originally said the QR landing page should carry no
 * navigation chrome at all — "a page a parent hands a five-year-old
 * shouldn't have anything else to tap". In practice a scanned page was a
 * dead end: no way out except the browser's own back button, which does
 * nothing when the scan opened a fresh tab. One link out, in the same place
 * on every page, is the smallest thing that fixes that.
 *
 * Server component — it is a link, not an interaction.
 */
export default function HomeBar() {
  return (
    <div className="border-ink/10 bg-paper/90 sticky top-0 z-10 border-b backdrop-blur">
      <nav className="mx-auto flex w-full max-w-[640px] items-center px-6 sm:px-8">
        <Link
          href="/"
          className="text-brand-blue inline-flex min-h-[48px] items-center text-[14px] underline-offset-4 hover:underline"
        >
          ← Home
        </Link>
      </nav>
    </div>
  );
}
