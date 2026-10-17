import Link from "next/link";
import { notFound } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import { getParentId } from "@/lib/account";
import { checkoutEnabled, priceIdFor } from "@/lib/paddle";

export const metadata = { title: "Thank you", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// Paddle's webhook, not this page, grants access. It usually lands within
// seconds, but this page must not claim the books are open: they may not be yet.
export default async function BothThanksPage() {
  if (!checkoutEnabled() || (!priceIdFor("both", "annual") && !priceIdFor("both", "monthly"))) notFound();
  const signedIn = !!(await getParentId());

  return (
    <AccountShell eyebrow="Thank you" title="Payment received" intro="Volume 1: Both parts (Ibrahim & Yusuf), digital edition.">
      {signedIn ? (
        <p className="text-[15px] leading-6">
          Both books are opening on your account now. It normally takes a few seconds.{" "}
          <Link href="/books/ibrahim" className="font-medium text-brand-blue underline">
            Go to Ibrahim
          </Link>
          {" or "}
          <Link href="/books/yusuf" className="font-medium text-brand-blue underline">
            Go to Yusuf
          </Link>
          . If they still show the preview after a minute, refresh the page.
        </p>
      ) : (
        <p className="text-[15px] leading-6">
          We&rsquo;ve emailed two activation codes to the address you gave at checkout. Create a parent
          account and enter the first code where it asks for your order number, then enter the second code on your account page.{" "}
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
