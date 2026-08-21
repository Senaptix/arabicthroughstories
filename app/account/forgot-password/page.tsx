import AccountShell from "@/components/account/AccountShell";
import AuthForm from "@/components/account/AuthForm";

export const metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <AccountShell
      eyebrow="Parent account"
      title="Reset your password"
      intro="Enter the parent email address. If it has an account, we’ll send a secure reset link."
    >
      <AuthForm mode="forgot" />
    </AccountShell>
  );
}
