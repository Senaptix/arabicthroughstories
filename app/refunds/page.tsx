import type { Metadata } from "next";
import Link from "next/link";
import BrandLockup from "@/components/BrandLockup";
import Eyebrow from "@/components/Eyebrow";
import HomeBar from "@/components/HomeBar";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund policy for Qasas Kids digital edition purchases.",
};

export default function RefundsPage() {
  return (
    <>
      <HomeBar />

      <main className="mx-auto w-full max-w-[720px] px-6 py-12 sm:px-8 lg:py-16">
        <header>
          <Eyebrow>Refunds</Eyebrow>
          <h1
            className="text-ink mt-4 font-semibold text-balance"
            style={{
              fontSize: "clamp(30px, 5.5vw, 44px)",
              lineHeight: 1.15,
              letterSpacing: "-0.015em",
            }}
          >
            Refund Policy
          </h1>
          <p className="text-ink/50 mt-3 text-[14px]">Last updated 17 October 2026</p>
        </header>

        <div className="text-ink/80 mt-10 space-y-8 text-[16px] leading-7">
          <section>
            <h2 className="text-ink text-[20px] font-semibold">Seller of record</h2>
            <p className="mt-3">
              Paddle.com is the seller of record for all online purchases on this site. Paddle processes payments and issues refunds directly to your original payment method.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Digital access and format</h2>
            <p className="mt-3">
              Annual purchases grant 12 months&rsquo; online access to one book&rsquo;s Digital Edition (or both books in the bundle).
              The Digital Edition is read online only; nothing is downloaded.
            </p>
            <p className="mt-3">
              Monthly subscriptions renew monthly until cancelled. You can cancel any time from your account, and access continues to the end of the paid month.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Refund policy</h2>
            <p className="mt-3">
              [TODO e.g. 14 days, full refund if few pages read].
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Requesting a refund</h2>
            <p className="mt-3">
              To request a refund, please contact [TODO company name, number, address, contact email] or follow the support link on your Paddle receipt with your order or transaction ID.
            </p>
            <p className="mt-3">
              When a refund is completed, digital access for the refunded book(s) is revoked.
            </p>
          </section>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-[720px] px-6 py-12 sm:px-8">
        <div className="border-ink/10 flex flex-col gap-4 border-t pt-8 sm:flex-row sm:items-center sm:justify-between text-[14px] text-ink/60">
          <BrandLockup size="footer" />
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href="/" className="hover:text-ink underline-offset-4 hover:underline">
              Home
            </Link>
            <span className="text-ink/25" aria-hidden="true">·</span>
            <Link href="/about" className="hover:text-ink underline-offset-4 hover:underline">
              About
            </Link>
            <span className="text-ink/25" aria-hidden="true">·</span>
            <Link href="/terms" className="hover:text-ink underline-offset-4 hover:underline">
              Terms
            </Link>
            <span className="text-ink/25" aria-hidden="true">·</span>
            <Link href="/refunds" className="text-ink font-medium underline-offset-4 hover:underline">
              Refunds
            </Link>
            <span className="text-ink/25" aria-hidden="true">·</span>
            <Link href="/privacy" className="hover:text-ink underline-offset-4 hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
