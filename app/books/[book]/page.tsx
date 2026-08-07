import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllBooks,
  getBook,
  getPageNumbers,
  parseRootFamilies,
  parseVocabulary,
} from "@/lib/parse";

/**
 * Book overview — effectively the printed word-family appendix, but
 * complete (every family, not the twelve chosen for paper) and clickable.
 */

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
    return { title: book.title_en, description: `Word families, vocabulary and audio for ${book.title_en}.` };
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

  return (
    <main className="mx-auto w-full max-w-[640px] px-6 py-10 sm:px-8">
      <Link
        href="/"
        className="mb-8 inline-flex min-h-[48px] items-center text-[14px] text-[var(--brand-blue)] underline-offset-4 hover:underline"
      >
        ← All books
      </Link>

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
          Ages {book.age_range} · {book.page_count} pages · {vocab.length} words
          taught · fully vowelled
        </p>
      </header>

      <section className="mb-12">
        <h2
          lang="ar"
          dir="rtl"
          className="mb-2 font-[family-name:var(--font-arabic)]"
          style={{ fontSize: "clamp(24px, 5vw, 30px)", lineHeight: 1.8 }}
        >
          أُسَرُ الْكَلِمَاتِ
        </h2>
        <p className="mb-6 text-[15px] text-[var(--ink)]/70">
          Arabic words grow from three letters. Words sharing the same three
          letters belong to one family, and their meanings are related. Tap any
          page number to hear and read it.
        </p>

        <ul className="flex flex-col gap-7">
          {families.map((family) => (
            <li key={family.root} className="flex flex-wrap items-start gap-4">
              <span
                lang="ar"
                dir="rtl"
                className="inline-flex shrink-0 items-center rounded-[12px] bg-[var(--brand-blue)] px-3 py-1.5 text-[var(--paper)] font-[family-name:var(--font-arabic)]"
                style={{
                  fontSize: "clamp(22px, 4vw, 28px)",
                  lineHeight: 1.4,
                  letterSpacing: "0.15em",
                }}
              >
                {family.root}
              </span>
              <ul className="flex flex-1 flex-col gap-1">
                {family.members.map((m, i) => (
                  <li
                    key={`${m.ar}-${m.page}-${i}`}
                    className="flex items-baseline justify-between gap-4"
                  >
                    <span
                      lang="ar"
                      dir="rtl"
                      className="font-[family-name:var(--font-arabic)]"
                      style={{
                        fontSize: "clamp(24px, 5vw, 30px)",
                        lineHeight: 1.8,
                      }}
                    >
                      {m.ar}
                    </span>
                    <Link
                      href={`/books/${book.slug}/p${m.page}`}
                      className="shrink-0 text-[15px] text-[var(--brand-blue)] underline-offset-4 hover:underline"
                    >
                      {m.page}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-[18px] font-medium">Every page</h2>
        <ul className="flex flex-wrap gap-2">
          {storyPages.map((n) => (
            <li key={n}>
              <Link
                href={`/books/${book.slug}/p${n}`}
                className="inline-flex h-[48px] min-w-[48px] items-center justify-center rounded-[12px] bg-[var(--surface)]/70 px-3 text-[15px] text-[var(--brand-blue)] transition-colors duration-150 ease-out hover:bg-[var(--surface)]"
              >
                {n}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
