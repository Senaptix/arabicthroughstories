import Link from "next/link";
import { notFound } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import { getParentId } from "@/lib/account";
import { getBook } from "@/lib/parse";
import { checkoutEnabled, priceIdFor } from "@/lib/paddle";

export const metadata = { title: "Thank you", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// Paddle's webhook, not this page, grants access. It usually lands within
// seconds, but this page must not claim the book is open: it may not be yet.
export default async function ThanksPage({ params }: { params: Promise<{ book: string }> }) {
  const { book: slug } = await params;
  if (slug === "both") notFound();
  if (!checkoutEnabled() || !priceIdFor(slug)) notFound();
  const book = getBook(slug);
  const signedIn = !!(await getParentId());

  return (
    <AccountShell eyebrow="Thank you" title="Payment received" intro={`${book.title_en}, digital edition.`}>
      {signedIn ? (
        <p className="text-[15px] leading-6">
          The book is opening on your account now. It normally takes a few seconds.{" "}
          <Link href={`/books/${slug}`} className="font-medium text-brand-blue underline">
            Go to the book
          </Link>
          . If it still shows the preview after a minute, refresh the page.
        </p>
      ) : (
        <p className="text-[15px] leading-6">
          We&rsquo;ve emailed your activation code to the address you gave at checkout. Create a parent
          account and enter the code where it asks for your order number.{" "}
          <Link href="/account/sign-up" className="font-medium text-brand-blue underline">
            Create an account
          </Link>
          .
        </p>
      )}
      <p className="mt-6 text-[13px] leading-5 opacity-70">
        Paddle also emails you a receipt. Questions: accounts@qasaskids.com
      </p>
    </AccountShell>
  );
}
