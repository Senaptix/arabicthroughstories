import { notFound, redirect } from "next/navigation";
import BrandLockup from "@/components/BrandLockup";
import ActivationCodeIssuer from "@/components/admin/ActivationCodeIssuer";
import { getAdminAccess } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Issue activation codes",
  robots: { index: false, follow: false },
};

export default async function ActivationCodesAdminPage() {
  const access = await getAdminAccess();
  if (!access.signedIn) redirect("/account/sign-in?next=/admin/activation-codes");
  if (!access.allowed) notFound();

  return (
    <main className="mx-auto min-h-screen w-full max-w-[680px] px-6 py-8 sm:py-12">
      <BrandLockup size="compact" />
      <header className="mt-12 max-w-[58ch] border-l-2 border-brand-blue pl-5">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-blue">Event sales</p>
        <h1 className="mt-2 text-[clamp(30px,7vw,46px)] font-semibold leading-tight">Issue an activation code</h1>
        <p className="mt-3 text-[16px] leading-7 text-ink/65">
          Enter the buyer’s address, show them the code on this screen, and ask them to use it in the order-number box when creating their parent account.
        </p>
      </header>
      <div className="mt-10">
        <ActivationCodeIssuer />
      </div>
    </main>
  );
}
