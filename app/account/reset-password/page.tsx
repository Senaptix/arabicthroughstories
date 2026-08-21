import { redirect } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import AuthForm from "@/components/account/AuthForm";
import { getParentId } from "@/lib/account";

export const metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  if (!(await getParentId())) redirect("/account/sign-in?error=link");
  return (
    <AccountShell
      eyebrow="Parent account"
      title="Choose a new password"
      intro="Make it long and unique. Saving it will return you to the parent area."
    >
      <AuthForm mode="reset" />
    </AccountShell>
  );
}
