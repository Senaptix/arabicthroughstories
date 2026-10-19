import Link from "next/link";
import { redirect } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import AuthForm from "@/components/account/AuthForm";
import { getParentId } from "@/lib/account";

export const metadata = { title: "Create a parent account" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await getParentId()) redirect("/account");
  const query = await searchParams;
  return (
    <AccountShell
      eyebrow="Parent account"
      title="Save their reading journey"
      intro="Create your parent account. Already own the paperback? Add your Amazon order number or QK code to unlock the book."
    >
      <AuthForm mode="sign-up" next={query.next} />
      <div className="mt-6 space-y-2 border-t border-ink/10 pt-4 text-[13px] leading-5 text-ink/65">
        <p>
          By creating an account you agree to the{" "}
          <Link href="/terms" className="text-brand-blue underline underline-offset-4">
            Terms
          </Link>{" "}
          and have read the{" "}
          <Link href="/privacy" className="text-brand-blue underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
        <p>Accounts are for adults. Children use profiles inside a parent account.</p>
      </div>
    </AccountShell>
  );
}
