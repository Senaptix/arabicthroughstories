import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import Eyebrow from "@/components/Eyebrow";
import HomeBar from "@/components/HomeBar";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact information for Qasas Kids support, billing, and postal enquiries.",
};

export default function ContactPage() {
  return (
    <>
      <HomeBar />

      <main className="mx-auto w-full max-w-[720px] px-6 py-12 sm:px-8 lg:py-16">
        <header>
          <Eyebrow>Contact</Eyebrow>
          <h1
            className="text-ink mt-4 font-semibold text-balance"
            style={{
              fontSize: "clamp(30px, 5.5vw, 44px)",
              lineHeight: 1.15,
              letterSpacing: "-0.015em",
            }}
          >
            Contact Us
          </h1>
          <p className="text-ink/50 mt-3 text-[14px]">Last updated 19 October 2026</p>
        </header>

        <div className="text-ink/80 mt-10 space-y-8 text-[16px] leading-7">
          <section>
            <h2 className="text-ink text-[20px] font-semibold">Email support</h2>
            <p className="mt-3">
              For help with your account, digital access, or general questions, please email us directly at:
            </p>
            <p className="mt-2">
              <a href="mailto:accounts@qasaskids.com" className="text-brand-blue font-medium underline underline-offset-4">
                accounts@qasaskids.com
              </a>
            </p>
            <p className="mt-3">
              We aim to reply within 2 working days.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Payment and refund questions</h2>
            <p className="mt-3">
              Paddle.com is our merchant of record for online purchases.
            </p>
            <p className="mt-3">
              For payment or refund questions, you can use the support link on your Paddle receipt. You can also reach out to us at accounts@qasaskids.com with your Paddle transaction ID, and we will be happy to assist you.
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Registered company details and postal address</h2>
            <p className="mt-3">
              Qasas Kids is operated by Senaptix Limited, a company registered in England and Wales under company number 16687527.
            </p>
            <p className="mt-3">
              <strong>Postal address:</strong>
              <br />
              Senaptix Limited
              <br />
              12 Corncastle Road
              <br />
              Luton, England
              <br />
              LU1 5HB
            </p>
            <p className="mt-3">
              We are not registered for VAT. Senaptix Limited is registered with the Information Commissioner&rsquo;s Office (ICO reference ZC119614).
            </p>
          </section>

          <section>
            <h2 className="text-ink text-[20px] font-semibold">Feedback and corrections</h2>
            <p className="mt-3">
              If you spot a typo in the Arabic text, an issue with vocalisation, or an error in our vocabulary glosses or exercises, please let us know at accounts@qasaskids.com. We review every note carefully.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter maxWidth="max-w-[720px]" />
    </>
  );
}
