import BrandLockup from "@/components/BrandLockup";
import SiteFooter from "@/components/SiteFooter";

export default function AccountShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col justify-between">
      <main className="mx-auto w-full max-w-[520px] px-6 py-8 sm:py-12">
        <BrandLockup size="compact" />
        <div className="mt-12 border-l-2 border-brand-blue pl-5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-blue">{eyebrow}</p>
          <h1 className="mt-2 text-[clamp(30px,7vw,44px)] font-semibold leading-tight">{title}</h1>
          <p className="mt-3 text-[16px] leading-7 text-ink/65">{intro}</p>
        </div>
        <div className="mt-10">{children}</div>
      </main>
      <SiteFooter maxWidth="max-w-[520px]" />
    </div>
  );
}
