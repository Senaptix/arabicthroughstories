import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Eyebrow from "@/components/Eyebrow";
import HomeBar from "@/components/HomeBar";
import PagePlayer from "@/components/PagePlayer";
import ReadAlong from "@/components/ReadAlong";
import VocabCards from "@/components/VocabCards";
import RootFamily from "@/components/RootFamily";
import QuranicText from "@/components/QuranicText";
import GateNotice from "@/components/GateNotice";
import PageProgress from "@/components/PageProgress";
import { canViewPage } from "@/lib/access";
import {
  getAllBooks,
  getBook,
  getPageContent,
  getPageNumbers,
  getReadAlong,
  parseExercises,
} from "@/lib/parse";

/**
 * One page of the book: its audio, its text, its words and its families.
 *
 * URL shape is `/books/<slug>/p<NN>` — e.g. /books/ibrahim/p39.
 *
 * These URLs are NO LONGER PRINTED. The book now carries a single code to
 * the book itself rather than one per page (ACCESS_MODEL.md supersedes
 * AUDIO_PLAN.md on this), so the "can never change" rule in
 * WEBSITE_BUILD.md § "The one irreversible decision" no longer binds here.
 * Keep them stable anyway — the printed word-family appendix sends readers
 * to page numbers, and links already shared should not rot.
 *
 * The `pageSlug` segment is the whole `p39` token (not a nested /p/39),
 * which is why the folder is [pageSlug] and the prefix is parsed here.
 */

type Params = { book: string; pageSlug: string };

