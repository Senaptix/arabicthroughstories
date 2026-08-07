import type { VocabEntry } from "@/lib/schema";

/**
 * The page's "new words" glossary. Mirrors the book's glossary box: two
 * columns (Arabic word / English gloss), separated by spacing rather than
 * table rules. See WEBSITE_DESIGN.md ("Word list (glossary)").
 *
 * Server component — no interactivity here.
 */
export default function WordList({ words }: { words: VocabEntry[] }) {
  if (words.length === 0) return null;

  return (
    <section aria-label="New words" className="flex flex-col gap-3">
      <h2
        lang="ar"
        dir="rtl"
        className="text-brand-blue font-semibold"
        style={{
          fontFamily: "var(--font-arabic)",
          fontSize: "clamp(24px, 5vw, 30px)",
          lineHeight: 1.8,
          textAlign: "start",
        }}
      >
        كَلِمَاتٌ جَدِيدَةٌ
      </h2>

      <dl className="flex flex-col gap-3">
        {words.map((word) => (
          <div
            key={word.index}
            className="grid items-baseline gap-x-4"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
            <dt
              lang="ar"
              dir="rtl"
              className="text-ink"
              style={{
                fontFamily: "var(--font-arabic)",
                fontSize: "clamp(24px, 5vw, 30px)",
                lineHeight: 1.8,
                textAlign: "start",
              }}
            >
              {word.ar}
            </dt>
            <dd
              lang="en"
              className="text-ink/80"
              style={{
                fontFamily: "var(--font-latin)",
                fontSize: "15px",
                lineHeight: 1.7,
                textAlign: "left",
              }}
            >
              {word.en}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
