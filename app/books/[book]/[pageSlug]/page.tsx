import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AudioPlayer from "@/components/AudioPlayer";
import WordList from "@/components/WordList";
import RootFamily from "@/components/RootFamily";
import {
  getAllBooks,
  getBook,
  getPageContent,
  getPageNumbers,
} from "@/lib/parse";

/**
 * THE QR LANDING ROUTE.
 *
 * URL shape is `/books/<slug>/p<NN>` — e.g. /books/ibrahim/p39.
 * This string gets PRINTED INTO PHYSICAL BOOKS and can never change.
 * See WEBSITE_BUILD.md § "The one irreversible decision".
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

  const { book, words, families, audioSrc } = content;
  if (page > book.page_count) notFound();

  const isStoryPage = !book.non_story_pages.includes(page);
  const hasAudio = isStoryPage && book.audio_status !== "none";

  const prev = page > 1 ? page - 1 : null;
  const next = page < book.page_count ? page + 1 : null;

  return (
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

      {hasAudio ? (
        <section className="mb-10">
          <AudioPlayer src={audioSrc} label={`Page ${page} audio`} />
        </section>
      ) : isStoryPage ? (
        <section className="mb-10 rounded-2xl bg-[var(--surface)]/60 px-5 py-4">
          <p className="text-[15px] text-[var(--ink)]/70">
            Audio for this book is being recorded. The words below are ready to
            read now.
          </p>
        </section>
      ) : null}

      {isStoryPage ? (
        <>
          <section className="mb-10">
            <WordList words={words} />
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
  );
}
