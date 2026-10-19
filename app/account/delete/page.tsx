import Link from "next/link";
import { redirect } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import DeleteAccountForm from "@/components/account/DeleteAccountForm";
import { getParentId } from "@/lib/account";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Delete account" };

export default async function DeleteAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmed?: string }>;
}) {
  const query = await searchParams;

  if (query.confirmed === "1") {
    return (
      <AccountShell
        eyebrow="Account deleted"
        title="Your account has been deleted"
        intro="All your personal information, child profiles, and reading progress have been permanently erased."
      >
        <div className="space-y-6">
          <p className="text-[15px] leading-7 text-ink/75">
            You have been signed out. Any active monthly subscription has been cancelled, and purchase records have been anonymised for tax records as required by law.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex min-h-[48px] items-center rounded-xl bg-brand-blue px-6 font-medium text-paper hover:bg-brand-blue/90"
            >
              Return to home
            </Link>
          </div>
        </div>
      </AccountShell>
    );
  }

  const parentId = await getParentId();
  if (!parentId) {
    redirect("/account/sign-in?next=/account/delete");
  }

  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("paddle_subscriptions")
    .select("subscription_id")
    .eq("parent_id", parentId)
    .limit(1);

  const hasSubscription = Boolean(sub && sub.length > 0);

  return (
    <AccountShell
      eyebrow="Parent area"
      title="Delete your account"
      intro="Permanently remove your account, child profiles, and reading records."
    >
      <DeleteAccountForm hasSubscription={hasSubscription} />
    </AccountShell>
  );
}
