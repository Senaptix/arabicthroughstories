"use client";

import Script from "next/script";
import { useState } from "react";

type PaddleGlobal = {
  Environment: { set(env: string): void };
  Initialize(opts: { token: string }): void;
  Checkout: {
    open(opts: {
      items: { priceId: string; quantity: number }[];
      customer?: { email: string };
      customData?: Record<string, string>;
      settings?: { displayMode?: string; successUrl?: string; theme?: string };
    }): void;
  };
};

declare global {
  interface Window {
    Paddle?: PaddleGlobal;
  }
}

/** Opens Paddle's overlay checkout on our page. Payment happens inside Paddle. */
export default function PaddleCheckoutButton({
  token,
  environment,
  priceId,
  email,
  parentId,
  successUrl,
  label,
}: {
  token: string;
  environment: "sandbox" | "production";
  priceId: string;
  email?: string;
  parentId?: string;
  successUrl: string;
  label: string;
}) {
  const [ready, setReady] = useState(false);

  return (
    <>
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        onReady={() => {
          if (!window.Paddle) return;
          if (environment === "sandbox") window.Paddle.Environment.set("sandbox");
          window.Paddle.Initialize({ token });
          setReady(true);
        }}
      />
      <button
        type="button"
        disabled={!ready}
        onClick={() =>
          window.Paddle?.Checkout.open({
            items: [{ priceId, quantity: 1 }],
            customer: email ? { email } : undefined,
            customData: parentId ? { parent_id: parentId } : undefined,
            settings: { displayMode: "overlay", successUrl, theme: "light" },
          })
        }
        className="rounded-full bg-brand-blue px-6 py-3 text-[16px] font-medium text-white disabled:opacity-50"
      >
        {label}
      </button>
    </>
  );
}
