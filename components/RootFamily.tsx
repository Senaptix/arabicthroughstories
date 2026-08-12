import Image from "next/image";
import Link from "next/link";
import type { RootFamily as RootFamilyType } from "@/lib/schema";

/**
 * Related words, grouped by the root they share.
 *
 * Reader feedback (an Arabic teacher, 2026-08-09) on the earlier version:
 *  - "I'm still not sure what 'word family' means" — the metaphor did not
 *    land in English. Section is now labelled by the caller as "Related
 *    words", and each group is titled "Root N" with the letters beside it.
 *  - "The (here) isn't clear to me" — replaced with "this page".
 *  - "just make the words clickable / they don't need to know the page
 *    number exactly" — so the WORD is the link now, and the bare page
 *    number is gone.
 *
 * Same teacher, 2026-08-10, on this version once it was live:
 *  - "some kind of chevron so people know these are accordion style" —
 *    added to each <summary>, flipped by the `group-open:` variant. No JS:
 *    <details> already drives the open state this reads off of.
 *  - "the page image/graphic at the top... will keep it engaging" — see
 *    `pageImage` below.
 *
 * Each root collapses, because a page card can carry several and the book
 * overview carries all 32 — an open list of every member buried the page.
 * Uses <details>, so it is native, keyboard-operable and needs no
 * JavaScript, keeping this a server component.
 *
 * Same teacher, 2026-08-12: "no one is sure about this phrase usratul
 * kalimaat" (أُسْرَةُ الْكَلِمَةِ, "word family") — not a term other Arabic
 * teaching sources use. They build this around الجذر (the root) instead, so
 * both Arabic headings and the Canva contents row (row 17) now read simply
 * الْجُذُورُ ("the roots"), singular/plural ambiguity and all — same word
 * works for a page card's one group or the overview's thirty-two, the same
 * way "Root 1 / Root 2" already does in English. Canva's appendix pages
 * 53-54 still use the old "family" framing throughout and were NOT touched
 * here — that's a bigger copy/pedagogy rewrite, not a label swap.
 *
 * The Arabic heading is still the CALLER's, not this component's: a page
 * card and the book overview render different amounts of content around it
 * (one page's group vs. all of them), even though the heading text itself
 * is now identical either way.
 */
export default function RootFamily({
  families,
  bookSlug,
  currentPage,
  pageImage,
}: {
  families: RootFamilyType[];
  bookSlug: string;
  /** Page being viewed, so its own word is marked rather than linked.
   *  Pass 0 where there is no current page (the book overview). */
  currentPage: number;
  /**
   * This page's own artwork, to sit above the roots. Only the page card has
   * one page to show — the book overview's roots each span many pages, so
   * it never passes this.
   */
  pageImage?: { src: string; alt: string };
}) {
  if (families.length === 0) {
    return (
      <p
        lang="en"
        className="text-ink/70"
        style={{ fontSize: "15px", lineHeight: 1.7 }}
      >
        No related words on this page.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pageImage && (
        <Image
          src={pageImage.src}
          alt={pageImage.alt}
          width={688}
          height={968}
          sizes="200px"
          className="border-ink/10 mb-1 w-[160px] rounded-xl border"
        />
      )}

      {families.map((family, i) => (
        <details
          key={family.root}
          className="group border-ink/10 bg-paper rounded-xl border"
        >
          <summary
            className="flex min-h-[48px] cursor-pointer list-none items-center gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden"
            aria-label={`Root ${i + 1}, ${family.members.length} related words`}
          >
            <span
              className="text-ink/55 shrink-0"
              style={{ fontSize: "13px", letterSpacing: "0.06em" }}
            >
              Root {i + 1}
            </span>

            <span
              lang="ar"
              dir="rtl"
              className="bg-brand-blue text-paper inline-flex shrink-0 items-center justify-center rounded-[10px] px-3 py-1"
              style={{
                fontFamily: "var(--font-arabic)",
                fontSize: "clamp(20px, 4vw, 26px)",
                lineHeight: 1.4,
                letterSpacing: "0.15em",
              }}
            >
              {family.root}
            </span>

            <span className="text-ink/45 ml-auto" style={{ fontSize: "13px" }}>
              {family.members.length} words
            </span>

            {/* Accordion affordance — points down closed, flips open. */}
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="text-ink/40 shrink-0 transition-transform duration-150 ease-out group-open:rotate-180"
              style={{ width: 16, height: 16 }}
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </summary>

          <ul className="flex flex-col gap-1 px-3 pt-1 pb-3">
            {family.members.map((member) => {
              const isHere = member.page === currentPage;
              return (
                <li key={`${member.ar}-${member.page}`}>
                  {isHere ? (
                    <span className="flex min-h-[44px] items-baseline gap-2">
                      <span
                        lang="ar"
                        dir="rtl"
                        className="text-ink"
                        style={{
                          fontFamily: "var(--font-arabic)",
                          fontSize: "clamp(24px, 5vw, 30px)",
                          lineHeight: 1.8,
                        }}
                      >
                        {member.ar}
                      </span>
                      <span
                        lang="en"
                        aria-current="location"
                        className="text-ink/50"
                        style={{ fontSize: "13px" }}
                      >
                        this page
                      </span>
                    </span>
                  ) : (
                    /* The word itself is the link — a reader does not need
                       the page number, only a way to go and see it. */
                    <Link
                      href={`/books/${bookSlug}/p${member.page}`}
                      lang="ar"
                      dir="rtl"
                      className="text-brand-blue hover:text-ink flex min-h-[44px] items-center underline decoration-dotted underline-offset-4 transition-colors duration-150 ease-out"
                      style={{
                        fontFamily: "var(--font-arabic)",
                        fontSize: "clamp(24px, 5vw, 30px)",
                        lineHeight: 1.8,
                      }}
                    >
                      {member.ar}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </details>
      ))}
    </div>
  );
}
