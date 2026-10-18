"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

import type { PaddleGlobal } from "./PaddleCheckoutButton";

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

  return (
    <>
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        onLoad={initPaddle}
        onReady={initPaddle}
      />

      <div className="space-y-6">
        {hasAnnual && hasMonthly && (
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
              <div className="text-[14px] font-semibold text-ink">Monthly</div>
              <div className="mt-1 text-[18px] font-semibold text-brand-blue">
                {monthlyPrice ? `${monthlyPrice}/mo` : "—"}
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
              <div className="text-[14px] font-semibold text-ink">12 months, pay once</div>
              <div className="mt-1 text-[18px] font-semibold text-brand-blue">
                {annualPrice ?? "—"}
              </div>
              <div className="mt-1 text-[12px] text-ink/60">12 months full access</div>
            </button>
          </div>
        )}

        {selectedPlan === "monthly" ? (
          parentId ? (
            <div className="space-y-4">
              <p className="text-[15px] leading-6">
                Signed in as {email}. Access renews monthly until cancelled and opens on this account immediately.
              </p>
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
                {monthlyPrice ? `Subscribe — ${monthlyPrice}/mo` : "Subscribe monthly"}
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
                  : isBundle
                    ? "Buy both parts"
                    : "Buy the digital edition"}
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
