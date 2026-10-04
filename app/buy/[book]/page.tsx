import Link from "next/link";
import { notFound } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import PaddleCheckoutButton from "@/components/PaddleCheckoutButton";
import { getEntitlement } from "@/lib/access";
import { getBook } from "@/lib/parse";
import { checkoutEnabled, paddleClientToken, paddleEnvironment, priceIdFor } from "@/lib/paddle";
import { createClient } from "@/lib/supabase/server";

// Hidden until launch: nothing links here, it is not indexed, and it 404s
// unless PADDLE_CHECKOUT_ENABLED=true and the book has a Paddle price.
export const metadata = { title: "Buy the digital edition", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function BuyPage({ params }: { params: Promise<{ book: string }> }) {
  const { book: slug } = await params;
  const priceId = priceIdFor(slug);
  if (!checkoutEnabled() || !priceId) notFound();

  const book = getBook(slug);
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const parentId = typeof data?.claims?.sub === "string" ? data.claims.sub : undefined;
  const email = typeof data?.claims?.email === "string" ? data.claims.email : undefined;
  const current = parentId ? await getEntitlement(slug) : null;

  const common = {
    token: paddleClientToken(),
    environment: paddleEnvironment(),
    priceId,
    successUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/buy/${slug}/thanks`,
  };

  return (
    <AccountShell
      eyebrow="Digital edition"
      title={book.title_en}
      intro="Every page of the book on qasaskids.com for 12 months: read aloud, with practice exercises and progress saved for each child."
    >
      {parentId ? (
        <div className="space-y-4">
          {current && !current.expired && (
            <p className="rounded-xl bg-sage/15 px-4 py-3 text-[14px] leading-6">
              You already have this book for {current.daysLeft} more days. Buying again extends it to
              12 months from today, not 12 months on top.
            </p>
          )}
          <p className="text-[15px] leading-6">
            Signed in as {email}. The book opens on this account as soon as payment completes.
          </p>
          <PaddleCheckoutButton {...common} email={email} parentId={parentId} label="Buy the digital edition" />
        </div>
      ) : (
        <div className="space-y-4 text-[15px] leading-6">
          <p>
            <Link href={`/account/sign-in?next=/buy/${slug}`} className="font-medium text-brand-blue underline">
              Sign in
            </Link>{" "}
            first and the book opens on your account straight after payment.
          </p>
          <p>Or buy without an account: we email you a code to enter when you create one.</p>
          <PaddleCheckoutButton {...common} label="Buy without signing in" />
        </div>
      )}
      <p className="mt-6 text-[13px] leading-5 opacity-70">
        Payment is handled by Paddle, our reseller, which also handles VAT.
      </p>
    </AccountShell>
  );
}
