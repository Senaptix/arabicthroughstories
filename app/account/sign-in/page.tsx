import { redirect } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import AuthForm from "@/components/account/AuthForm";
import { getParentId } from "@/lib/account";

export const metadata = { title: "Parent sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; "check-email"?: string; error?: string }>;
}) {
  if (await getParentId()) redirect("/account");
  const query = await searchParams;
  return (
    <AccountShell
      eyebrow="Parent area"
      title="Welcome back"
      intro="Sign in as the parent. Children use a simple profile after you are signed in."
    >
      {query["check-email"] === "1" && (
        <p className="mb-5 rounded-xl bg-sage/15 px-4 py-3 text-[14px] leading-6">
          Check your inbox and confirm your email, then sign in here. If it
          does not arrive or has expired, use the{" "}
          <a href="/account/resend-confirmation" className="font-medium text-brand-blue underline">
            resend form
          </a>
          .
        </p>
      )}
      {query.error === "link" && (
        <p className="mb-5 rounded-xl bg-terracotta/10 px-4 py-3 text-[14px] leading-6">
          That link is invalid or has expired. Please try again.
        </p>
      )}
      <AuthForm mode="sign-in" next={query.next} />
    </AccountShell>
  );
}
