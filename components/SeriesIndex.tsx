import Link from "next/link";
import {
  CATALOGUE,
  VOLUME_TITLES,
  type CatalogueStatus,
} from "@/lib/catalogue";

/**
 * The whole work, volume by volume, and where each story has got to.
 *
 * The site used to be a landing page for one book, which misrepresented what
 * this is: an edition of a four-volume work, being made one story at a time. A
 * visitor who cannot see the shape of the whole thing has no reason to think
 * there will be a second book, and no way to tell that the second book's
 * Arabic is already readable.
 *
 * Grouped by الجزء because that is how the work is published and taught, and
 * because it explains the gaps: volume two is three stories, not one.
 *
 * NAMING. Never "Book one". Shaykh Abul Hasan's set is five books — Books 1-4
 * are the Prophets' stories and Book 5 is the Seerah — so to a teacher "Book
 * 1" already means the whole first volume. Each story is a PART of its volume,
 * and the volume heading says which Book it is so a teacher recognises it.
 *
 * Deliberately shows the unmade ones too. A list that quietly stopped after
 * the two we have would read as a two-book series; the point is that it is
 * not. Being honest about what is not started costs nothing and makes the two
 * that are real more believable.
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
  planned: { label: "To come", tone: "bg-ink/8 text-ink/55", note: "" },
};

export default function SeriesIndex({
  arabicTitles,
}: {
  /** Vowelled cover titles from each book's own yaml, where the book exists. */
  arabicTitles: Record<string, string>;
}) {
  const volumes = [...new Set(CATALOGUE.map((s) => s.volume))].sort();

  return (
    <div className="flex flex-col gap-8">
      {volumes.map((v) => (
        <div key={v}>
          <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p
              lang="ar"
              dir="rtl"
              className="text-brand-blue"
              style={{
                fontFamily: "var(--font-arabic)",
                fontSize: "18px",
                lineHeight: 1.9,
                textAlign: "start",
              }}
            >
              {VOLUME_TITLES[v]}
            </p>
            <p className="text-ink/60 text-[14px] font-medium">
              Volume {v}
            </p>
            {/* Teachers know the original set as Books 1-5. Saying so here is
                what makes this list recognisable to the people most likely to
                recommend it. */}
            <p className="text-ink/40 text-[13px]">
              Book {v} of Shaykh Abul Hasan&rsquo;s set
            </p>
          </div>

          <ul className="divide-ink/10 border-ink/12 divide-y overflow-hidden rounded-2xl border">
            {CATALOGUE.filter((s) => s.volume === v).map((story) => {
              const s = STATUS[story.status];
              // The yaml title is the one printed on our cover, and it is
              // vowelled. Fall back to Shaykh Abul Hasan's own title for the
              // stories we have not made.
              const ar =
                (story.slug && arabicTitles[story.slug]) || story.titleAr;
              // A review chapter has no prophet, so it gets no "the story of".
              const english =
                story.titleEn ?? `The story of ${story.prophet}`;
              const sub = [
                `Part ${story.part}`,
                story.titleEn && story.prophet
                  ? `The story of ${story.prophet}`
                  : null,
                s.note || null,
              ]
                .filter(Boolean)
                .join(" · ");

              const inner = (
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span
                        lang="ar"
                        dir="rtl"
                        className="text-ink"
                        style={{
                          fontFamily: "var(--font-arabic)",
                          fontSize: "19px",
                          lineHeight: 1.9,
                        }}
                      >
                        {ar}
                      </span>
                      <span className="text-ink/70 text-[15px]">{english}</span>
                    </div>
                    {sub && (
                      <p className="text-ink/50 mt-0.5 text-[14px]">{sub}</p>
                    )}
                  </div>

                  <span
                    className={`${s.tone} shrink-0 rounded-full px-3 py-1 text-[12px] font-medium whitespace-nowrap`}
                  >
                    {s.label}
                  </span>
                </div>
              );

              // Only a story with pages gets a link. A "to come" row that
              // navigated somewhere would be a promise the site cannot keep.
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
        </div>
      ))}
    </div>
  );
}
