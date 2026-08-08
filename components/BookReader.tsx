"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import ReadAlong from "./ReadAlong";

/**
 * The on-site book preview: turn pages by clicking them, and open the
 * vocabulary for the page you are on.
 *
 * This shows a PREVIEW (`preview_pages` in the book yaml), not the whole
 * book. The site is a companion to the printed copy.
 *
 * Page images are pre-composed spreads — Arabic, English and glossary are
 * baked into the artwork — so nothing here re-renders the book's text. The
 * vocabulary panel is real parsed data, which is what makes it searchable
 * and linkable in a way the printed page cannot be.
 */

export type ReaderPage = {
  n: number;
  src: string;
  words: { ar: string; en: string }[];
  /** The clip and line cues, where this page has been recorded. */
  readAlong: { src: string; lines: { at: number; ar: string }[] } | null;
};

export default function BookReader({
  pages,
  totalPages,
  slug,
}: {
  pages: ReaderPage[];
  /** Pages in the printed book, so the preview is honest about being partial. */
  totalPages: number;
  slug: string;
}) {
  const [i, setI] = useState(0);
  const [showVocab, setShowVocab] = useState(false);

  const last = pages.length - 1;
  const page = pages[i];

  // Functional update, not `i + 1`: a child tapping quickly fires several
  // clicks inside one render, and reading `i` from the closure would make
  // them all compute the same page and silently drop turns.
  const step = useCallback(
    (delta: number) =>
      setI((cur) => Math.min(Math.max(cur + delta, 0), last)),
    [last],
  );

  // Arrow keys move through the book. Bound to the window rather than the
  // figure so it works without the reader having focus.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  return (
    <div className="flex flex-col items-center">
      {/* Clicking the page turns it — the thing a child will try first.
          The explicit controls below do the same job for anyone who won't
          discover that, and give a way back. */}
      <button
        type="button"
        onClick={() => step(1)}
        disabled={i === last}
        aria-label={
          i === last ? "End of the preview" : `Turn to page ${pages[i + 1].n}`
        }
        className="border-ink/10 bg-surface relative block w-full max-w-[440px] overflow-hidden rounded-2xl border shadow-[0_20px_50px_-30px_rgba(26,42,74,0.5)] disabled:cursor-default"
        style={{ aspectRatio: "1422 / 2000" }}
      >
        {pages.map((p, n) => (
          // All pages stay mounted so a turn is instant and never flashes a
          // blank frame. Only the neighbours load eagerly.
          <Image
            key={p.n}
            src={p.src}
            alt={`Page ${p.n}`}
            fill
            sizes="(max-width: 640px) 92vw, 440px"
            // The cover is the LCP image and always priority. For the rest,
            // `priority` and `loading` are mutually exclusive — setting both
            // is a runtime error once the reader moves off page 1.
            priority={n === 0}
            loading={n === 0 ? undefined : Math.abs(n - i) <= 1 ? "eager" : "lazy"}
            className={`object-contain transition-opacity duration-200 ease-out ${
              n === i ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          />
        ))}
      </button>

      <div className="mt-6 flex w-full max-w-[440px] items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={i === 0}
          className="border-ink/15 text-ink hover:border-ink/35 inline-flex h-12 min-w-[48px] items-center justify-center rounded-xl border px-4 transition-colors duration-150 ease-out disabled:opacity-30"
          aria-label="Previous page"
        >
          ←
        </button>

        <p className="text-ink/60" style={{ fontSize: "14px" }}>
          Page {page.n} of {pages.length}
        </p>

        <button
          type="button"
          onClick={() => step(1)}
          disabled={i === last}
          className="border-ink/15 text-ink hover:border-ink/35 inline-flex h-12 min-w-[48px] items-center justify-center rounded-xl border px-4 transition-colors duration-150 ease-out disabled:opacity-30"
          aria-label="Next page"
        >
          →
        </button>
      </div>

      {/* Read-along for the page you are on. Keyed by page so turning a page
          tears down the old audio element rather than leaving the previous
          page's narration playing under the new one. */}
      {page.readAlong && (
        <div className="mt-8 w-full max-w-[440px]">
          <ReadAlong
            key={page.n}
            src={page.readAlong.src}
            lines={page.readAlong.lines}
            label={`page ${page.n}`}
          />
        </div>
      )}

      <div className="mt-8 w-full max-w-[440px]">
        <button
          type="button"
          onClick={() => setShowVocab((v) => !v)}
          aria-expanded={showVocab}
          aria-controls="book-vocab"
          className="bg-brand-blue text-paper inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-5 font-medium"
          style={{ fontSize: "16px" }}
        >
          {showVocab ? "Hide book vocab" : "Book vocab"}
        </button>

        {showVocab && (
          <div
            id="book-vocab"
            className="border-ink/10 bg-surface/70 mt-3 rounded-2xl border px-5 py-4"
          >
            {page.words.length === 0 ? (
              <p className="text-ink/55" style={{ fontSize: "15px", lineHeight: 1.6 }}>
                No new words on this page.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {page.words.map((w) => (
                  <li
                    key={w.ar}
                    className="flex items-baseline justify-between gap-4"
                  >
                    <span
                      lang="ar"
                      dir="rtl"
                      className="text-ink"
                      style={{
                        fontFamily: "var(--font-arabic)",
                        fontSize: "clamp(24px, 5vw, 28px)",
                        lineHeight: 1.8,
                      }}
                    >
                      {w.ar}
                    </span>
                    <span
                      className="text-ink/65 text-right"
                      style={{ fontSize: "15px", lineHeight: 1.7 }}
                    >
                      {w.en}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <a
              href={`/books/${slug}/p${page.n}`}
              className="text-brand-blue mt-4 inline-flex min-h-[48px] items-center underline-offset-4 hover:underline"
              style={{ fontSize: "15px" }}
            >
              Word families and audio for this page →
            </a>
          </div>
        )}
      </div>

      <p className="text-ink/45 mt-6 text-center" style={{ fontSize: "14px", lineHeight: 1.6 }}>
        {pages.length} pages of {totalPages}. The rest is in the book.
      </p>
    </div>
  );
}
