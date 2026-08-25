import Link from "next/link";
import { CATALOGUE, type CatalogueStatus } from "@/lib/catalogue";

/**
 * The twelve stories, and where each one has got to.
 *
 * The site used to be a landing page for one book, which misrepresented what
 * this is: an edition of a twelve-story work, being made one story at a time.
 * A visitor who cannot see the shape of the whole thing has no reason to think
 * there will be a second book, and no way to tell that the second book's Arabic
 * is already readable.
 *
 * Deliberately shows the unmade ones too. A list that quietly stopped after the
 * two we have would read as a two-book series; the point is that it is not.
 * Being honest about what is not started costs nothing and makes the two that
 * are real more believable.
 */

const STATUS: Record<
  CatalogueStatus,
  { label: string; tone: string; note: string }
> = {
  "on-sale": {
    label: "Out now",
    tone: "bg-brand-blue text-paper",
    note: "Printed book, audio, words and practice",
  },
  "text-online": {
    label: "Arabic online",
    tone: "bg-sand text-ink/80",
    note: "Read the text now — recordings and pictures being made",
  },
  planned: {
    label: "To come",
    tone: "bg-ink/8 text-ink/55",
    note: "",
  },
};

export default function SeriesIndex({ arabicTitles }: { arabicTitles: Record<string, string> }) {
  return (
    <ul className="divide-ink/10 border-ink/12 divide-y overflow-hidden rounded-2xl border">
      {CATALOGUE.map((story, i) => {
        const s = STATUS[story.status];
        const ar = story.slug ? arabicTitles[story.slug] : undefined;

        const inner = (
          <div className="flex items-center gap-4 px-5 py-4">
            <span
              aria-hidden="true"
              className="text-ink/30 w-6 shrink-0 text-[14px] tabular-nums"
            >
              {i + 1}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-ink text-[16px] font-medium">
                  {story.titleEn ?? `The story of ${story.prophet}`}
                </span>
                {ar && (
                  <span
                    lang="ar"
                    dir="rtl"
                    className="text-ink/65"
                    style={{
                      fontFamily: "var(--font-arabic)",
                      fontSize: "17px",
                      lineHeight: 1.9,
                    }}
                  >
                    {ar}
                  </span>
                )}
              </div>
              <p className="text-ink/50 mt-0.5 text-[14px]">
                {story.titleEn ? `The story of ${story.prophet}` : ""}
                {story.titleEn && s.note ? " · " : ""}
                {s.note}
              </p>
            </div>

            <span
              className={`${s.tone} shrink-0 rounded-full px-3 py-1 text-[12px] font-medium whitespace-nowrap`}
            >
              {s.label}
            </span>
          </div>
        );

        // Only a story with pages gets a link. A "to come" row that navigated
        // somewhere would be a promise the site cannot keep.
        return (
          <li key={story.prophet}>
            {story.slug ? (
              <Link
                href={`/books/${story.slug}`}
                className="hover:bg-sand/25 block transition-colors"
              >
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}
