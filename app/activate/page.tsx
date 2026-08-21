import Link from "next/link";
import type { Metadata } from "next";
import Eyebrow from "@/components/Eyebrow";
import HomeBar from "@/components/HomeBar";

export const metadata: Metadata = {
  title: "Activate your book",
  description:
    "Start access to the Qasas Kids companion and send your Amazon receipt for approval.",
};

const STEPS = [
  {
    n: 1,
    title: "Create the parent account",
    body: "Enter the Amazon order number on the signup form. Your 30-day provisional access starts immediately.",
  },
  {
    n: 2,
    title: "Email the Amazon receipt",
    body: "Forward the receipt or send a clear screenshot or PDF. Make sure the same order number is visible.",
  },
  {
    n: 3,
    title: "Asma matches one number",
    body: "She checks the receipt against the activation claim and changes its status to approved in Supabase.",
  },
  {
    n: 4,
    title: "Access extends to 12 months",
    body: "Approval extends the family’s companion access automatically. If the receipt is not approved, provisional access ends after 30 days.",
  },
];

export default function Activate() {
  return (
    <>
      <HomeBar bookSlug="ibrahim" />

      <main className="mx-auto w-full max-w-[720px] px-6 py-12 sm:px-8">
        <Eyebrow>Book activation</Eyebrow>

        <h1
          className="text-ink mt-4 font-semibold text-balance"
          style={{
            fontSize: "clamp(30px, 6vw, 44px)",
            lineHeight: 1.12,
            letterSpacing: "-0.015em",
          }}
        >
          Start reading now. Send the receipt next.
        </h1>

        <p
          className="text-ink/75 mt-5 max-w-[52ch]"
          style={{ fontSize: "clamp(16px, 2.5vw, 18px)", lineHeight: 1.65 }}
        >
          Your Amazon order number starts 30 days of companion access when you
          create the parent account. The receipt lets Asma approve the purchase
          and extend that access to a full 12 months.
        </p>

        <section className="border-brand-blue/25 bg-sand/30 mt-8 rounded-2xl border px-6 py-6">
          <h2 className="text-ink text-[18px] font-semibold">
            Send the receipt to
          </h2>
          <a
            href="mailto:receipts@qasaskids.com"
            className="text-brand-blue mt-2 inline-block text-[18px] font-medium underline decoration-brand-blue/30 underline-offset-4"
          >
            receipts@qasaskids.com
          </a>
          <p className="text-ink/70 mt-3 max-w-[52ch] text-[15px] leading-6">
            Forward Amazon&rsquo;s order email, or attach a clear screenshot or
            PDF. Keep the order number visible so it can be matched to the
            number entered at signup. Please do not include any child&rsquo;s
            details.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/account/sign-up"
              className="bg-brand-blue text-paper inline-flex min-h-[48px] items-center rounded-xl px-5 font-medium"
            >
              Create parent account
            </Link>
            <a
              href="mailto:receipts@qasaskids.com"
              className="border-ink/15 text-ink hover:border-ink/35 inline-flex min-h-[48px] items-center rounded-xl border px-5 font-medium transition-colors"
            >
              Email the receipt
            </a>
          </div>
        </section>

        <h2
          className="text-ink mt-12 font-semibold"
          style={{ fontSize: "clamp(20px, 3.5vw, 24px)", lineHeight: 1.3 }}
        >
          What happens after purchase
        </h2>

        <ol className="mt-6 space-y-5">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-4">
              <span
                className="bg-brand-blue/10 text-brand-blue flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-semibold"
                style={{ fontSize: "15px" }}
                aria-hidden="true"
              >
                {s.n}
              </span>
              <div>
                <p
                  className="text-ink font-medium"
                  style={{ fontSize: "17px", lineHeight: 1.4 }}
                >
                  {s.title}
                </p>
                <p
                  className="text-ink/70 mt-1 max-w-[48ch]"
                  style={{ fontSize: "15px", lineHeight: 1.6 }}
                >
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="border-ink/10 mt-12 border-t pt-8">
          <p
            className="text-ink/55"
            style={{ fontSize: "14px", lineHeight: 1.65 }}
          >
            Receipts can contain names, addresses and other purchases. They
            stay in the dedicated receipts inbox rather than the Qasas Kids
            database, and should be deleted once the activation has been
            approved or rejected.
          </p>
        </div>
      </main>
    </>
  );
}
