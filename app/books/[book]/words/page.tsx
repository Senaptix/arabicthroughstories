import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import HomeBar from "@/components/HomeBar";
import RootFamily from "@/components/RootFamily";
import { getAllBooks, getBook, parseRootFamilies } from "@/lib/parse";

/**
 * The word families, on their own screen.
 *
 * They used to sit on the book page above the page index, where all 32 of
 * them stood between a reader and the page they actually came for. This is a
 * reference you go to deliberately, so it gets its own address.
 *
 * NOT GATED, and that is deliberate: ACCESS_MODEL.md keeps the root appendix
 * and the vocabulary index in the open tier. They are what earns links and
 * search traffic, and they are no substitute for owning the book — the roots
 * tell you words are related, the book is where you meet them in a story.
 * `canViewPage` is therefore not called here, and should not be added.
 */

type Params = { book: string };

export function generateStaticParams(): Params[] {
  return getAllBooks().map((book) => ({ book: book.slug }));
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
      title: `Word families — ${book.title_en}`,
      description:
        "Arabic words that share three letters share a meaning. Every root family in the book, with the page each word appears on.",
    };
  } catch {
    return {};
  }
}

export default async function WordsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { book: slug } = await params;

  let book, families;
  try {
    book = getBook(slug);
    families = parseRootFamilies(slug);
  } catch {
    notFound();
  }

  return (
    <>
      <HomeBar bookSlug={book.slug} />

      <main className="mx-auto w-full max-w-[640px] px-6 py-8 sm:px-8">
        <div className="mb-8 flex items-baseline justify-between gap-4">
          <span className="text-[14px] font-medium text-[var(--brand-blue)]">
            Word families
          </span>
          <Link
            href={`/books/${book.slug}`}
            className="text-[14px] text-[var(--brand-blue)] underline-offset-4 hover:underline"
          >
            {book.title_en}
          </Link>
        </div>

        <h1
          className="text-ink font-semibold text-balance"
          style={{
            fontSize: "clamp(26px, 5vw, 36px)",
            lineHeight: 1.15,
            letterSpacing: "-0.015em",
          }}
        >
          Words that share three letters share a meaning.
        </h1>

        <p className="mt-4 max-w-[54ch] text-[15px] text-[var(--ink)]/70">
          Arabic words grow from a root of three letters. Open a root to see
          its words, and tap any word to go to the page it appears on.{" "}
          {families.length} families run through this book — meeting the second
          member of one, pages after the first, is the moment the pattern
          lands.
        </p>

        <h2
          lang="ar"
          dir="rtl"
          className="mt-8 mb-4 font-[family-name:var(--font-arabic)]"
          style={{ fontSize: "clamp(24px, 5vw, 30px)", lineHeight: 1.8 }}
        >
          الْجُذُورُ
        </h2>

        <RootFamily families={families} bookSlug={book.slug} currentPage={0} />

        <div className="mt-12 border-t border-[var(--ink)]/10 pt-6">
          <Link
            href={`/books/${book.slug}#every-page`}
            className="inline-flex min-h-[48px] items-center text-[15px] text-[var(--brand-blue)] underline-offset-4 hover:underline"
          >
            ← Back to every page
          </Link>
        </div>
      </main>
    </>
  );
}
