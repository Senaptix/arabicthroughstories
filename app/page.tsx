import Image from "next/image";
import Link from "next/link";
import ReadAlong from "@/components/ReadAlong";
import { getBook, parseRootFamilies, parseVocabulary } from "@/lib/parse";
import type { VocabEntry } from "@/lib/schema";

/**
 * The landing page — a marketing surface, not a reading surface.
 *
 * Per WEBSITE_DESIGN.md ("Motion") entrance animation is welcome here, so it
 * is done with a scroll-driven CSS animation (`.reveal` in globals.css)
 * rather than Framer Motion. That keeps this route a pure server component
 * shipping no client JS at all.
 *
 * EVERY Arabic string on this page is parsed from the book's own source data
 * — none of it is typed by hand. A wrong vowel changes the word, and
 * teaching those vowels is the point of the book.
 */

const SLUG = "ibrahim";

/** The family the whole page is built around: يَسْجُدُ (p4) -> الْمَسْجِدُ (p52).
 *  ROOTS.md calls this one of the two families that justify the appendix. */
const THREAD_ROOT = "س ج د";

/**
 * A SAMPLE — three pages, not a page browser. This is a landing page; the
 * rest of the book stays in print.
 *
 * ONLY generated/passed-pages-03-24-review-v2 (book repo) may appear here —
 * the reviewed set covering pages 3-24. Ibrahim is not drawn at all: not
 * featured, not blank-faced, not shown from behind either. Not every scene
 * uses the same device — some are shot as what he sees, others are simply
 * staged so he isn't in frame (he stayed home, he was thrown in the fire
 * and isn't shown landing in it) — whichever reads best for that page, not
 * a rule applied mechanically to all of them.
 *
 * Check each page individually before adding it; don't trust the source
 * folder's own QA.md sight unseen. (An earlier note here wrongly flagged
 * this folder's page 10 as a rear-view depiction of Ibrahim — that was a
 * mix-up with a same-numbered file from a different, composed-book-page
 * batch. This folder's page 10 is a POV shot of people walking away from
 * him and is fine; corrected 2026-08-09.)
 */
const SAMPLE_ART = [
  { page: 4, file: "page-04.png", caption: "The house of idols" },
  { page: 19, file: "page-19.png", caption: "A star in the night sky" },
  { page: 21, file: "page-21.png", caption: "The sun, rising" },
];

/** How the series weans the reader off tashkeel, book by book (SERIES_PLAN.md). */
const SERIES = [
  { n: 1, label: "Fully vowelled", note: "This book" },
  { n: 2, label: "Mostly vowelled" },
  { n: 3, label: "Partially vowelled" },
  { n: 4, label: "Primarily unvowelled" },
  { n: 5, label: "Natural Arabic" },
];

/** Look a word's gloss up in the checked vocabulary index. Throws rather than
 *  rendering a word with no meaning beside it. */
function gloss(vocab: VocabEntry[], ar: string): VocabEntry {
  const found = vocab.find((v) => v.ar === ar);
  if (!found) {
    throw new Error(
      `"${ar}" is in a root family but not in ${SLUG}.vocabulary.md. The two files have drifted apart.`,
    );
  }
  return found;
}

