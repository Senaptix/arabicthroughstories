"use client";

import { useActionState } from "react";
import {
  approveActivation,
  rejectActivation,
  type ReviewState,
} from "@/app/admin/activation-codes/actions";
import type { CatalogueEntry } from "@/lib/catalogue";

/**
 * One row of Asma's queue, with the approve control on it.
 *
 * Approving used to mean opening the Supabase table editor and changing a
 * status cell by hand. The books are checkboxes rather than a single choice
 * because one Amazon order regularly contains both titles, and the receipt in
 * front of her is what says which.
 *
 * Pre-ticked from what the parent claimed at signup, so the common case is one
 * click. She can override it — the receipt wins over the claim.
 */
export default function ActivationReview({
  activationId,
  email,
  orderNumber,
  claimedBooks,
  daysLeft,
  catalogue,
}: {
  activationId: string;
  email: string;
  orderNumber: string;
  claimedBooks: string[];
  daysLeft: number | null;
  catalogue: readonly CatalogueEntry[];
}) {
  const [approveState, approve, approving] = useActionState<
    ReviewState,
    FormData
  >(approveActivation, {});
  const [rejectState, reject, rejecting] = useActionState<
    ReviewState,
    FormData
  >(rejectActivation, {});

  const state = approveState.message ? approveState : rejectState;
  const busy = approving || rejecting;

  // Under a week means this parent is about to lose access while still waiting
  // on us, which is the worst version of this queue going unread.
  const pressing = daysLeft !== null && daysLeft <= 7;

  if (state.ok) {
    return (
      <li className="px-5 py-4">
        <p className="text-ink/70 text-[15px]">
          <span className="font-medium">{email}</span> — {state.message}
        </p>
      </li>
    );
  }

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="text-ink truncate text-[15px] font-medium">{email}</p>
          <p className="text-ink/60 mt-0.5 font-mono text-[14px]">
            {orderNumber}
          </p>
        </div>
        <p
          className={`text-[14px] ${pressing ? "text-brand-blue font-medium" : "text-ink/50"}`}
        >
          {daysLeft === null
            ? "no access recorded"
            : daysLeft === 0
              ? "access ends today"
              : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} of access left`}
        </p>
      </div>

      <form action={approve} className="mt-3">
        <input type="hidden" name="activation_id" value={activationId} />

        <fieldset className="border-0 p-0">
          <legend className="text-ink/60 text-[13px]">
            Books on this receipt
          </legend>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
            {catalogue.map((book) => (
              <label
                key={book.slug}
                className="text-ink/80 flex min-h-[32px] items-center gap-2 text-[15px]"
              >
                <input
                  type="checkbox"
                  name="book"
                  value={book.slug}
                  defaultChecked={claimedBooks.includes(book.slug)}
                  className="h-4 w-4"
                />
                {book.title}
                {!book.published && (
                  <span className="text-ink/45 text-[13px]">(not yet live)</span>
                )}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={busy}
            className="bg-brand-blue text-paper inline-flex min-h-[40px] items-center rounded-lg px-4 text-[15px] font-medium disabled:opacity-60"
          >
            {approving ? "Approving…" : "Approve for 12 months"}
          </button>
          <button
            type="submit"
            formAction={reject}
            disabled={busy}
            className="border-ink/20 text-ink/70 hover:border-ink/40 inline-flex min-h-[40px] items-center rounded-lg border px-4 text-[15px] disabled:opacity-60"
          >
            {rejecting ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </form>

      {state.message && (
        <p className="text-brand-blue mt-2 text-[14px]" role="status">
          {state.message}
        </p>
      )}
    </li>
  );
}
