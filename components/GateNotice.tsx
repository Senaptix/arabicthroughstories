import Link from "next/link";
import { getMembershipState } from "@/lib/access";

/**
 * What a visitor without a current entitlement sees in place of gated content.
 *
 * ACCESS_MODEL.md is emphatic that a printed URL must never dead-end. So this
 * is not a 404 or redirect: the page resolves at its own address and explains
 * how to gain or restore access, while its Arabic, audio, vocabulary and
 * practice remain absent from the response.
 */
export default async function GateNotice({
  page,
  bookSlug,
}: {
  page: number;
  bookSlug: string;
}) {
  const membershipState = await getMembershipState();
  const hasLapsed = membershipState === "lapsed";
  // Someone already signed in does not need telling to create an account —
  // they need the box that takes an order number, which now exists.
  const signedIn = membershipState !== "signed-out";

  return (
    <section className="border-brand-blue/20 bg-sand/30 mb-10 rounded-2xl border px-6 py-7">
      <h2
        className="text-ink font-semibold"
        style={{ fontSize: "clamp(19px, 3vw, 22px)", lineHeight: 1.3 }}
      >
        {hasLapsed
          ? "Your companion access has ended."
          : `Page ${page} is part of the full companion.`}
      </h2>

      <p
        className="text-ink/75 mt-3 max-w-[52ch]"
        style={{ fontSize: "16px", lineHeight: 1.65 }}
      >
        {hasLapsed
          ? <>Your companion access has expired. If your Amazon receipt has not been approved yet, send it using the activation-page instructions. If it was already approved, email <a href="mailto:accounts@qasaskids.com" className="text-brand-blue underline-offset-4 hover:underline">accounts@qasaskids.com</a> so we can check the account.</>
          : signedIn
            ? "The audio, the vowelled Arabic and the practice for this page come with the book. Add your Amazon order number or activation code to your account and access starts immediately."
            : "The audio, the vowelled Arabic and the practice for this page come with the book. Enter the Amazon order number when you create the parent account and access starts immediately."}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={signedIn ? "/account#add-a-book" : "/activate"}
          className="bg-brand-blue text-paper inline-flex min-h-[48px] items-center rounded-xl px-5 font-medium"
          style={{ fontSize: "16px" }}
        >
          {hasLapsed
            ? "Restore your access"
            : signedIn
              ? "Add your book"
              : "Activate your book"}
        </Link>
        <Link
          href={`/books/${bookSlug}`}
          className="border-ink/15 text-ink hover:border-ink/35 inline-flex min-h-[48px] items-center rounded-xl border px-5 font-medium transition-colors"
          style={{ fontSize: "16px" }}
        >
          Read the free preview
        </Link>
      </div>
    </section>
  );
}
