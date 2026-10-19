"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

import type { PaddleGlobal } from "./PaddleCheckoutButton";
import { formatPrice, PRICING } from "@/lib/pricing";

export default function BuyOptions({
  token,
  environment,
  slug,
  annualPriceId,
  monthlyPriceId,
  parentId,
  email,
  successUrl,
  isBundle = false,
}: {
  token: string;
  environment: "sandbox" | "production";
  slug: string;
  annualPriceId: string | null;
  monthlyPriceId: string | null;
  parentId?: string;
  email?: string;
  successUrl: string;
  isBundle?: boolean;
}) {
  const [paddleReady, setPaddleReady] = useState(false);
  const [annualPrice, setAnnualPrice] = useState<string | null>(null);
  const [monthlyPrice, setMonthlyPrice] = useState<string | null>(null);

  const hasAnnual = Boolean(annualPriceId);
  const hasMonthly = Boolean(monthlyPriceId);

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">(() => {
    if (hasAnnual) return "annual";
    return "monthly";
  });

  const initPaddle = () => {
    if (!window.Paddle) return;
    if (environment === "sandbox") {
      window.Paddle.Environment.set("sandbox");
    }
    window.Paddle.Initialize({ token });
    setPaddleReady(true);
  };

  useEffect(() => {
    if (window.Paddle) {
      initPaddle();
    }
  }, []);

  useEffect(() => {
    if (!paddleReady || !window.Paddle) return;
    const items: { priceId: string; quantity: number }[] = [];
    if (annualPriceId) items.push({ priceId: annualPriceId, quantity: 1 });
    if (monthlyPriceId) items.push({ priceId: monthlyPriceId, quantity: 1 });
    if (items.length === 0) return;

    window.Paddle.PricePreview({ items })
      .then((res) => {
        const lineItems = res?.data?.details?.lineItems ?? [];
        for (const item of lineItems) {
          const id = item.price?.id;
          const formatted = item.formattedTotals?.total ?? item.formattedTotals?.subtotal;
          if (!id || !formatted) continue;
          if (id === annualPriceId) setAnnualPrice(formatted);
          if (id === monthlyPriceId) setMonthlyPrice(formatted);
        }
      })
      .catch((err) => {
        console.error("Paddle PricePreview failed", err);
      });
  }, [paddleReady, annualPriceId, monthlyPriceId]);

  const next = encodeURIComponent(`/buy/${slug}`);
  const signedOut = (
    <div className="space-y-4 text-[15px] leading-6">
      <p className="rounded-xl border border-brand-blue/20 bg-sand/40 p-4 text-[14px]">
        Create an account or sign in to buy
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/account/sign-up?next=${next}`}
          className="inline-flex rounded-full bg-brand-blue px-6 py-3 text-[16px] font-medium text-white hover:bg-brand-blue/90"
        >
          Create an account
        </Link>
        <Link
          href={`/account/sign-in?next=${next}`}
          className="inline-flex rounded-full border border-brand-blue px-6 py-3 text-[16px] font-medium text-brand-blue"
        >
          Sign in
        </Link>
      </div>
    </div>
  );

  const activePriceId = selectedPlan === "monthly" ? monthlyPriceId : annualPriceId;

  const buyDisclosure = (
    <div className="space-y-2 rounded-xl bg-sand/30 p-4 text-[13px] leading-relaxed text-ink/75">
      <p>
        <strong>What you get:</strong>{" "}
        {selectedPlan === "monthly"
          ? "Monthly subscription renewing until cancelled."
          : "12 months' online access to the digital edition."}
      </p>
      <p>Audio is currently an AI voice and may be replaced by a human narrator.</p>
      <p>
        <strong>14-day full refund:</strong> if it is not right for your child, ask within 14 days and we refund you in full.
      </p>
      <p className="text-ink/60">
        See our{" "}
        <Link href="/terms" className="text-brand-blue underline underline-offset-4">
          Terms
        </Link>
        ,{" "}
        <Link href="/refunds" className="text-brand-blue underline underline-offset-4">
          Refunds
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-brand-blue underline underline-offset-4">
          Privacy
        </Link>
        .
      </p>
    </div>
  );

  const pricingConfig = isBundle ? PRICING.bundle : PRICING.single;
  const serverAnnualPrice = formatPrice(pricingConfig.annual);
  const serverMonthlyPrice = formatPrice(pricingConfig.monthly);

  return (
    <>
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        onLoad={initPaddle}
        onReady={initPaddle}
      />

      <div className="space-y-6">
        {hasAnnual && hasMonthly && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlan("monthly")}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  selectedPlan === "monthly"
                    ? "border-brand-blue bg-brand-blue/5 shadow-sm"
                    : "border-ink/15 hover:border-ink/30"
                }`}
              >
                <div className="text-[14px] font-semibold text-ink">
                  Monthly: {serverMonthlyPrice} a month, cancel any time
                </div>
                <div className="mt-1 text-[18px] font-semibold text-brand-blue">
                  {monthlyPrice ? `${monthlyPrice}/mo` : `${serverMonthlyPrice}/mo`}
                </div>
                <div className="mt-1 text-[12px] text-ink/60">Renews monthly, cancel anytime</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan("annual")}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  selectedPlan === "annual"
                    ? "border-brand-blue bg-brand-blue/5 shadow-sm"
                    : "border-ink/15 hover:border-ink/30"
                }`}
              >
                <div className="text-[14px] font-semibold text-ink">
                  12 months, pay once: {serverAnnualPrice}
                </div>
                <div className="mt-1 text-[18px] font-semibold text-brand-blue">
                  {annualPrice ?? serverAnnualPrice}
                </div>
                <div className="mt-1 text-[12px] text-ink/60">12 months full access</div>
              </button>
            </div>
            <p className="text-[13px] leading-5 text-ink/65">
              Prices include any tax due. Your local currency and the final amount are shown at checkout.
            </p>
          </div>
        )}

        {selectedPlan === "monthly" ? (
          parentId ? (
            <div className="space-y-4">
              <p className="text-[15px] leading-6">
                Signed in as {email}. Access renews monthly until cancelled and opens on this account immediately.
              </p>
              {buyDisclosure}
              <button
                type="button"
                disabled={!paddleReady || !activePriceId}
                onClick={() =>
                  window.Paddle?.Checkout.open({
                    items: [{ priceId: activePriceId!, quantity: 1 }],
                    customer: email ? { email } : undefined,
                    customData: { parent_id: parentId },
                    settings: { displayMode: "overlay", successUrl, theme: "light" },
                  })
                }
                className="rounded-full bg-brand-blue px-6 py-3 text-[16px] font-medium text-white disabled:opacity-50"
              >
                {monthlyPrice ? `Subscribe — ${monthlyPrice}/mo` : `Subscribe — ${serverMonthlyPrice}/mo`}
              </button>
            </div>
          ) : (
            signedOut
          )
        ) : (
          parentId ? (
            <div className="space-y-4">
              <p className="text-[15px] leading-6">
                Signed in as {email}. The book opens on this account as soon as payment completes.
              </p>
              {buyDisclosure}
              <button
                type="button"
                disabled={!paddleReady || !activePriceId}
                onClick={() =>
                  window.Paddle?.Checkout.open({
                    items: [{ priceId: activePriceId!, quantity: 1 }],
                    customer: email ? { email } : undefined,
                    customData: { parent_id: parentId },
                    settings: { displayMode: "overlay", successUrl, theme: "light" },
                  })
                }
                className="rounded-full bg-brand-blue px-6 py-3 text-[16px] font-medium text-white disabled:opacity-50"
              >
                {annualPrice
                  ? `${isBundle ? "Buy both parts" : "Buy the digital edition"} — ${annualPrice}`
                  : `${isBundle ? "Buy both parts" : "Buy the digital edition"} — ${serverAnnualPrice}`}
              </button>
            </div>
          ) : (
            signedOut
          )
        )}
      </div>
    </>
  );
}
