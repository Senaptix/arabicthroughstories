import type { Metadata } from "next";
import Link from "next/link";
import BrandLockup from "@/components/BrandLockup";
import Eyebrow from "@/components/Eyebrow";
import HomeBar from "@/components/HomeBar";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Qasas Kids accounts and digital edition access.",
};

export default function PrivacyPage() {
  return (
    <>
      <HomeBar />

      <main className="mx-auto w-full max-w-[720px] px-6 py-12 sm:px-8 lg:py-16">
        <header>
          <Eyebrow>Privacy</Eyebrow>
          <h1
            className="text-ink mt-4 font-semibold text-balance"
            style={{
              fontSize: "clamp(30px, 5.5vw, 44px)",
              lineHeight: 1.15,
              letterSpacing: "-0.015em",
            }}
          >
            Privacy Policy
          </h1>
          <p className="text-ink/50 mt-3 text-[14px]">Last updated 17 October 2026</p>
        </header>

        <div className="text-ink/80 mt-10 space-y-8 text-[16px] leading-7">
          <section>
            <h2 className="text-ink text-[20px] font-semibold">Who we are</h2>
            <p className="mt-3">
              Qasas Kids is operated by [TODO company name, number, address, contact email].
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">What data we store</h2>
            <p className="mt-3">
              We collect and store only the minimum information required to operate accounts and record learning progress:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Parent email address</strong> — to authenticate your account, send activation codes, and deliver service updates.
              </li>
              <li>
                <strong>Child first name or nickname</strong> — chosen by the parent to distinguish profiles.
              </li>
              <li>
                <strong>Reading progress</strong> — which pages a child has completed and practice exercises attempted.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Where your data is stored</h2>
            <p className="mt-3">
              Account data, child profiles, and reading progress are stored in Supabase (EU region [TODO confirm]).
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Payments</h2>
            <p className="mt-3">
              Online payments are handled by Paddle.com as the seller of record.
              Paddle processes payment details and manages sales tax and VAT.
              We do not receive or store your card or bank details.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Digital delivery</h2>
            <p className="mt-3">
              Purchases grant 12 months&rsquo; online access to one book&rsquo;s Digital Edition (or both).
              The site is read online only; nothing is downloaded to your device.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Contact and data requests</h2>
            <p className="mt-3">
              To request a copy of your data or deletion of your account and learning records, please contact [TODO company name, number, address, contact email].
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
            <Link href="/refunds" className="hover:text-ink underline-offset-4 hover:underline">
              Refunds
            </Link>
            <span className="text-ink/25" aria-hidden="true">·</span>
            <Link href="/privacy" className="text-ink font-medium underline-offset-4 hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
