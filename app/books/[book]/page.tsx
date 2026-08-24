import { notFound } from "next/navigation";
import type { Metadata } from "next";
import HomeBar from "@/components/HomeBar";
import PageIndex from "@/components/PageIndex";
import Link from "next/link";
import { CATALOGUE } from "@/lib/catalogue";
import {
  getAllBooks,
  getBook,
  getPageNumbers,
  getRecordedPages,
  parseRootFamilies,
  parseVocabulary,
} from "@/lib/parse";

/**
 * Book overview — the way into the book: every page, in order.
 *
 * The word families used to live here too, and were the first thing on the
 * page. They now have their own screen at /books/<slug>/words, linked from
 * the bottom of this one. They are a reference you consult deliberately;
 * having all 32 of them above the page index meant scrolling past the whole
 * appendix to reach the page you actually came for.
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

  return (
    <>
      {/* Sticky, because this page is long — 50 page numbers. A link only at
          the top strands anyone reading the book with no way home short of
          scrolling back up. */}
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

          {/* An unpublished book says so on its own page. Keyed on the
              catalogue's `published` flag, not buy_url — Ibrahim is published
              with a blank buy_url, so buy_url would mislabel it. */}
          {!CATALOGUE.find((b) => b.slug === book.slug)?.published && (
            <p
              className="border-brand-blue/30 bg-sand/40 text-ink/75 mt-5 rounded-xl border px-4 py-3"
              style={{ fontSize: "15px", lineHeight: 1.6 }}
            >
              <span className="text-brand-blue font-semibold">
                Coming soon.
              </span>{" "}
              The printed book is still being made, and so are the recordings
              and the pictures. The Arabic below is here to read now.
            </p>
          )}
        </header>

        {/* The page index comes FIRST. Someone opening this book wants the
            page they are on; the word families are a reference you go to
            deliberately, and all 32 of them sat between the reader and the
            index. They now have their own screen, linked below.

            scroll-mt: the sticky HomeBar would otherwise cover this heading
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

        {/* The word families, as a way in rather than a wall of them. */}
        <section className="mt-12 border-t border-[var(--ink)]/10 pt-8">
          <h2 className="mb-2 text-[18px] font-medium">Related words</h2>
          <p className="mb-4 max-w-[52ch] text-[15px] text-[var(--ink)]/70">
            Arabic words grow from three letters, and words built on the same
            three letters have related meanings. {families.length} families run
            through this book.
          </p>
          <Link
            href={`/books/${book.slug}/words`}
            className="inline-flex min-h-[48px] items-center text-[15px] text-[var(--brand-blue)] underline-offset-4 hover:underline"
          >
            Explore the word families →
          </Link>
        </section>
      </main>
    </>
  );
}
