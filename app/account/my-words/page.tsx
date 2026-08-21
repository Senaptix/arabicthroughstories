import Link from "next/link";
import { redirect } from "next/navigation";
import HomeBar from "@/components/HomeBar";
import VocabCards from "@/components/VocabCards";
import { getActiveProfile, getParentId } from "@/lib/account";
import { getAllBooks, parseVocabulary } from "@/lib/parse";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My Words" };

export default async function MyWordsPage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string }>;
}) {
  const parentId = await getParentId();
  if (!parentId) redirect("/account/sign-in?next=/account/my-words");
  const profile = await getActiveProfile(parentId);
  if (!profile) redirect("/account");

  const query = await searchParams;
  const books = getAllBooks();
  const selected = books.find((book) => book.slug === query.book) ?? books[0];
  if (!selected) redirect("/account");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("page_progress")
    .select("page_number")
    .eq("child_id", profile.id)
    .eq("book_slug", selected.slug)
    .not("read_completed_at", "is", null);
  if (error) throw new Error(`Could not load saved words: ${error.message}`);
  const completedPages = new Set((data ?? []).map((row) => row.page_number));
  const words = parseVocabulary(selected.slug).filter((word) => completedPages.has(word.page));

  return (
    <>
      <HomeBar bookSlug={selected.slug} />
      <main className="mx-auto w-full max-w-[640px] px-6 py-10 sm:px-8">
        <Link href="/account" className="text-[14px] text-brand-blue underline-offset-4 hover:underline">← Parent area</Link>
        <header className="mt-8 border-l-2 border-brand-blue pl-5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-blue">{profile.display_name}&rsquo;s collection</p>
          <h1 className="mt-2 text-[clamp(32px,7vw,46px)] font-semibold">My Words</h1>
          <p className="mt-3 text-[15px] leading-7 text-ink/60">Words from the exact pages marked as read in <i>{selected.title_en}</i>.</p>
        </header>

        {words.length > 0 ? (
          <section className="mt-10">
            <p className="mb-5 text-[14px] text-ink/55">{words.length} {words.length === 1 ? "word" : "words"} collected</p>
            <VocabCards words={words} idPrefix={`my-${selected.slug}`} />
          </section>
        ) : (
          <div className="mt-10 border-y border-ink/10 py-8">
            <h2 className="text-[19px] font-medium">No words collected yet</h2>
            <p className="mt-2 text-[15px] leading-6 text-ink/60">Open a story page and choose “Mark page read”. Its new words will appear here.</p>
            <Link href={`/books/${selected.slug}`} className="mt-5 inline-flex min-h-[46px] items-center rounded-xl bg-brand-blue px-5 text-[14px] font-medium text-paper">Open the book companion</Link>
          </div>
        )}
      </main>
    </>
  );
}
