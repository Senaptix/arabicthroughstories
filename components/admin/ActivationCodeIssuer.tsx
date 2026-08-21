"use client";

import { useActionState, useState } from "react";
import {
  issueActivationCode,
  type IssueCodeState,
} from "@/app/admin/activation-codes/actions";

const initialState: IssueCodeState = {};

export default function ActivationCodeIssuer() {
  const [state, action, pending] = useActionState(issueActivationCode, initialState);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function copyCode() {
    if (!state.code) return;
    await navigator.clipboard.writeText(state.code);
    setCopiedCode(state.code);
  }

  return (
    <div className="space-y-10">
      <form action={action} className="space-y-5 border-t border-ink/15 pt-7">
        <label className="block">
          <span className="mb-2 block text-[14px] font-medium">Buyer email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="min-h-[50px] w-full rounded-xl border border-ink/20 bg-surface px-4 text-[16px]"
          />
          <span className="mt-2 block text-[13px] leading-5 text-ink/55">
            Read the address back before issuing. The code will still appear here if delivery fails.
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-[14px] font-medium">Event note <span className="font-normal text-ink/50">(optional)</span></span>
          <input
            name="note"
            type="text"
            autoComplete="off"
            maxLength={160}
            placeholder="Birmingham, 6 Sep"
            className="min-h-[50px] w-full rounded-xl border border-ink/20 bg-surface px-4 text-[16px]"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="min-h-[50px] rounded-xl bg-brand-blue px-6 font-medium text-paper disabled:opacity-60"
        >
          {pending ? "Creating code…" : "Create and email code"}
        </button>
      </form>

      {state.message && (
        <section
          aria-live="polite"
          className={`rounded-2xl border px-6 py-6 ${state.code ? "border-brand-blue/25 bg-sand/30" : "border-terracotta/25 bg-terracotta/10"}`}
        >
          <p className="text-[14px] leading-6">{state.message}</p>
          {state.code && (
            <div className="mt-6 border-t border-ink/10 pt-6">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-blue">
                {state.emailed ? "Email sent" : "Give this code to the buyer"}
              </p>
              <p className="mt-3 break-words text-[clamp(30px,10vw,52px)] font-semibold leading-none tracking-[0.08em] text-night">
                {state.code}
              </p>
              <p className="mt-4 text-[14px] text-ink/60">Issued to {state.issuedTo}</p>
              <button
                type="button"
                onClick={copyCode}
                className="mt-6 min-h-[46px] rounded-xl border border-brand-blue px-5 text-[14px] font-medium text-brand-blue"
              >
                {copiedCode === state.code ? "Copied" : "Copy code"}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
