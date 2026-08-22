"use client";

import { useActionState } from "react";
import { claimBook, type ActionState } from "@/app/account/actions";

const initialState: ActionState = {};

/**
 * Add a book to an existing account.
 *
 * The same single field as signup, for the same reason: a buyer should not
 * have to work out which kind of thing they are holding. A QK- code redeems
 * on the spot; anything else goes to the review queue.
 *
 * This is also how the series continues. Membership is account-wide, so a
 * family who buys Book 2 does not need a new account — they need this box.
 */
export default function BookClaimer({ heading }: { heading: string }) {
  const [state, action, pending] = useActionState(claimBook, initialState);

  return (
    <form action={action}>
      <h2 className="text-[20px] font-medium">{heading}</h2>
      <p className="text-ink/60 mt-1 max-w-[54ch] text-[15px] leading-6">
        Enter the Amazon order number for the new book, or an activation code
        if you bought it from us in person.
      </p>

      <label className="mt-4 block">
        <span className="text-ink/70 mb-1 block text-[14px] font-medium">
          Order number or activation code
        </span>
        <input
          name="orderNumber"
          required
          maxLength={100}
          autoComplete="off"
          spellCheck={false}
          placeholder="123-1234567-1234567"
          className="border-ink/20 bg-surface min-h-[48px] w-full max-w-[340px] rounded-xl border px-4 text-[16px]"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="bg-brand-blue text-paper mt-4 inline-flex min-h-[48px] items-center rounded-xl px-5 text-[15px] font-medium disabled:opacity-60"
      >
        {pending ? "Checking…" : "Add this book"}
      </button>

      {state.success && (
        <p
          className="border-brand-blue/25 bg-sand/40 text-ink/80 mt-4 max-w-[54ch] rounded-xl border px-4 py-3 text-[15px] leading-6"
          role="status"
        >
          {state.success}
        </p>
      )}
      {state.message && (
        <p
          className="text-ink/75 mt-4 max-w-[54ch] text-[15px] leading-6"
          role="alert"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
