import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BookReader, { type ReaderPage } from "@/components/BookReader";
import HomeBar from "@/components/HomeBar";
import PageIndex from "@/components/PageIndex";
import RootFamily from "@/components/RootFamily";
import {
  getAllBooks,
  getBook,
  getPageNumbers,
  getReadAlong,
  getRecordedPages,
  parseRootFamilies,
  parseVocabulary,
} from "@/lib/parse";

/**
 * Book overview — effectively the printed word-family appendix, but
 * complete (every family, not the twelve chosen for paper) and clickable.
 */

/* The page-number grid below deliberately carries NO sample artwork. Three
   illustrated thumbnails sat above it until 2026-08-12 and were removed at
   the author's request — the pictures stay in the book. Don't reinstate them
   without asking. */

type Params = { book: string };

export function generateStaticParams(): Params[] {
  return getAllBooks().map((b) => ({ book: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { book: slug } = await params;
  try {
    const book = getBook(slug);
    return {
      title: book.title_en,
      description: `Related words, vocabulary and audio for ${book.title_en}.`,
    };
  } catch {
    return {};
  }
}

export default async function BookOverview({
  params,
}: {
  params: Promise<Params>;
}) {
  const { book: slug } = await params;

  let book, families, vocab;
  try {
    book = getBook(slug);
    families = parseRootFamilies(slug);
    vocab = parseVocabulary(slug);
  } catch {
    notFound();
  }

  const storyPages = getPageNumbers(book).filter(
    (n) => !book.non_story_pages.includes(n),
  );
  const recorded = getRecordedPages(slug);

  // Preview pages carry their own glossary in the artwork; the parsed words
  // are what makes the panel linkable, so both come from the same source.
  const readerPages: ReaderPage[] = Array.from(
    { length: book.preview_pages },
    (_, idx) => {
      const n = idx + 1;
      return {
        n,
        src: `/book/${book.slug}/${String(n).padStart(2, "0")}.webp`,
        words: vocab
          .filter((w) => w.page === n)
          .map((w) => ({ ar: w.ar, en: w.en })),
        readAlong: getReadAlong(slug, n),
      };
    },
  );

  return (
    <>
      {/* Sticky, because this page is long — reader, then every word family,
          then every page. A link only at the top strands anyone reading the
          book with no way home short of scrolling back up. */}
      <HomeBar bookSlug={book.slug} />

      <main className="mx-auto w-full max-w-[640px] px-6 py-10 sm:px-8">
        <header className="mb-12">
          <h1
            lang="ar"
            dir="rtl"
            className="mb-3 font-[family-name:var(--font-arabic)] leading-[1.9]"
            style={{ fontSize: "clamp(28px, 6vw, 40px)" }}
          >
            {book.title_ar}
          </h1>
          <p
            className="text-[var(--ink)]/80"
            style={{ fontSize: "clamp(22px, 4vw, 30px)", lineHeight: 1.3 }}
          >
            {book.title_en}
          </p>
          <p className="mt-4 text-[15px] text-[var(--ink)]/60">
            Ages {book.age_range} · {book.page_count} pages · {vocab.length}{" "}
            words taught · fully vowelled
          </p>
        </header>

        {readerPages.length > 0 && (
          <section className="mb-14">
            <h2 className="mb-2 text-[18px] font-medium">Read the opening</h2>
            <p className="mb-6 text-[15px] text-[var(--ink)]/70">
              Click the page to turn it. Open <b>Book vocab</b> for the new
              words on the page you are reading.
            </p>
            <BookReader
              pages={readerPages}
              totalPages={book.page_count}
              slug={book.slug}
            />
          </section>
        )}

        <section className="mb-12">
          <h2 className="mb-2 text-[18px] font-medium">Related words</h2>
          <p className="mb-6 text-[15px] text-[var(--ink)]/70">
            Arabic words grow from three letters. Words built on the same three
            letters have related meanings. Open a root to see its words, and tap
            any word to go to the page it appears on.
          </p>

          <h2
            lang="ar"
            dir="rtl"
            className="mb-4 font-[family-name:var(--font-arabic)]"
            style={{ fontSize: "clamp(24px, 5vw, 30px)", lineHeight: 1.8 }}
          >
            الْجُذُورُ
          </h2>

          <RootFamily
            families={families}
            bookSlug={book.slug}
            currentPage={0}
          />
        </section>

        {/* scroll-mt: the sticky HomeBar would otherwise cover this heading
            when reached via the "Page by page" link's #every-page jump. */}
        <section id="every-page" className="scroll-mt-20">
          <h2 className="mb-2 text-[18px] font-medium">Every page</h2>
          <p className="mb-4 text-[15px] text-[var(--ink)]/70">
            Every page has its text, words and families. Pages marked in blue
            can also be heard —{" "}
            {recorded.size === 0
              ? "recording has not started"
              : `${recorded.size} so far, and the rest are being recorded`}
            .
          </p>
          <PageIndex
            bookSlug={book.slug}
            pages={storyPages}
            recorded={[...recorded]}
          />
        </section>
      </main>
    </>
  );
}
