import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Eyebrow from "@/components/Eyebrow";
import HomeBar from "@/components/HomeBar";
import Practice from "@/components/Practice";
import {
  getAllBooks,
  getBook,
  getPageContent,
  parseExercises,
} from "@/lib/parse";

/**
 * Practice for one page — deliberately its OWN screen.
 *
 * The page text and the vocabulary list are not rendered here. On the page
 * card they sit directly above where an exercise would go, so every answer
 * would be visible while answering.
 *
 * The interactive JS lives on this route only, which keeps the page-card
 * route's JS budget (WEBSITE_BUILD.md, under 100kb) untouched.
 */

type Params = { book: string; pageSlug: string };

function parsePageSlug(slug: string): number | null {
  const m = /^p(\d+)$/.exec(slug);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Only pages that actually have exercises get a route. */
export function generateStaticParams(): Params[] {
  return getAllBooks().flatMap((book) =>
    [...parseExercises(book.slug).keys()].map((n) => ({
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
      title: `Practice page ${page} — ${book.title_en}`,
      description: `Exercises on the words and sentences of page ${page}.`,
    };
  } catch {
    return {};
  }
}

export default async function PracticePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { book: slug, pageSlug } = await params;

  const page = parsePageSlug(pageSlug);
  if (page === null) notFound();

  const exercises = parseExercises(slug).get(page);
  if (!exercises || exercises.length === 0) notFound();

  let content;
  try {
    content = getPageContent(slug, page);
  } catch {
    notFound();
  }
  const { book, words } = content;

  return (
    <>
      <HomeBar bookSlug={book.slug} />

      <main className="mx-auto w-full max-w-[640px] px-6 py-8 sm:px-8">
        <div className="mb-8 flex items-baseline justify-between gap-4">
          <span className="text-[14px] font-medium text-[var(--brand-blue)]">
            Practice · page {page}
          </span>
          <Link
            href={`/books/${book.slug}/p${page}`}
            className="text-[14px] text-[var(--brand-blue)] underline-offset-4 hover:underline"
          >
            Back to page {page}
          </Link>
        </div>

        <section>
          <Eyebrow>Practice</Eyebrow>
          <div className="mt-4">
            <Practice
              exercises={exercises}
              words={words.map((w) => ({ ar: w.ar, en: w.en }))}
            />
          </div>
        </section>

        <div className="mt-12 border-t border-[var(--ink)]/10 pt-6">
          <Link
            href={`/books/${book.slug}/p${page}`}
            className="inline-flex min-h-[48px] items-center text-[15px] text-[var(--brand-blue)] underline-offset-4 hover:underline"
          >
            ← Back to page {page}
          </Link>
        </div>
      </main>
    </>
  );
}
