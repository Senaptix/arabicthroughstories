import { redirect } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import AuthForm from "@/components/account/AuthForm";
import { getParentId } from "@/lib/account";

export const metadata = { title: "Create a parent account" };

export default async function SignUpPage() {
  if (await getParentId()) redirect("/account");
  return (
    <AccountShell
      eyebrow="Parent account"
      title="Save their reading journey"
      intro="One adult account can hold up to five child profiles. Have your Amazon order number ready; we never ask for a child’s personal details."
    >
      <AuthForm mode="sign-up" />
    </AccountShell>
  );
}
