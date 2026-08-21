"use client";

import Link from "next/link";
import { useActionState } from "react";
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
          <span className="mb-2 block text-[14px] font-medium">Amazon order number</span>
          <input
            name="orderNumber"
            type="text"
            autoComplete="off"
            maxLength={100}
            required
            placeholder="123-1234567-1234567"
            className="min-h-[50px] w-full rounded-xl border border-ink/20 bg-surface px-4 text-[16px]"
          />
          <span className="mt-2 block text-[13px] leading-5 text-ink/55">
            This starts 30 days of access immediately. Follow the receipt step
            on the <Link href="/activate" className="text-brand-blue underline-offset-4 hover:underline">activation page</Link> to extend it to 12 months.
          </span>
        </label>
      )}
      {needsPassword && (
        <label className="block">
          <span className="mb-2 block text-[14px] font-medium">{mode === "reset" ? "New password" : "Password"}</span>
          <input name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={mode === "sign-in" ? undefined : 10} required className="min-h-[50px] w-full rounded-xl border border-ink/20 bg-surface px-4 text-[16px]" />
        </label>
      )}
      {mode === "reset" && (
        <label className="block">
          <span className="mb-2 block text-[14px] font-medium">Confirm new password</span>
          <input name="confirm" type="password" autoComplete="new-password" minLength={10} required className="min-h-[50px] w-full rounded-xl border border-ink/20 bg-surface px-4 text-[16px]" />
        </label>
      )}
      {(mode === "sign-up" || mode === "reset") && (
        <p className="text-[13px] leading-5 text-ink/55">Use at least 10 characters. Supabase will also apply the security rules configured for this project.</p>
      )}
      {state.message && <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-[14px] leading-6">{state.message}</p>}
      {state.success && <p role="status" className="rounded-xl bg-sage/15 px-4 py-3 text-[14px] leading-6">{state.success}</p>}
      <button type="submit" disabled={pending} className="min-h-[50px] w-full rounded-xl bg-brand-blue px-5 font-medium text-paper disabled:opacity-60">
        {pending ? "Please wait…" : mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create parent account" : mode === "forgot" ? "Send reset link" : mode === "resend" ? "Resend confirmation" : "Save new password"}
      </button>
      <div className="flex flex-wrap justify-between gap-3 text-[14px] text-brand-blue">
        {mode === "sign-in" && <><Link href="/account/forgot-password">Forgot password?</Link><Link href="/account/sign-up">Create an account</Link></>}
        {mode === "sign-up" && <Link href="/account/sign-in">Already have an account?</Link>}
        {(mode === "forgot" || mode === "reset" || mode === "resend") && <Link href="/account/sign-in">Back to sign in</Link>}
      </div>
    </form>
  );
}
