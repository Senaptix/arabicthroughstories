"use client";

import { useState } from "react";

/**
 * A text-only preview, for a book that has text but no artwork yet.
 *
 * The main preview (BookReader) shows pre-composed page IMAGES — Arabic,
 * English and glossary baked into the artwork. Yusuf has none of those: the
 * pictures are still being made. So its preview shows what actually exists,
 * which is Shaykh Abul Hasan's Arabic, and says plainly what does not.
 *
 * Deliberately NOT a stripped-down BookReader. That component's whole job is
 * turning page images and it carries a vocabulary panel and a read-along;
 * none of that has anything to show here yet, and a reader full of empty
 * affordances reads as broken rather than as forthcoming.
 *
 * The Arabic never animates — feedback is a settled glyph and a changed
 * border, per WEBSITE_DESIGN.md. Vocalised Arabic in motion is unreadable,
 * and the marks are the thing being taught.
 */

export type PreviewPage = { n: number; lines: string[] };

export default function TextPreview({
  pages,
  totalStoryPages,
  slug,
}: {
  pages: PreviewPage[];
  /** Story pages in the whole book, so the preview is honest about being partial. */
  totalStoryPages: number;
  slug: string;
}) {
  const [i, setI] = useState(0);
  const page = pages[i];
  const last = pages.length - 1;

  if (!page) return null;

  return (
    <div>
      <div className="border-ink/10 bg-paper rounded-2xl border px-5 py-6 sm:px-8 sm:py-8">
        <p
          className="text-ink/45 mb-5 text-center"
          style={{ fontSize: "13px", letterSpacing: "0.08em" }}
        >
          PAGE {page.n}
        </p>

        <div dir="rtl" lang="ar" className="flex flex-col gap-3">
          {page.lines.map((line, idx) => (
            <p
              key={idx}
              className="text-ink"
              style={{
                fontFamily: "var(--font-arabic)",
                fontSize: "clamp(19px, 3.4vw, 24px)",
                lineHeight: 2.1,
                textAlign: "start",
              }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setI((n) => Math.max(0, n - 1))}
          disabled={i === 0}
          className="border-ink/15 text-ink hover:border-ink/35 inline-flex min-h-[48px] items-center rounded-xl border px-4 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35"
          style={{ fontSize: "15px" }}
        >
          ← Back
        </button>

        <p className="text-ink/50" style={{ fontSize: "14px" }}>
          {i + 1} of {pages.length} free · {totalStoryPages} in the book
        </p>

        <button
          type="button"
          onClick={() => setI((n) => Math.min(last, n + 1))}
          disabled={i === last}
          className="bg-brand-blue text-paper inline-flex min-h-[48px] items-center rounded-xl px-4 font-medium transition-transform disabled:cursor-not-allowed disabled:opacity-35"
          style={{ fontSize: "15px" }}
        >
          Next →
        </button>
      </div>

      {/* Shown at the end of the preview rather than always: while a reader is
          still turning pages the missing pieces are not what they are thinking
          about, and saying it on every page would read as an apology. */}
      {i === last && (
        <p
          className="border-brand-blue/25 bg-sand/30 text-ink/75 mt-4 rounded-xl border px-4 py-3"
          style={{ fontSize: "15px", lineHeight: 1.6 }}
        >
          <span className="text-brand-blue font-semibold">
            That is the free preview.
          </span>{" "}
          The remaining {totalStoryPages - pages.length} pages of Arabic are
          already on the site. The recordings, the pictures and the word lists
          are still being made, and the printed book follows them.{" "}
          <a
            href={`/books/${slug}`}
            className="text-brand-blue font-medium underline-offset-4 hover:underline"
          >
            See every page →
          </a>
        </p>
      )}
    </div>
  );
}
