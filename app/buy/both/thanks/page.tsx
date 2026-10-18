import Link from "next/link";
import { notFound } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import { checkoutEnabled, priceIdFor } from "@/lib/paddle";

export const metadata = { title: "Thank you", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// Paddle's webhook, not this page, grants access. It usually lands within
// seconds, but this page must not claim the books are open: they may not be yet.
export default async function BothThanksPage() {
  if (!checkoutEnabled() || (!priceIdFor("both", "annual") && !priceIdFor("both", "monthly"))) notFound();

  return (
    <AccountShell eyebrow="Thank you" title="Payment received" intro="Volume 1: Both parts (Ibrahim & Yusuf), digital edition.">
      <p className="text-[15px] leading-6">
        Your books are on your account. They normally open within a few seconds; if they still show
        the preview after a minute, refresh the page.
      </p>
      <Link
        href="/account"
        className="mt-5 inline-flex rounded-full bg-brand-blue px-6 py-3 text-[16px] font-medium text-white"
      >
        Go to my account
      </Link>
      <p className="mt-6 text-[13px] leading-5 opacity-70">
        Paddle also emails you a receipt. Questions: accounts@qasaskids.com
      </p>
    </AccountShell>
  );
}
