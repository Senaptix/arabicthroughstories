import { getEntitlement, hasPendingActivation } from "@/lib/access";

/**
 * Tells a parent on provisional access that a receipt is still needed.
 *
 * Without this, nothing did. The requirement was stated once on the signup
 * form and once on /activate — a page nobody has to visit — so a buyer
 * confirmed their email, found everything working, and had no reason to think
 * anything was outstanding. On day 31 it would simply stop, with no
 * explanation they could connect to a cause.
 *
 * It lives on the account page because that is where every parent lands after
 * confirming, it needs no SMTP, and it cannot be filtered to spam.
 *
 * Shows ONLY while the entitlement is provisional. Once Asma approves, the
 * source becomes book_activation and this disappears — nobody is nagged for
 * something they have already done.
 */

export default async function ReceiptNotice() {
  // Keyed on a PENDING CLAIM, not the entitlement source. The provisional
  // trigger leaves `source` alone when a row already exists, so an existing
  // member who claims another book stays `book_activation` while still owing
  // a receipt — and would never have been told.
  const [entitlement, pending] = await Promise.all([
    getEntitlement(),
    hasPendingActivation(),
  ]);
  if (!pending || !entitlement) return null;

  // Both derived in getEntitlement(), which reads the clock once per request.
  const { expired, daysLeft: days } = entitlement;
  // Under a week is the point at which the wording should stop being calm.
  const urgent = expired || days <= 7;

  // "Ends today" would be wrong for someone it has already ended for — they
  // can still reach this page signed in, they just cannot read past page 10.
  const heading = expired
    ? "Your access has ended"
    : days === 0
      ? "Your access ends today"
      : `Send your receipt — ${days} ${days === 1 ? "day" : "days"} left`;

  return (
    <section
      className={`mt-8 rounded-2xl border px-6 py-5 ${
        urgent
          ? "border-brand-blue/40 bg-brand-blue/5"
          : "border-ink/15 bg-sand/30"
      }`}
      aria-labelledby="receipt-notice-heading"
    >
      <h2
        id="receipt-notice-heading"
        className="text-ink text-[17px] font-semibold"
      >
        {heading}
      </h2>

      <p className="text-ink/75 mt-2 max-w-[54ch] text-[15px] leading-6">
        {expired
          ? "Your 30-day starting access has run out. Email your Amazon receipt and we will restore it for a full 12 months — your children's progress is safe in the meantime."
          : "Your access started as soon as you signed up, and runs for 30 days while we check your purchase. Email your Amazon receipt and we will extend it to a full 12 months."}
      </p>

      <p className="mt-3 text-[15px]">
        <a
          href="mailto:receipts@qasaskids.com?subject=Qasas%20Kids%20activation"
          className="text-brand-blue font-medium underline underline-offset-4"
        >
          receipts@qasaskids.com
        </a>
      </p>

      <p className="text-ink/55 mt-3 max-w-[54ch] text-[14px] leading-6">
        Forward the order email from Amazon, or attach a screenshot showing the
        order number. Nothing changes for your children while we check it.
      </p>
    </section>
  );
}
