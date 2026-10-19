import Link from "next/link";
import BrandLockup from "@/components/BrandLockup";

export default function SiteFooter({
  maxWidth = "max-w-[1100px]",
  className = "",
  children,
}: {
  maxWidth?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <footer className={`mx-auto w-full ${maxWidth} px-6 py-12 sm:px-8 ${className}`}>
      <div className="border-ink/10 flex flex-col gap-5 border-t pt-8 sm:flex-row sm:items-start sm:justify-between text-[14px]">
        <BrandLockup size="footer" />
        <div className="sm:text-right">
          <div className="flex flex-wrap gap-x-3 gap-y-1 sm:justify-end text-[14px] leading-6 text-ink/65">
            <Link href="/" className="hover:text-ink underline-offset-4 hover:underline">
              Home
            </Link>
            <span className="text-ink/25" aria-hidden="true">·</span>
            <Link href="/about" className="hover:text-ink underline-offset-4 hover:underline">
              About
            </Link>
            <span className="text-ink/25" aria-hidden="true">·</span>
            <Link href="/terms" className="hover:text-ink underline-offset-4 hover:underline">
              Terms
            </Link>
            <span className="text-ink/25" aria-hidden="true">·</span>
            <Link href="/refunds" className="hover:text-ink underline-offset-4 hover:underline">
              Refunds
            </Link>
            <span className="text-ink/25" aria-hidden="true">·</span>
            <Link href="/privacy" className="hover:text-ink underline-offset-4 hover:underline">
              Privacy
            </Link>
            <span className="text-ink/25" aria-hidden="true">·</span>
            <Link href="/cookies" className="hover:text-ink underline-offset-4 hover:underline">
              Cookies
            </Link>
            <span className="text-ink/25" aria-hidden="true">·</span>
            <Link href="/children" className="hover:text-ink underline-offset-4 hover:underline">
              For children
            </Link>
            <span className="text-ink/25" aria-hidden="true">·</span>
            <Link href="/contact" className="hover:text-ink underline-offset-4 hover:underline">
              Contact
            </Link>
          </div>
          {children}
        </div>
      </div>
    </footer>
  );
}
