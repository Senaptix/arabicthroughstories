"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { PASSWORD_RULES } from "@/lib/password-rules";
import {
  sendPasswordReset,
  resendConfirmation,
  signIn,
  signUp,
  updatePassword,
  type ActionState,
} from "@/app/account/actions";

const initialState: ActionState = {};

export default function AuthForm({
  mode,
  next,
}: {
  mode: "sign-in" | "sign-up" | "forgot" | "reset" | "resend";
  next?: string;
}) {
  const [password, setPassword] = useState("");
  const action = mode === "sign-in"
    ? signIn
    : mode === "sign-up"
      ? signUp
      : mode === "forgot"
        ? sendPasswordReset
        : mode === "resend"
          ? resendConfirmation
          : updatePassword;
  const [state, formAction, pending] = useActionState(action, initialState);
  const needsEmail = mode !== "reset";
  const needsPassword = mode === "sign-in" || mode === "sign-up" || mode === "reset";

  return (
    <form action={formAction} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      {needsEmail && (
        <label className="block">
          <span className="mb-2 block text-[14px] font-medium">Parent email</span>
          <input name="email" type="email" autoComplete="email" required className="min-h-[50px] w-full rounded-xl border border-ink/20 bg-surface px-4 text-[16px]" />
        </label>
      )}
      {mode === "sign-up" && (
        <label className="block">
          <span className="mb-2 block text-[14px] font-medium">Amazon order number or QK code (optional)</span>
          <input
            name="orderNumber"
            type="text"
            autoComplete="off"
            maxLength={100}
            placeholder="123-1234567-1234567 or QK-7X9K-4PL2"
            className="min-h-[50px] w-full rounded-xl border border-ink/20 bg-surface px-4 text-[16px]"
          />
          <span className="mt-2 block text-[13px] leading-5 text-ink/55">
            Amazon orders start 30 days of access immediately; follow the receipt step
            on the <Link href="/activate" className="text-brand-blue underline-offset-4 hover:underline">activation page</Link> to extend it. A QK event code gives 12 months immediately and needs no receipt.
          </span>
        </label>
      )}
      {needsPassword && (
        <label className="block">
          <span className="mb-2 block text-[14px] font-medium">{mode === "reset" ? "New password" : "Password"}</span>
          <input name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={mode === "sign-in" ? undefined : 10} onChange={(e) => setPassword(e.target.value)} required className="min-h-[50px] w-full rounded-xl border border-ink/20 bg-surface px-4 text-[16px]" />
        </label>
      )}
      {mode === "reset" && (
        <label className="block">
          <span className="mb-2 block text-[14px] font-medium">Confirm new password</span>
          <input name="confirm" type="password" autoComplete="new-password" minLength={10} required className="min-h-[50px] w-full rounded-xl border border-ink/20 bg-surface px-4 text-[16px]" />
        </label>
      )}
      {(mode === "sign-up" || mode === "reset") && (
        <div className="text-[13px] leading-5 text-ink/70">
          <p className="mb-1 font-medium">Your password needs:</p>
          <ul className="space-y-0.5">
            {PASSWORD_RULES.map((rule) => {
              const ok = rule.test(password);
              return (
                <li key={rule.label} className={ok ? "font-medium text-ink" : undefined}>
                  <span aria-hidden="true">{ok ? "✓" : "○"}</span> {rule.label}
                  <span className="sr-only">{ok ? " (done)" : " (still needed)"}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-1 text-ink/55">Avoid common passwords or ones used on other sites.</p>
        </div>
      )}
      {state.message && <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-[14px] leading-6">{state.message}</p>}
      {state.success && <p role="status" className="rounded-xl bg-sage/15 px-4 py-3 text-[14px] leading-6">{state.success}</p>}
      <button type="submit" disabled={pending} className="min-h-[50px] w-full rounded-xl bg-brand-blue px-5 font-medium text-paper disabled:opacity-60">
        {pending ? "Please wait…" : mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create parent account" : mode === "forgot" ? "Send reset link" : mode === "resend" ? "Resend confirmation" : "Save new password"}
      </button>
      <div className="flex flex-wrap justify-between gap-3 text-[14px] text-brand-blue">
        {mode === "sign-in" && <><Link href="/account/forgot-password">Forgot password?</Link><Link href={next ? `/account/sign-up?next=${encodeURIComponent(next)}` : "/account/sign-up"}>Create an account</Link></>}
        {mode === "sign-up" && <Link href={next ? `/account/sign-in?next=${encodeURIComponent(next)}` : "/account/sign-in"}>Already have an account?</Link>}
        {(mode === "forgot" || mode === "reset" || mode === "resend") && <Link href="/account/sign-in">Back to sign in</Link>}
      </div>
    </form>
  );
}
