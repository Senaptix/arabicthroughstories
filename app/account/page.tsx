import Link from "next/link";
import { redirect } from "next/navigation";
import BrandLockup from "@/components/BrandLockup";
import AvatarBadge from "@/components/account/AvatarBadge";
import ProfileCreator from "@/components/account/ProfileCreator";
import ProfileRenamer from "@/components/account/ProfileRenamer";
import ReceiptNotice from "@/components/account/ReceiptNotice";
import BookClaimer from "@/components/account/BookClaimer";
import { signOut, switchProfile } from "./actions";
import { getActiveProfile, getParentId, getProfiles } from "@/lib/account";
import { getEntitlements } from "@/lib/access";
import { isPublished } from "@/lib/catalogue";
import { getAllBooks } from "@/lib/parse";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Parent area" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ "password-updated"?: string }>;
}) {
  const parentId = await getParentId();
  if (!parentId) redirect("/account/sign-in");

  const profiles = await getProfiles(parentId);
  const active = await getActiveProfile(parentId);
  const books = getAllBooks();
  // Which books this parent actually holds. Entitlements are per book since
  // 2026-08-24, so with a series this is the difference between "your books"
  // and "every book we publish".
  const entitlements = await getEntitlements();
  const query = await searchParams;
  const supabase = await createClient();
  const [bookResult, pageResult] = active
    ? await Promise.all([
        supabase.from("book_progress").select("book_slug, last_page, last_seen_at").eq("child_id", active.id),
        supabase.from("page_progress").select("book_slug, page_number, read_completed_at, practice_completed_at").eq("child_id", active.id),
      ])
    : [{ data: [] }, { data: [] }];

  const progress = bookResult.data ?? [];
  const pages = pageResult.data ?? [];

  return (
    <>
      <header className="border-b border-ink/10 bg-paper/95">
        <div className="mx-auto flex min-h-[72px] max-w-[880px] items-center justify-between gap-4 px-6">
          <BrandLockup size="compact" />
          <form action={signOut}>
            <button className="min-h-[44px] text-[14px] text-brand-blue underline-offset-4 hover:underline">Sign out</button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[880px] px-6 py-10 sm:py-14">
        <div className="max-w-[650px]">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-blue">Parent area</p>
          <h1 className="mt-2 text-[clamp(32px,7vw,48px)] font-semibold leading-tight">Their reading, remembered</h1>
          <p className="mt-4 text-[16px] leading-7 text-ink/65">Choose who is reading, continue where they stopped, and revisit every word from the pages they have completed.</p>
        </div>

        {query["password-updated"] === "1" && (
          <p className="mt-7 rounded-xl bg-sage/15 px-4 py-3 text-[14px]">Your password has been updated.</p>
        )}

        {/* Above the profiles, because it is the one thing on this page with
            a deadline. Renders nothing once the purchase is approved. */}
        <ReceiptNotice />

        {/* How a family adds the next book in the series, and the only route
            back for anyone whose claim was rejected or has lapsed. */}
        <section
          id="add-a-book"
          className="border-ink/10 mt-12 scroll-mt-20 border-t pt-10"
        >
          <BookClaimer heading="Add another book" />
        </section>

        <section className="mt-10" aria-labelledby="profiles-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="profiles-heading" className="text-[20px] font-medium">Who is reading?</h2>
              <p className="mt-1 text-[14px] text-ink/55">Up to five child profiles</p>
            </div>
            <span className="text-[13px] text-ink/45">{profiles.length}/5</span>
          </div>

          {profiles.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {profiles.map((profile) => (
                <form action={switchProfile} key={profile.id}>
                  <input type="hidden" name="profileId" value={profile.id} />
                  <button className={`flex min-h-[64px] items-center gap-3 rounded-2xl border px-4 text-left transition-colors ${active?.id === profile.id ? "border-brand-blue bg-brand-blue/5" : "border-ink/15 bg-surface/55 hover:border-brand-blue/50"}`}>
                    <AvatarBadge avatar={profile.avatar_key} small />
                    <span>
                      <span className="block text-[15px] font-medium">{profile.display_name}</span>
                      <span className="block text-[12px] text-ink/50">{active?.id === profile.id ? "Reading now" : "Switch profile"}</span>
                    </span>
                  </button>
                </form>
              ))}
            </div>
          ) : (
            <p className="mt-5 border-l-2 border-sand pl-4 text-[15px] leading-6 text-ink/65">Create the first child profile below. Children never need their own login.</p>
          )}
        </section>

        {active && (
          <section className="mt-12 border-y border-ink/10 py-8" aria-labelledby="journey-heading">
            <div className="flex items-center gap-4">
              <AvatarBadge avatar={active.avatar_key} />
              <div>
                <p className="text-[13px] uppercase tracking-[0.12em] text-brand-blue">Now reading as</p>
                <h2 id="journey-heading" className="text-[24px] font-medium">{active.display_name}</h2>
                <ProfileRenamer
                  profileId={active.id}
                  currentName={active.display_name}
                />
              </div>
            </div>

            {/* Owned books first. With one book the order never mattered;
                with a series, a parent should not have to hunt past ten they
                have not bought to reach the one they are reading. */}
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              {[...books]
                .sort((a, b) => {
                  const av = entitlements.get(a.slug);
                  const bv = entitlements.get(b.slug);
                  const rank = (e?: { expired: boolean }) =>
                    e && !e.expired ? 0 : 1;
                  return rank(av) - rank(bv);
                })
                .map((book) => {
                const current = progress.find((item) => item.book_slug === book.slug);
                const completed = pages.filter((item) => item.book_slug === book.slug && item.read_completed_at).length;
                const practised = pages.filter((item) => item.book_slug === book.slug && item.practice_completed_at).length;
                const ent = entitlements.get(book.slug);
                const active = Boolean(ent && !ent.expired);
                return (
                  <article key={book.slug} className={`border-l-2 pl-5 ${active ? "border-brand-blue" : "border-ink/15"}`}>
                    <p lang="ar" dir="rtl" className="text-[24px] leading-[1.8]" style={{ fontFamily: "var(--font-arabic)", textAlign: "start" }}>{book.title_ar}</p>
                    <h3 className="mt-1 text-[19px] font-medium">{book.title_en}</h3>

                    {/* Say plainly whether this book is open to them. Without
                        it a parent with several books cannot tell which one
                        will hit a gate until they hit it. */}
                    <p className="mt-2 text-[13px] font-medium">
                      {active ? (
                        <span className="text-brand-blue">
                          Full access
                          {ent && ent.daysLeft <= 30 ? ` · ${ent.daysLeft} ${ent.daysLeft === 1 ? "day" : "days"} left` : ""}
                        </span>
                      ) : isPublished(book.slug) ? (
                        <span className="text-ink/50">
                          Free preview only ·{" "}
                          <Link href="/account#add-a-book" className="text-brand-blue underline-offset-4 hover:underline">
                            add this book
                          </Link>
                        </span>
                      ) : (
                        <span className="text-ink/50">Not published yet · free to read</span>
                      )}
                    </p>

                    <p className="mt-3 text-[14px] leading-6 text-ink/55">{completed} pages completed · {practised} practice sets</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link href={current ? `/books/${book.slug}/p${current.last_page}` : `/books/${book.slug}`} className={`inline-flex min-h-[46px] items-center rounded-xl px-5 text-[14px] font-medium ${active ? "bg-brand-blue text-paper" : "border border-brand-blue text-brand-blue"}`}>
                        {current ? `Continue page ${current.last_page}` : "Open book companion"}
                      </Link>
                      <Link href={`/account/my-words?book=${book.slug}`} className="inline-flex min-h-[46px] items-center rounded-xl border border-brand-blue px-5 text-[14px] font-medium text-brand-blue">My Words</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {profiles.length < 5 && <div className="mt-12"><ProfileCreator /></div>}
        <p className="mt-10 text-[13px] leading-5 text-ink/45">Purchase access is managed separately and has not been enabled by this account setup.</p>
      </main>
    </>
  );
}
