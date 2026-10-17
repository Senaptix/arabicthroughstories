import type { Metadata } from "next";
import Link from "next/link";
import BrandLockup from "@/components/BrandLockup";
import Eyebrow from "@/components/Eyebrow";
import HomeBar from "@/components/HomeBar";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for purchasing and using the Qasas Kids digital edition.",
};

export default function TermsPage() {
  return (
    <>
      <HomeBar />

      <main className="mx-auto w-full max-w-[720px] px-6 py-12 sm:px-8 lg:py-16">
        <header>
          <Eyebrow>Terms</Eyebrow>
          <h1
            className="text-ink mt-4 font-semibold text-balance"
            style={{
              fontSize: "clamp(30px, 5.5vw, 44px)",
              lineHeight: 1.15,
              letterSpacing: "-0.015em",
            }}
          >
            Terms of Service
          </h1>
          <p className="text-ink/50 mt-3 text-[14px]">Last updated 17 October 2026</p>
        </header>

        <div className="text-ink/80 mt-10 space-y-8 text-[16px] leading-7">
          <section>
            <h2 className="text-ink text-[20px] font-semibold">The business</h2>
            <p className="mt-3">
              Qasas Kids is provided by [TODO company name, number, address, contact email].
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Seller of record</h2>
            <p className="mt-3">
              Paddle.com is the merchant and seller of record for all online purchases made through this site.
              Paddle handles order payment, billing, currency conversion, and remits VAT and sales tax per customer country.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">The digital product and access</h2>
            <p className="mt-3">
              Purchasing a digital edition grants 12 months of online companion access to one book (or both books if purchasing the bundle).
            </p>
            <p className="mt-3">
              Access is provided through your web browser on qasaskids.com. Content is read online only; nothing is downloaded, and offline files or software downloads are not provided.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Accounts</h2>
            <p className="mt-3">
              Access requires a parent account registered with a valid parent email address. Parents can add child profiles (using a first name or nickname) to save individual reading progress.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Refunds</h2>
            <p className="mt-3">
              Our refund terms are described on our{" "}
              <Link href="/refunds" className="text-brand-blue underline underline-offset-4">
                Refunds page
              </Link>
              : [TODO e.g. 14 days, full refund if few pages read].
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Contact</h2>
            <p className="mt-3">
              For any questions regarding these terms or your access, please contact [TODO company name, number, address, contact email].
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
            <Link href="/terms" className="text-ink font-medium underline-offset-4 hover:underline">
              Terms
            </Link>
            <span className="text-ink/25" aria-hidden="true">·</span>
            <Link href="/refunds" className="hover:text-ink underline-offset-4 hover:underline">
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
