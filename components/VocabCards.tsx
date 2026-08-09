import type { VocabEntry } from "@/lib/schema";

/**
 * The page's new words as cards: Arabic showing, tap to turn one over and
 * see the English.
 *
 * Recall before recognition — a child who reads the Arabic and then checks
 * is doing something different from one who reads a bilingual list, which
 * lets the eye slide straight to the English. The Arabic is the side that
 * faces up for that reason.
 *
 * No JavaScript: the flip is a checkbox and a CSS transform (see .flip in
 * globals.css). That keeps this a server component and keeps the page-card
 * route's JS budget where it is.
 */
export default function VocabCards({
  words,
  idPrefix,
}: {
  words: Pick<VocabEntry, "ar" | "en">[];
  /** Checkbox ids must be unique across the page, and a page can show more
   *  than one of these — the reader's panel plus a page card, say. */
  idPrefix: string;
}) {
  if (words.length === 0) {
    return (
      <p className="text-ink/55" style={{ fontSize: "15px", lineHeight: 1.6 }}>
        No new words on this page.
      </p>
    );
  }

  return (
    <div>
      {/* Arabic-only, matching RootFamily's heading — a recurring phrase a
          child learns to recognise as "this section" without an English
          crutch (WEBSITE_DESIGN.md's page-card mockup). */}
      <h2
        lang="ar"
        dir="rtl"
        className="text-brand-blue mb-3 font-semibold"
        style={{
          fontFamily: "var(--font-arabic)",
          fontSize: "clamp(24px, 5vw, 30px)",
          lineHeight: 1.8,
          textAlign: "start",
        }}
      >
        كَلِمَاتٌ جَدِيدَةٌ
      </h2>

      <p
        className="text-ink/55 mb-3"
        style={{ fontSize: "14px", lineHeight: 1.5 }}
      >
        Tap a word to see what it means.
      </p>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {words.map((w, i) => {
          const id = `${idPrefix}-w${i}`;
          return (
            <li key={w.ar}>
              <label
                htmlFor={id}
                className="flip block cursor-pointer"
                style={{ minHeight: "96px" }}
              >
                {/* Visually hidden, not display:none — it must stay focusable
                    so the card can be flipped from the keyboard. */}
                <input
                  type="checkbox"
                  id={id}
                  className="peer sr-only"
                  aria-label={`${w.ar} — show the English`}
                />
                <span
                  className="flip-inner peer-focus-visible:outline-brand-blue block h-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
                  style={{ minHeight: "96px" }}
                >
                  <span
                    lang="ar"
                    dir="rtl"
                    className="flip-face border-ink/10 bg-surface/70 flex h-full min-h-[96px] items-center justify-center rounded-2xl border px-3 py-4 text-center"
                    style={{
                      fontFamily: "var(--font-arabic)",
                      fontSize: "clamp(24px, 5vw, 28px)",
                      lineHeight: 1.8,
                    }}
                  >
                    {w.ar}
                  </span>
                  <span
                    lang="en"
                    className="flip-face flip-back border-brand-blue/25 bg-brand-blue/10 flex h-full min-h-[96px] items-center justify-center rounded-2xl border px-3 py-4 text-center"
                    style={{ fontSize: "15px", lineHeight: 1.5 }}
                  >
                    {w.en}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
