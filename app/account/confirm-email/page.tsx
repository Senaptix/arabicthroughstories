import { redirect } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import { confirmEmailToken } from "@/app/account/actions";

export const metadata = {
  title: "Confirm your email",
  referrer: "no-referrer",
};

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const query = await searchParams;
  if (!query.token_hash || !["email", "recovery"].includes(query.type ?? "")) {
    redirect("/account/sign-in?error=link");
  }

  const recovery = query.type === "recovery";
  return (
    <AccountShell
      eyebrow="Parent account"
      title={recovery ? "Continue your password reset" : "Confirm your email"}
      intro={
        recovery
          ? "Press the button below to verify this request and choose a new password."
          : "Press the button below to finish creating your Qasas Kids parent account."
      }
    >
      <form action={confirmEmailToken}>
        <input type="hidden" name="tokenHash" value={query.token_hash} />
        <input type="hidden" name="type" value={query.type} />
        <input
          type="hidden"
          name="next"
          value={recovery ? "/account/reset-password" : query.next ?? "/account"}
        />
        <button className="min-h-[50px] w-full rounded-xl bg-brand-blue px-5 font-medium text-paper">
          {recovery ? "Verify and continue" : "Confirm email"}
        </button>
      </form>
      <p className="mt-5 text-[13px] leading-5 text-ink/50">
        This extra press protects the link from automated email scanners that
        sometimes open one-time links before you do.
      </p>
    </AccountShell>
  );
}
