import Link from "next/link";
import type { Metadata } from "next";
import Eyebrow from "@/components/Eyebrow";
import HomeBar from "@/components/HomeBar";

/**
 * qasaskids.com/activate — where a book owner turns their copy into access.
 *
 * SCAFFOLD. This route exists so the URL is real, printable and linkable
 * before the login is built; it currently EXPLAINS the flow rather than
 * running it. There is deliberately no form here yet: a form that accepts an
 * order number and does nothing with it is worse than no form, because the
 * parent believes they have activated and finds out otherwise later.
 *
 * The flow it will run (ACCOUNTS_PLAN.md, and the owner's entitlement plan):
 *
 *   create parent account
 *     -> enter Amazon order number + upload receipt
 *     -> automated checks, manual review when uncertain
 *     -> 12-month entitlement on the ACCOUNT (not the device, not the child)
 *     -> web + Android + iOS all read that one entitlement
 *
 * Two things to carry into the build:
 *   - The order number is the anti-reuse key. Once redeemed it cannot be
 *     redeemed again; that is what stops one receipt unlocking fifty accounts.
 *   - Delete the receipt image once verified. Keep only the hashed order
 *     reference, the dates and the status. Holding parents' Amazon receipts
 *     is a liability with no ongoing purpose.
 */

export const metadata: Metadata = {
  title: "Activate your book",
  description:
    "Turn your copy of the book into access to the full Qasas Kids companion.",
};

const STEPS = [
  {
    n: 1,
    title: "Create a parent account",
    body: "One account for the family. Children get profiles under it — no child ever needs an email address of their own.",
  },
  {
    n: 2,
    title: "Enter your order number",
    body: "From your Amazon order confirmation, along with a screenshot or PDF of the order.",
  },
  {
    n: 3,
    title: "We check it",
    body: "Usually straight away. If anything is unclear a person looks at it, and you hear back by email.",
  },
  {
    n: 4,
    title: "Everything opens",
    body: "Twelve months of the full companion — every page's audio, vocabulary, word families and practice, on any device you sign in from.",
  },
];

export default function Activate() {
  return (
    <>
      <HomeBar bookSlug="ibrahim" />

      <main className="mx-auto w-full max-w-[720px] px-6 py-12 sm:px-8">
        <Eyebrow>Activate</Eyebrow>

        <h1
          className="text-ink mt-4 font-semibold text-balance"
          style={{
            fontSize: "clamp(30px, 6vw, 44px)",
            lineHeight: 1.12,
            letterSpacing: "-0.015em",
          }}
        >
          Turn your book into a year of Qasas&nbsp;Kids.
        </h1>

        <p
          className="text-ink/75 mt-5 max-w-[52ch]"
          style={{ fontSize: "clamp(16px, 2.5vw, 18px)", lineHeight: 1.65 }}
        >
          Every copy of the book includes twelve months of the full companion.
          You activate once, and it works everywhere you sign in.
        </p>

        <div className="border-brand-blue/25 bg-sand/30 mt-8 rounded-2xl border px-6 py-6">
          <p
            className="text-ink font-semibold"
            style={{ fontSize: "17px", lineHeight: 1.4 }}
          >
            Activation opens with the book
          </p>
          <p
            className="text-ink/70 mt-2 max-w-[52ch]"
            style={{ fontSize: "16px", lineHeight: 1.6 }}
          >
            The book is not on sale quite yet. Until it is, the whole companion
            is open — you can read, listen and practise right now without an
            account.
          </p>
          <Link
            href="/books/ibrahim"
            className="bg-brand-blue text-paper mt-5 inline-flex min-h-[48px] items-center rounded-xl px-5 font-medium"
            style={{ fontSize: "16px" }}
          >
            Open the book
          </Link>
        </div>

        <h2
          className="text-ink mt-12 font-semibold"
          style={{ fontSize: "clamp(20px, 3.5vw, 24px)", lineHeight: 1.3 }}
        >
          How it will work
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
            We keep as little as possible. Once your order is verified the
            receipt image is deleted — we hold only that it was checked, and
            when. Children&rsquo;s profiles store a name and reading progress,
            nothing more.
          </p>
        </div>
      </main>
    </>
  );
}
