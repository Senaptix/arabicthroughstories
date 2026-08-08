import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import HomeBar from "@/components/HomeBar";
import ReadAlong from "@/components/ReadAlong";
import VocabCards from "@/components/VocabCards";
import RootFamily from "@/components/RootFamily";
import {
  getAllBooks,
  getBook,
  getPageContent,
  getPageNumbers,
  getReadAlong,
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
      description: `Audio, new words and word families for page ${page}.`,
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

  const { book, words, families, text } = content;
  if (page > book.page_count) notFound();

  const isStoryPage = !book.non_story_pages.includes(page);
  // Per page, not per book: a clip exists for this page or it does not.
  // Read from disk, so dropping p7.mp3 in lights page 7 up on next build.
  const readAlong = isStoryPage ? getReadAlong(slug, page) : null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < book.page_count ? page + 1 : null;

  return (
    <>
      {/* The book carries ONE code, to the book — not one per page
          (ACCESS_MODEL.md). Page cards are reached by turning pages and by
          following root-family links, so every one of them needs a way back
          out rather than relying on browser history. */}
      <HomeBar />

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

      {/* With audio, the text and the player are one thing: the line being
          read highlights as it plays. The audio is a pronunciation model for
          text the child is looking at, so they belong together and never on
          separate screens (WEBSITE_DESIGN.md). */}
      {readAlong ? (
        <section className="mb-10">
          <ReadAlong
            src={readAlong.src}
            lines={readAlong.lines}
            label={`page ${page}`}
          />
        </section>
      ) : (
        <>
          {isStoryPage && (
            <section className="mb-10 rounded-2xl bg-[var(--surface)]/60 px-5 py-4">
              <p className="text-[15px] text-[var(--ink)]/70">
                This page is still being recorded. The text and words below are
                ready to read now.
              </p>
            </section>
          )}

          {text.length > 0 && (
            <section className="mb-10">
              <div
                lang="ar"
                dir="rtl"
                style={{
                  fontFamily: "var(--font-arabic)",
                  fontSize: "clamp(28px, 6vw, 34px)",
                  lineHeight: 1.9,
                  textAlign: "start",
                }}
              >
                {text.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {isStoryPage ? (
        <>
          <section className="mb-10">
            <VocabCards words={words} idPrefix={`p${page}`} />
          </section>

          <section className="mb-10">
            <RootFamily
              families={families}
              bookSlug={book.slug}
              currentPage={page}
            />
          </section>
        </>
      ) : (
        <section className="mb-10">
          <p className="text-[15px] text-[var(--ink)]/70">
            This page has no new words — it&rsquo;s part of the front or back of
            the book.
          </p>
        </section>
      )}

      {/* Page-to-page navigation */}
      <nav className="mt-12 flex items-center justify-between border-t border-[var(--ink)]/10 pt-6">
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
      </main>
    </>
  );
}
