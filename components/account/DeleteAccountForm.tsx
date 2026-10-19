"use client";

import { useActionState } from "react";
import Link from "next/link";
import { deleteAccount, type ActionState } from "@/app/account/actions";

const initialState: ActionState = {};

export default function DeleteAccountForm({
  hasSubscription,
}: {
  hasSubscription: boolean;
}) {
  const [state, action, pending] = useActionState(deleteAccount, initialState);

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-3 rounded-2xl border border-crimson/25 bg-crimson/5 p-5 text-[14px] leading-6 text-ink/80">
        <p className="font-semibold text-crimson">
          Warning: Account deletion is permanent and cannot be undone.
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-ink/75">
          <li>All child profiles, reading history, and saved words will be deleted immediately.</li>
          <li>Digital Edition access to all books will end immediately.</li>
          {hasSubscription && (
            <li>Your active monthly subscription will be cancelled with Paddle.</li>
          )}
          <li>
            Past purchase transaction records (transaction ID, book, and date) will be kept for 6 years as required for tax compliance, but completely anonymised with your email and identity erased.
          </li>
        </ul>
      </div>

      <div className="space-y-2">
        <label htmlFor="confirm-delete" className="block text-[14px] font-medium text-ink">
          To confirm, type <strong className="font-semibold text-crimson">DELETE</strong> in the box below:
        </label>
        <input
          id="confirm-delete"
          name="confirm"
          type="text"
          required
          autoComplete="off"
          placeholder="DELETE"
          className="min-h-[50px] w-full rounded-xl border border-ink/20 bg-surface px-4 text-[16px] outline-none focus:border-crimson focus:ring-1 focus:ring-crimson"
        />
      </div>

      {state.message && (
        <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-[14px] text-terracotta">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-crimson px-6 text-[15px] font-medium text-paper hover:bg-crimson/90 disabled:opacity-60"
        >
          {pending ? "Deleting account…" : "Permanently delete my account"}
        </button>
        <Link
          href="/account"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-ink/15 px-5 text-[14px] font-medium text-ink/70 hover:bg-surface"
        >
          Cancel and return to Parent area
        </Link>
      </div>
    </form>
  );
}
