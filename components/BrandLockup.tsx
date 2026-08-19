import Image from "next/image";
import Link from "next/link";

type BrandLockupProps = {
  className?: string;
  priority?: boolean;
  size?: "compact" | "hero" | "footer";
};

const sizes = {
  compact: {
    image: "h-9 w-auto",
    name: "text-[16px]",
    slot: "44px",
  },
  hero: {
    image: "h-14 w-auto sm:h-16",
    name: "text-[22px] sm:text-[24px]",
    slot: "64px",
  },
  footer: {
    image: "h-11 w-auto",
    name: "text-[18px]",
    slot: "48px",
  },
} as const;

/** The shared Qasas Kids signature. The mark is decorative because the
 * visible name already supplies the link's accessible label. */
export default function BrandLockup({
  className = "",
  priority = false,
  size = "compact",
}: BrandLockupProps) {
  const variant = sizes[size];

  return (
    <Link
      href="/"
      aria-label="Qasas Kids — home"
      className={`brand-lockup inline-flex min-h-[48px] items-center gap-2.5 ${className}`}
    >
      <Image
        src="/brand/qasas-kids-mark.png"
        alt=""
        width={1312}
        height={1199}
        priority={priority}
        sizes={variant.slot}
        className={`brand-mark shrink-0 ${variant.image}`}
      />
      <span
        className={`text-night font-semibold tracking-[-0.025em] whitespace-nowrap ${variant.name}`}
      >
        Qasas <span className="text-brand-blue">Kids</span>
      </span>
    </Link>
  );
}
