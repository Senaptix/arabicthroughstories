import { notFound } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import BuyOptions from "@/components/BuyOptions";
import { getEntitlement } from "@/lib/access";
import { checkoutEnabled, paddleClientToken, paddleEnvironment, priceIdFor } from "@/lib/paddle";
import { createClient } from "@/lib/supabase/server";

// Hidden until launch: nothing links here, it is not indexed, and it 404s
// unless PADDLE_CHECKOUT_ENABLED=true and the bundle has a Paddle price.
export const metadata = { title: "Buy the digital edition - Both parts", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function BuyBothPage() {
  const annualPriceId = priceIdFor("both", "annual");
  const monthlyPriceId = priceIdFor("both", "monthly");
  if (!checkoutEnabled() || (!annualPriceId && !monthlyPriceId)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const parentId = typeof data?.claims?.sub === "string" ? data.claims.sub : undefined;
  const email = typeof data?.claims?.email === "string" ? data.claims.email : undefined;

  const currentIbrahim = parentId ? await getEntitlement("ibrahim") : null;
  const currentYusuf = parentId ? await getEntitlement("yusuf") : null;
  const activeExisting = [
    currentIbrahim && !currentIbrahim.expired ? "Ibrahim" : null,
    currentYusuf && !currentYusuf.expired ? "Yusuf" : null,
  ].filter(Boolean) as string[];

  return (
    <AccountShell
      eyebrow="Digital edition"
      title="Volume 1: Both parts"
      intro="Every page of both books (Ibrahim and Yusuf) on qasaskids.com: read aloud, with practice exercises and progress saved for each child."
    >
      {parentId && activeExisting.length > 0 && (
        <p className="mb-6 rounded-xl bg-sage/15 px-4 py-3 text-[14px] leading-6">
          You already have active access to {activeExisting.join(" and ")}. Buying again extends your
          access to 12 months from today, not 12 months on top.
        </p>
      )}

      <BuyOptions
        token={paddleClientToken()}
        environment={paddleEnvironment()}
        slug="both"
        annualPriceId={annualPriceId}
        monthlyPriceId={monthlyPriceId}
        parentId={parentId}
        email={email}
        successUrl={`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/buy/both/thanks`}
        isBundle
      />

      <p className="mt-6 text-[13px] leading-5 opacity-70">
        Payment is handled by Paddle, our reseller, which also handles VAT.
      </p>
    </AccountShell>
  );
}
