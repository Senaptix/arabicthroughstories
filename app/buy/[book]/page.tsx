import { notFound } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import BuyOptions from "@/components/BuyOptions";
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
  if (slug === "both") notFound();
  const annualPriceId = priceIdFor(slug, "annual");
  const monthlyPriceId = priceIdFor(slug, "monthly");
  if (!checkoutEnabled() || (!annualPriceId && !monthlyPriceId)) notFound();

  const book = getBook(slug);
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const parentId = typeof data?.claims?.sub === "string" ? data.claims.sub : undefined;
  const email = typeof data?.claims?.email === "string" ? data.claims.email : undefined;
  const current = parentId ? await getEntitlement(slug) : null;

  return (
    <AccountShell
      eyebrow="Digital edition"
      title={book.title_en}
      intro="Every page of the book on qasaskids.com: read aloud, with practice exercises and progress saved for each child."
    >
      {parentId && current && !current.expired && (
        <p className="mb-6 rounded-xl bg-sage/15 px-4 py-3 text-[14px] leading-6">
          You already have this book for {current.daysLeft} more days. Buying again extends it to
          12 months from today, not 12 months on top.
        </p>
      )}

      <BuyOptions
        token={paddleClientToken()}
        environment={paddleEnvironment()}
        slug={slug}
        annualPriceId={annualPriceId}
        monthlyPriceId={monthlyPriceId}
        parentId={parentId}
        email={email}
        successUrl={`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/buy/${slug}/thanks`}
      />

      <p className="mt-6 text-[13px] leading-5 opacity-70">
        Payment is handled by Paddle, our reseller, which also handles VAT.
      </p>
    </AccountShell>
  );
}