export default function Home() {
  const book = getBook(SLUG);
  const vocab = parseVocabulary(SLUG);
  const families = parseRootFamilies(SLUG);

  // The sample page comes from the book's own metadata, capped at two by the
  // schema. The site is a companion — the rest of the text stays in the book.
  const spread = book.sample_pages[0];
  if (!spread) {
    throw new Error(`${SLUG}.yaml has no sample_pages; the landing page needs one.`);
  }
  const SAMPLE_PAGE = spread.page;

  const thread = families.find((f) => f.root === THREAD_ROOT);
  if (!thread) {
    throw new Error(`Root family "${THREAD_ROOT}" is missing from ${SLUG}.roots.md.`);
  }

  const opening = thread.members[0]; // يَسْجُدُ, page 4
  const payoff = thread.members[thread.members.length - 1]; // الْمَسْجِدُ, page 52
  const openingWord = gloss(vocab, opening.ar);
  const payoffWord = gloss(vocab, payoff.ar);

  const sampleWords = vocab.filter((v) => v.page === SAMPLE_PAGE);
  const storyPages = book.page_count - book.non_story_pages.length;

  return (
    <div className="overflow-x-hidden">
      {/* ---------------------------------------------------------------- *
       * Hero
       * ---------------------------------------------------------------- */}
      <header className="mx-auto w-full max-w-[1100px] px-6 pt-10 sm:px-8">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            lang="ar"
            dir="rtl"
            className="text-brand-blue"
            style={{ fontFamily: "var(--font-arabic)", fontSize: "24px", lineHeight: 1.8 }}
          >
            {book.title_ar}
          </span>
          <span aria-hidden="true" className="text-ink/25 hidden sm:inline">
            ·
          </span>
          <span className="text-ink/60" style={{ fontSize: "14px", letterSpacing: "0.06em" }}>
            {book.title_en}
          </span>
        </p>
      </header>

      <section className="mx-auto grid w-full max-w-[1100px] items-center gap-12 px-6 pt-12 pb-8 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-20">
        <div>
          <h1
            className="text-ink font-semibold text-balance"
            style={{ fontSize: "clamp(38px, 7vw, 62px)", lineHeight: 1.08, letterSpacing: "-0.02em" }}
          >
            Read the story.
            <br />
            <span className="text-brand-blue">Keep the Arabic.</span>
          </h1>

          <p
            className="text-ink/75 mt-6 max-w-[46ch]"
            style={{ fontSize: "clamp(16px, 2.5vw, 19px)", lineHeight: 1.65 }}
          >
            An illustrated retelling of the story of Ibrahim{" "}
            <span className="whitespace-nowrap">(AS)</span>, following
            al-Nadwi&rsquo;s <i>Qisas an-Nabiyyin</i>. Every page carries fully
            vowelled Arabic, the English underneath, and the new words gathered
            where a child can find them.
          </p>

          <p className="text-ink/55 mt-5 flex flex-wrap items-center gap-x-3 gap-y-1" style={{ fontSize: "14px" }}>
            <span>Ages {book.age_range}</span>
            <span aria-hidden="true" className="text-ink/25">·</span>
            <span>{book.page_count} pages</span>
            <span aria-hidden="true" className="text-ink/25">·</span>
            <span>Arabic and English</span>
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#inside"
              className="bg-brand-blue text-paper inline-flex min-h-[48px] items-center rounded-2xl px-6 font-medium transition-transform duration-150 ease-out hover:-translate-y-0.5"
              style={{ fontSize: "16px" }}
            >
              Look inside
            </a>
            <Link
              href={`/books/${book.slug}`}
              className="border-ink/15 text-ink hover:border-ink/35 inline-flex min-h-[48px] items-center rounded-2xl border px-6 font-medium transition-colors duration-150 ease-out"
              style={{ fontSize: "16px" }}
            >
              Open the book
            </Link>
            <Link
              href={`/books/${book.slug}#every-page`}
              className="border-ink/15 text-ink hover:border-ink/35 inline-flex min-h-[48px] items-center rounded-2xl border px-6 font-medium transition-colors duration-150 ease-out"
              style={{ fontSize: "16px" }}
            >
              Page by page
            </Link>
          </div>
        </div>

        {/* Hero art. The book's own pages, tilted like loose sheets — no stock
            imagery ever appears on this site (WEBSITE_DESIGN.md). */}
        <div className="relative mx-auto w-full max-w-[420px] lg:max-w-none" aria-hidden="true">
          <div className="relative aspect-[4/3.4]">
            <FloatingPage
              file="page-14.png"
              className="absolute top-[6%] left-0 w-[52%] -rotate-6"
              priority
            />
            <FloatingPage
              file="page-18.png"
              className="absolute top-0 right-[2%] w-[46%] rotate-3"
            />
            <FloatingPage
              file="page-03.png"
              className="absolute bottom-0 left-[24%] w-[54%] rotate-1"
              priority
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
       * Read-along — the narration, the animation, and the line being read
       * ---------------------------------------------------------------- */}
      {book.read_alongs.length > 0 && (
        <section className="bg-sand/25 border-ink/5 border-y">
          <div className="mx-auto w-full max-w-[1100px] px-6 py-16 sm:px-8 lg:py-20">
            <div className="reveal mb-10">
              <Eyebrow>Read along</Eyebrow>
              <h2
                className="text-ink mt-4 max-w-[22ch] font-semibold text-balance"
                style={{ fontSize: "clamp(28px, 5vw, 42px)", lineHeight: 1.15, letterSpacing: "-0.015em" }}
              >
                Press play and follow the line.
              </h2>
              <p
                className="text-ink/70 mt-4 max-w-[52ch]"
                style={{ fontSize: "clamp(16px, 2.5vw, 18px)", lineHeight: 1.65 }}
              >
                This is how the story opens. The line being read lights up as
                you hear it — so a child can follow where they are without
                losing the vowels. Every page of the book is read this way.
              </p>
            </div>

            <div className="flex flex-col gap-16">
              {book.read_alongs.map((r) => (
                <div key={r.page}>
                  {r.words && (
                    <p
                      className="text-ink/60 mb-5"
                      style={{ fontSize: "15px", lineHeight: 1.6 }}
                    >
                      And this is what you get for every page — the audio, the
                      text, and that page&rsquo;s new words. The picture stays
                      in the book.
                    </p>
                  )}
                  <ReadAlong
                    label={r.words ? "the next page" : "the opening of the story"}
                    src={r.audio}
                    video={r.video}
                    poster={r.poster}
                    words={
                      r.words
                        ? vocab
                            .filter((w) => w.page === r.page)
                            .map((w) => ({ ar: w.ar, en: w.en }))
                        : undefined
                    }
                    lines={r.lines}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- *
       * The thread opens — one word, carried the length of the page
       * ---------------------------------------------------------------- */}
      <section className="mx-auto w-full max-w-[1100px] px-6 py-16 sm:px-8 lg:py-24">
        {/* No .reveal on this card: it holds Arabic, and WEBSITE_DESIGN.md
            forbids animating vocalised text — moving it makes the marks
            harder to resolve, which is the opposite of the point. */}
        <div className="border-ink/10 bg-surface/50 rounded-[28px] border px-6 py-12 text-center sm:px-12">
          <Eyebrow>Start here</Eyebrow>

          <p
            lang="ar"
            dir="rtl"
            className="text-ink mt-6"
            style={{ fontFamily: "var(--font-arabic)", fontSize: "clamp(56px, 13vw, 104px)", lineHeight: 1.7 }}
          >
            {opening.ar}
          </p>

          <p className="text-ink/70 mt-2" style={{ fontSize: "clamp(16px, 2.5vw, 18px)", lineHeight: 1.6 }}>
            {openingWord.en} — page {opening.page}
          </p>

          <div className="bg-ink/10 mx-auto my-8 h-px w-16" />

          <p
            className="text-ink/80 mx-auto max-w-[42ch]"
            style={{ fontSize: "clamp(16px, 2.5vw, 18px)", lineHeight: 1.7 }}
          >
            Three letters carry it:{" "}
            <span
              lang="ar"
              dir="rtl"
              className="text-brand-blue font-semibold"
              style={{ fontFamily: "var(--font-arabic)", letterSpacing: "0.15em" }}
            >
              {thread.root}
            </span>
            . Hold on to them — by the end of this page you will know why a
            masjid is called a masjid.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
       * Anatomy of a page — the real thing, parsed from the manuscript
       * ---------------------------------------------------------------- */}
      <section id="inside" className="mx-auto w-full max-w-[1100px] scroll-mt-8 px-6 py-8 sm:px-8">
        <div className="reveal">
          <Eyebrow>What every page holds</Eyebrow>
          <h2
            className="text-ink mt-4 max-w-[20ch] font-semibold text-balance"
            style={{ fontSize: "clamp(28px, 5vw, 42px)", lineHeight: 1.15, letterSpacing: "-0.015em" }}
          >
            Three things, in the same order, every time.
          </h2>
          <p
            className="text-ink/70 mt-4 max-w-[52ch]"
            style={{ fontSize: "clamp(16px, 2.5vw, 18px)", lineHeight: 1.65 }}
          >
            The Arabic to read, the English to check yourself against, and the
            new words listed underneath — in that order, under the picture,
            never moving position. A child always knows where to look. Here is
            page {spread.page} in full; the rest is in the book.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:gap-12">
          <div className="flex flex-col gap-7">
            {/* Arabic body — the reason the book exists. Never animated. */}
            <div>
              <BlockLabel>The Arabic</BlockLabel>
              <div
                lang="ar"
                dir="rtl"
                className="text-ink mt-3"
                style={{
                  fontFamily: "var(--font-arabic)",
                  fontSize: "clamp(28px, 6vw, 34px)",
                  lineHeight: 1.9,
                  textAlign: "start",
                }}
              >
                {spread.ar.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>

            <div className="bg-panel-light/60 rounded-2xl px-5 py-4">
              <BlockLabel>The English</BlockLabel>
              <div className="text-ink/85 mt-2" style={{ fontSize: "16px", lineHeight: 1.6 }}>
                {spread.en.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>

          </div>

          <div className="border-ink/10 bg-surface/70 h-fit rounded-2xl border px-5 py-5">
            <BlockLabel>The new words</BlockLabel>
            <ul className="mt-3 flex flex-col gap-2">
              {sampleWords.slice(0, 4).map((w) => (
                <li key={w.index} className="flex items-baseline justify-between gap-4">
                  <span
                    lang="ar"
                    dir="rtl"
                    className="text-ink"
                    style={{ fontFamily: "var(--font-arabic)", fontSize: "clamp(24px, 5vw, 28px)", lineHeight: 1.8 }}
                  >
                    {w.ar}
                  </span>
                  <span className="text-ink/65 text-right" style={{ fontSize: "15px", lineHeight: 1.7 }}>
                    {w.en}
                  </span>
                </li>
              ))}
            </ul>
            <p
              className="border-ink/10 text-ink/55 mt-5 border-t pt-4"
              style={{ fontSize: "14px", lineHeight: 1.6 }}
            >
              and {sampleWords.length - 4} more on this page. Each word is
              introduced once, and only once, across the whole book —{" "}
              {vocab.length} of them in total.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
       * The art
       * ---------------------------------------------------------------- */}
      <section className="mx-auto w-full max-w-[1100px] px-6 py-16 sm:px-8 lg:py-24">
        <div className="reveal">
          <Eyebrow>Inside the book</Eyebrow>
          <h2
            className="text-ink mt-4 max-w-[22ch] font-semibold text-balance"
            style={{ fontSize: "clamp(28px, 5vw, 42px)", lineHeight: 1.15, letterSpacing: "-0.015em" }}
          >
            Drawn for the story, not decorated around it.
          </h2>
          <p
            className="text-ink/70 mt-4 max-w-[52ch]"
            style={{ fontSize: "clamp(16px, 2.5vw, 18px)", lineHeight: 1.65 }}
          >
            {storyPages} illustrated pages, one scene each. The hard parts of
            the story are told plainly in the text and left undrawn — restraint
            belongs in the picture, never in the telling. Ibrahim himself is
            never drawn: some pages show what he sees, on others he simply
            is not in the frame. Three of them:
          </p>
        </div>

        <ul className="reveal mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {SAMPLE_ART.map((item) => (
            <li key={item.page}>
              <Image
                src={`/art/${item.file}`}
                alt={`Page ${item.page} — ${item.caption}`}
                width={688}
                height={968}
                sizes="(max-width: 640px) 90vw, 320px"
                className="border-ink/10 w-full rounded-2xl border"
              />
              <p className="text-ink/55 mt-3" style={{ fontSize: "14px", lineHeight: 1.4 }}>
                <span className="text-brand-blue">Page {item.page}</span> ·{" "}
                {item.caption}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------------------------------------------------------- *
       * Word families — the thing no competitor has
       * ---------------------------------------------------------------- */}
      <section className="bg-sand/35 border-ink/5 border-y">
        <div className="mx-auto w-full max-w-[1100px] px-6 py-16 sm:px-8 lg:py-24">
          <div className="reveal">
            <Eyebrow>Words come in families</Eyebrow>
            <h2
              className="text-ink mt-4 max-w-[22ch] font-semibold text-balance"
              style={{ fontSize: "clamp(28px, 5vw, 42px)", lineHeight: 1.15, letterSpacing: "-0.015em" }}
            >
              The words are related. A child can see it.
            </h2>
            <p
              className="text-ink/70 mt-4 max-w-[54ch]"
              style={{ fontSize: "clamp(16px, 2.5vw, 18px)", lineHeight: 1.65 }}
            >
              Three letters, and a family of words grows out of them. There is
              no grammar here and no terminology — just the same three letters,
              turning up again in a word the child already met.{" "}
              {families.length} families run through this book.
            </p>
          </div>

          <div className="border-ink/10 bg-paper mt-10 rounded-[28px] border p-6 sm:p-10">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-10">
              <div
                lang="ar"
                dir="rtl"
                className="bg-brand-blue text-paper shrink-0 self-start rounded-xl px-6 py-4 text-center"
                style={{
                  fontFamily: "var(--font-arabic)",
                  fontSize: "clamp(22px, 4vw, 28px)",
                  lineHeight: 1.4,
                  letterSpacing: "0.15em",
                }}
              >
                {thread.root}
              </div>

              <ul className="flex flex-1 flex-col gap-4">
                {thread.members.map((m) => {
                  const w = gloss(vocab, m.ar);
                  return (
                    <li key={`${m.ar}-${m.page}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span
                        lang="ar"
                        dir="rtl"
                        className="text-ink"
                        style={{ fontFamily: "var(--font-arabic)", fontSize: "clamp(24px, 5vw, 30px)", lineHeight: 1.8 }}
                      >
                        {m.ar}
                      </span>
                      <span className="text-ink/65 flex items-baseline gap-3" style={{ fontSize: "15px", lineHeight: 1.7 }}>
                        {w.en}
                        <Link
                          href={`/books/${book.slug}/p${m.page}`}
                          className="text-brand-blue underline-offset-4 hover:underline"
                        >
                          page {m.page}
                        </Link>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <p
              className="border-ink/10 text-ink/70 mt-8 border-t pt-6"
              style={{ fontSize: "16px", lineHeight: 1.65 }}
            >
              Every page number is a link. That is what the website adds to the
              printed appendix — the connections are followable, so a child can
              jump back to the picture the word belongs to.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
       * Audio
       * ---------------------------------------------------------------- */}
      <section className="mx-auto w-full max-w-[1100px] px-6 py-16 sm:px-8 lg:py-24">
        <div className="reveal grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <Eyebrow>Hear it read</Eyebrow>
            <h2
              className="text-ink mt-4 max-w-[20ch] font-semibold text-balance"
              style={{ fontSize: "clamp(28px, 5vw, 42px)", lineHeight: 1.15, letterSpacing: "-0.015em" }}
            >
              One code in the book. Every page read aloud.
            </h2>
            <p
              className="text-ink/70 mt-4 max-w-[50ch]"
              style={{ fontSize: "clamp(16px, 2.5vw, 18px)", lineHeight: 1.65 }}
            >
              Scan once and the whole book is here to listen to — turn to any
              page and hear it, with the words and the family beside it. No
              scanning a fresh code every page, no account, no advertising, and
              it never starts playing on its own.
            </p>
            {book.audio_status === "none" && (
              <p className="text-ink/50 mt-5" style={{ fontSize: "14px", lineHeight: 1.6 }}>
                The recordings are still being made. Every other part of a page
                works today.
              </p>
            )}
            <Link
              href={`/books/${book.slug}/p${SAMPLE_PAGE}`}
              className="text-brand-blue mt-6 inline-flex min-h-[48px] items-center font-medium underline-offset-4 hover:underline"
              style={{ fontSize: "16px" }}
            >
              See page {SAMPLE_PAGE} as a child would →
            </Link>
          </div>

          <ul className="flex flex-col gap-4">
            {[
              ["Fully vowelled", "Every word carries its tashkeel, on every page — the marks are the lesson, not a decoration."],
              ["Nothing cut", "The story follows al-Nadwi's original. Difficult episodes are told plainly rather than removed."],
              ["Never drawn", "Ibrahim is not depicted at all — not featured, not blank-faced, not shown from behind. Some pages show what he sees; on others he simply isn't in the frame."],
            ].map(([title, body]) => (
              <li key={title} className="border-ink/10 bg-surface/60 rounded-2xl border px-5 py-4">
                <p className="text-ink font-semibold" style={{ fontSize: "16px", lineHeight: 1.5 }}>
                  {title}
                </p>
                <p className="text-ink/65 mt-1" style={{ fontSize: "15px", lineHeight: 1.6 }}>
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
       * The series — this is book one, and the vowels come off gradually
       * ---------------------------------------------------------------- */}
      <section className="bg-sand/35 border-ink/5 border-y">
        <div className="mx-auto w-full max-w-[1100px] px-6 py-16 sm:px-8 lg:py-24">
          <div className="reveal">
            <Eyebrow>Book one of the series</Eyebrow>
            <h2
              className="text-ink mt-4 max-w-[24ch] font-semibold text-balance"
              style={{ fontSize: "clamp(28px, 5vw, 42px)", lineHeight: 1.15, letterSpacing: "-0.015em" }}
            >
              The vowels come off one book at a time.
            </h2>
            <p
              className="text-ink/70 mt-4 max-w-[56ch]"
              style={{ fontSize: "clamp(16px, 2.5vw, 18px)", lineHeight: 1.65 }}
            >
              One prophet per book, and the tashkeel thins out as the series
              goes on — so a reader is weaned off the marks the way Arabic is
              actually learned, instead of meeting unvowelled text as a cliff.
              This book is the first, and it is fully vowelled throughout.
            </p>
          </div>

          <ol className="reveal mt-10 grid gap-3 sm:grid-cols-5">
            {SERIES.map((s) => {
              const current = s.n === book.series_order;
              return (
                <li
                  key={s.n}
                  className={`rounded-2xl border px-4 py-4 ${
                    current
                      ? "border-brand-blue/30 bg-paper"
                      : "border-ink/10 bg-paper/40"
                  }`}
                >
                  <p
                    className={current ? "text-brand-blue font-semibold" : "text-ink/40"}
                    style={{ fontSize: "13px", letterSpacing: "0.1em" }}
                  >
                    BOOK {s.n}
                  </p>
                  <p
                    className={current ? "text-ink mt-1 font-medium" : "text-ink/60 mt-1"}
                    style={{ fontSize: "15px", lineHeight: 1.45 }}
                  >
                    {s.label}
                  </p>
                  {s.note && (
                    <p className="text-ink/45 mt-1" style={{ fontSize: "13px", lineHeight: 1.4 }}>
                      {s.note}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>

          <p className="text-ink/50 mt-6" style={{ fontSize: "14px", lineHeight: 1.6 }}>
            Later books are in preparation. Nothing in this one depends on
            them.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
       * The payoff — the same three letters, 48 pages later
       * ---------------------------------------------------------------- */}
      <section className="bg-night">
        <div className="mx-auto w-full max-w-[1100px] px-6 py-20 text-center sm:px-8 lg:py-28">
          {/* Arabic inside — deliberately not revealed on scroll. */}
          <div>
            <p
              className="text-sand/70"
              style={{ fontSize: "13px", letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              One last thing
            </p>

            <p
              lang="ar"
              dir="rtl"
              className="text-paper mt-8"
              style={{ fontFamily: "var(--font-arabic)", fontSize: "clamp(56px, 13vw, 104px)", lineHeight: 1.7 }}
            >
              {payoff.ar}
            </p>

            <p className="text-sand mt-2" style={{ fontSize: "clamp(16px, 2.5vw, 18px)", lineHeight: 1.6 }}>
              {payoffWord.en} — page {payoff.page}
            </p>

            <p
              className="text-paper/80 mx-auto mt-8 max-w-[46ch]"
              style={{ fontSize: "clamp(17px, 2.6vw, 20px)", lineHeight: 1.7 }}
            >
              A masjid is the place where you make sujud. The same three letters
              you met on page {opening.page}, {payoff.page - opening.page} pages
              later — and nobody had to explain it.
            </p>

            <p className="text-paper/50 mt-6" style={{ fontSize: "15px", lineHeight: 1.6 }}>
              That is the whole idea of this book.
            </p>

            <Link
              href={`/books/${book.slug}`}
              className="bg-paper text-night mt-10 inline-flex min-h-[48px] items-center rounded-2xl px-7 font-medium transition-transform duration-150 ease-out hover:-translate-y-0.5"
              style={{ fontSize: "16px" }}
            >
              Open the book
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-[1100px] px-6 py-12 sm:px-8">
        <div className="border-ink/10 flex flex-col gap-3 border-t pt-8 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="text-ink/60" style={{ fontSize: "14px", lineHeight: 1.6 }}>
            {book.title_en} — book {book.series_order} of the{" "}
            <i>Qisas an-Nabiyyin</i> readers.
          </p>
          <p className="text-ink/45" style={{ fontSize: "14px", lineHeight: 1.6 }}>
            Ages {book.age_range} · Arabic and English
          </p>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------- *
 * Small local pieces. Not exported — nothing else needs them, and a
 * components/ file per label would be filing for its own sake.
 * -------------------------------------------------------------------- */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-brand-blue flex items-center gap-3" style={{ fontSize: "13px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
      <span aria-hidden="true" className="bg-brand-blue/40 h-px w-8" />
      {children}
    </p>
  );
}

function BlockLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-ink/45" style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
      {children}
    </p>
  );
}

function FloatingPage({
  file,
  className,
  priority,
}: {
  file: string;
  className: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={`/art/${file}`}
      alt=""
      width={688}
      height={968}
      priority={priority}
      sizes="(max-width: 1024px) 45vw, 260px"
      className={`border-ink/10 rounded-xl border shadow-[0_18px_40px_-24px_rgba(26,42,74,0.45)] ${className}`}
    />
  );
}
