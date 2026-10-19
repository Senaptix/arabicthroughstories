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
          <p className="text-ink/50 mt-3 text-[14px]">Last updated 19 October 2026</p>
        </header>

        <div className="text-ink/80 mt-10 space-y-8 text-[16px] leading-7">
          <section>
            <h2 className="text-ink text-[20px] font-semibold">Seller of record</h2>
            <p className="mt-3">
              Paddle.com is the merchant and seller of record for all online purchases on Qasas Kids. Paddle takes payment, handles sales tax and VAT, and issues refunds directly to your original payment method.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Our 14-day refund promise</h2>
            <p className="mt-3">
              We want parents to be completely confident trying Qasas Kids. If you purchase digital access and decide within 14 days that it is not right for your child, you can ask for a full refund.
            </p>
            <p className="mt-3">
              This applies to both 12-month access purchases and the first month of a monthly subscription.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">How to request a refund</h2>
            <p className="mt-3">
              You can request a refund in two simple ways:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Through your Paddle receipt:</strong> Follow the customer support link included in the email receipt sent to you by Paddle when you purchased.
              </li>
              <li>
                <strong>Through our contact page:</strong> Visit our{" "}
                <Link href="/contact" className="text-brand-blue underline underline-offset-4">
                  contact page
                </Link>{" "}
                or email{" "}
                <a href="mailto:accounts@qasaskids.com" className="text-brand-blue underline underline-offset-4">
                  accounts@qasaskids.com
                </a>{" "}
                with the email address used at checkout and your Paddle transaction or order ID.
              </li>
            </ul>
            <p className="mt-3">
              Once issued, Paddle returns the payment to your original payment method, which typically appears on your bank statement within 5 to 10 working days. When a refund is completed, we will end access to the refunded book(s) on your parent account.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Monthly subscriptions</h2>
            <p className="mt-3">
              You can cancel a monthly subscription at any time from your account (Account &gt; Manage subscription).
            </p>
            <p className="mt-3">
              Cancelling stops future monthly charges immediately, and your access remains active until the end of your paid monthly billing period. If you cancel or request a refund within the first 14 days of starting your subscription, our 14-day full refund promise applies.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Defective service or technical issues</h2>
            <p className="mt-3">
              If you experience technical issues or if the service does not match its description, please contact us at accounts@qasaskids.com. Under UK consumer law, if digital content is faulty and cannot be repaired within a reasonable time, you are entitled to a repair, replacement, or refund.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">School and class licences</h2>
            <p className="mt-3">
              For schools and classes, please contact us at accounts@qasaskids.com.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Contact</h2>
            <p className="mt-3">
              If you have any questions about refunds or billing, email{" "}
              <a href="mailto:accounts@qasaskids.com" className="text-brand-blue underline underline-offset-4">
                accounts@qasaskids.com
              </a>{" "}
              or write to Senaptix Limited, 12 Corncastle Road, Luton, England, LU1 5HB.
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