/** "p39" -> 39. Returns null for anything malformed. */
function parsePageSlug(slug: string): number | null {
  const m = /^p(\d+)$/.exec(slug);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function generateStaticParams(): Params[] {
  return getAllBooks().flatMap((book) =>
    getPageNumbers(book).map((n) => ({
      book: book.slug,
      pageSlug: `p${n}`,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { book: slug, pageSlug } = await params;
  const page = parsePageSlug(pageSlug);
  if (page === null) return {};
  try {
    const book = getBook(slug);
    return {
      title: `Page ${page} — ${book.title_en}`,
      description: `Audio, new words and related words for page ${page}.`,
    };
  } catch {
    return {};
  }
}

export default async function PageCard({
  params,
}: {
  params: Promise<Params>;
}) {
  const { book: slug, pageSlug } = await params;

  const page = parsePageSlug(pageSlug);
  if (page === null) notFound();

  let content;
  try {
    content = getPageContent(slug, page);
  } catch {
    notFound();
  }

  const { book, words, families, text, hasAudio } = content;
  if (page > book.page_count) notFound();

  // The ONE access check. While lib/access.ts has GATE_ENABLED off this is
  // always true and the page renders exactly as it always has.
  const canView = await canViewPage(slug, page);

  const isStoryPage = !book.non_story_pages.includes(page);
  // Per page, not per book: a clip exists for this page or it does not.
  // Read from disk, so dropping p7.mp3 in lights page 7 up on next build.
  // A clip WITHOUT measured line cues still plays — see the player below.
  const readAlong = isStoryPage ? getReadAlong(slug, page) : null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < book.page_count ? page + 1 : null;
  const hasPractice = (parseExercises(slug).get(page)?.length ?? 0) > 0;

  return (
    <>
      {/* The book carries ONE code, to the book — not one per page
          (ACCESS_MODEL.md). Page cards are reached by turning pages and by
          following root-family links, so every one of them needs a way back
          out rather than relying on browser history. */}
      <HomeBar bookSlug={book.slug} />

      <main className="mx-auto w-full max-w-[640px] px-6 py-8 sm:px-8">
        {/* Meta bar — page number left, book right */}
        <div className="mb-8 flex items-baseline justify-between gap-4">
          <span className="text-[14px] font-medium text-[var(--brand-blue)]">
            Page {page}
          </span>
          <Link
            href={`/books/${book.slug}`}
            className="text-[14px] text-[var(--brand-blue)] underline-offset-4 hover:underline"
          >
            {book.title_en}
          </Link>
        </div>

        <PageProgress bookSlug={book.slug} page={page} />

        {/* With audio, the text and the player are one thing: the line being
          read highlights as it plays. The audio is a pronunciation model for
          text the child is looking at, so they belong together and never on
          separate screens (WEBSITE_DESIGN.md). No card around this zone —
          ReadAlong is already visually rich (play button, highlighted
          lines); the eyebrow is enough to title it. */}
        {!canView ? (
          <GateNotice page={page} bookSlug={book.slug} />
        ) : readAlong ? (
          <section className="mb-10">
            <Eyebrow>Read along</Eyebrow>
            <div className="mt-4">
              <ReadAlong
                src={readAlong.src}
                lines={readAlong.lines}
                label={`page ${page}`}
              />
            </div>
          </section>
        ) : (
          <>
            {isStoryPage && !hasAudio && (
              <section className="mb-6 rounded-2xl bg-[var(--surface)]/60 px-5 py-4">
                <p className="text-[15px] text-[var(--ink)]/70">
                  This page is still being recorded. The text and words below
                  are ready to read now.
                </p>
              </section>
            )}

            {/* Recorded, but the line cues have not been measured yet. Play
                the clip plainly rather than guess where each line starts:
                a cue that is even a second out highlights the wrong line
                while the child is looking at it, which teaches the wrong
                word. scripts/measure-timings.ts explains why these cannot
                be derived from the audio alone. */}
            {isStoryPage && hasAudio && (
              <section className="mb-8">
                <Eyebrow>Hear this page</Eyebrow>
                <PagePlayer
                  src={`/audio/${book.slug}/p${page}.mp3`}
                  page={page}
                />
                <p className="mt-3 text-[14px] text-[var(--ink)]/55">
                  Follow the words below as you listen — this page does not
                  highlight each line yet.
                </p>
              </section>
            )}

            {text.length > 0 && (
              <section className="mb-10">
                <Eyebrow>The text</Eyebrow>
                <div
                  lang="ar"
                  dir="rtl"
                  className="mt-4"
                  style={{
                    fontFamily: "var(--font-arabic)",
                    fontSize: "clamp(28px, 6vw, 34px)",
                    lineHeight: 1.9,
                    textAlign: "start",
                  }}
                >
                  {text.map((line, i) => (
                    <p key={i}>
                      <QuranicText text={line} />
                    </p>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {isStoryPage ? (
          <>
            {/* Card boundary — the two blocks a reader most needs to
              distinguish from each other and from the text above. */}
            <section className="border-ink/10 bg-surface/50 mb-6 rounded-2xl border px-5 py-4">
              <Eyebrow>New words</Eyebrow>
              <div className="mt-4">
                <VocabCards words={words} idPrefix={`p${page}`} />
              </div>
            </section>

            <section className="border-ink/10 bg-surface/50 mb-10 rounded-2xl border px-5 py-4">
              <Eyebrow>Related words</Eyebrow>
              <div className="mt-4">
                <h2
                  lang="ar"
                  dir="rtl"
                  className="text-brand-blue mb-4 font-semibold"
                  style={{
                    fontFamily: "var(--font-arabic)",
                    fontSize: "clamp(24px, 5vw, 30px)",
                    lineHeight: 1.8,
                    textAlign: "start",
                  }}
                >
                  الْجُذُورُ
                </h2>
                <RootFamily
                  families={families}
                  bookSlug={book.slug}
                  currentPage={page}
                />
              </div>
            </section>
          </>
        ) : (
          <section className="mb-10">
            <p className="text-[15px] text-[var(--ink)]/70">
              This page has no new words — it&rsquo;s part of the front or back
              of the book.
            </p>
          </section>
        )}

        {/* Page-to-page navigation. Divider first (a break from the sections
          above), then the label, then the links — a label sitting above its
          own divider reads oddly. */}
        <div className="mt-4 border-t border-[var(--ink)]/10 pt-6">
          <Eyebrow>Explore more</Eyebrow>

          {/* Practice is its own screen: the text and words above would
              otherwise be the answer key sitting next to the question. */}
          {canView && hasPractice && (
            <Link
              href={`/books/${book.slug}/p${page}/practice`}
              className="bg-brand-blue text-paper mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-5 font-medium"
              style={{ fontSize: "16px" }}
            >
              Practice these words
            </Link>
          )}

          <nav className="mt-4 flex items-center justify-between">
            {prev ? (
              <Link
                href={`/books/${book.slug}/p${prev}`}
                className="inline-flex min-h-[48px] items-center text-[15px] text-[var(--brand-blue)] underline-offset-4 hover:underline"
              >
                ← Page {prev}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/books/${book.slug}/p${next}`}
                className="inline-flex min-h-[48px] items-center text-[15px] text-[var(--brand-blue)] underline-offset-4 hover:underline"
              >
                Page {next} →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>
      </main>
    </>
  );
}
