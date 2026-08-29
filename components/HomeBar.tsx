import BrandLockup from "@/components/BrandLockup";
import SiteNav from "@/components/SiteNav";

/**
 * A slim sticky bar: the brand home link, plus the shared SiteNav.
 *
 * WEBSITE_PLAN.md originally said the QR landing page should carry no
 * navigation chrome at all — "a page a parent hands a five-year-old
 * shouldn't have anything else to tap". In practice a scanned page was a
 * dead end: no way out except the browser's own back button, which does
 * nothing when the scan opened a fresh tab. One link out, in the same place
 * on every page, is the smallest thing that fixes that.
 *
 * The nav grew from that one link and now lives in SiteNav, shared with the
 * landing header so the two cannot drift. Everything it offers goes
 * somewhere already reachable — the book index, the preview, the case for
 * the book — so the original worry still holds: nothing here changes the
 * page a child is looking at.
 *
 * Server component — it is links, not an interaction. The narrow-screen
 * menu is a native <details> and ships no JS.
 */
export default function HomeBar({
  bookSlug,
  signedIn,
}: {
  bookSlug?: string;
  /** Forwarded to SiteNav so the account link can name the state it is in.
   *  Only routes that already read the session pass it; see SiteNav. */
  signedIn?: boolean;
}) {
  return (
    <div className="border-ink/10 bg-paper/90 sticky top-0 z-10 border-b backdrop-blur">
      <nav className="mx-auto flex min-h-[58px] w-full max-w-[900px] items-center justify-between gap-4 px-6 sm:px-8">
        <BrandLockup />
        <SiteNav bookSlug={bookSlug} signedIn={signedIn} />
      </nav>
    </div>
  );
}
