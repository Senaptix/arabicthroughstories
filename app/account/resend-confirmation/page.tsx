import AccountShell from "@/components/account/AccountShell";
import AuthForm from "@/components/account/AuthForm";

export const metadata = { title: "Resend confirmation email" };

export default function ResendConfirmationPage() {
  return (
    <AccountShell
      eyebrow="Parent account"
      title="Send a fresh confirmation"
      intro="Enter the parent email address. If it is awaiting confirmation, we’ll send a new link."
    >
      <AuthForm mode="resend" />
    </AccountShell>
  );
}
