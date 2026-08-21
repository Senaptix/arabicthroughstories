import type { AvatarKey } from "@/lib/profile";

const symbols: Record<AvatarKey, string> = {
  moon: "☾",
  star: "★",
  book: "▤",
  lantern: "◇",
  leaf: "⌁",
};

export default function AvatarBadge({ avatar, small = false }: { avatar: AvatarKey; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-blue text-paper ${small ? "h-9 w-9 text-[18px]" : "h-14 w-14 text-[26px]"}`}
    >
      {symbols[avatar]}
    </span>
  );
}
