import Link from "next/link";
import { notFound } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import { getBook } from "@/lib/parse";
import { checkoutEnabled, priceIdFor } from "@/lib/paddle";

export const metadata = { title: "Thank you", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// Paddle's webhook, not this page, grants access. It usually lands within
// seconds, but this page must not claim the book is open: it may not be yet.
export default async function ThanksPage({ params }: { params: Promise<{ book: string }> }) {
  const { book: slug } = await params;
  if (slug === "both") notFound();
  if (!checkoutEnabled() || (!priceIdFor(slug, "annual") && !priceIdFor(slug, "monthly"))) notFound();
  const book = getBook(slug);

  return (
    <AccountShell eyebrow="Thank you" title="Payment received" intro={`${book.title_en}, digital edition.`}>
      <p className="text-[15px] leading-6">
        Your book is on your account. It normally opens within a few seconds; if it still shows the
        preview after a minute, refresh the page.
      </p>
      <Link
        href={`/books/${slug}`}
        className="mt-5 inline-flex rounded-full bg-brand-blue px-6 py-3 text-[16px] font-medium text-white"
      >
        Go to the book
      </Link>
      <p className="mt-6 text-[13px] leading-5 opacity-70">
        Paddle also emails you a receipt. Questions: accounts@qasaskids.com
      </p>
    </AccountShell>
  );
}
