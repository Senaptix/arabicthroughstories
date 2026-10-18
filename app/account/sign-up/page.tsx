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
    </AccountShell>
  );
}
