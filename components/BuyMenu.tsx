import type { ReactNode } from "react";

export type StoreLink = { store: string; url: string };

type Props = {
  label: ReactNode;
  /** Used alone when there are no per-country links. */
  url: string;
  links: StoreLink[];
  /** Classes for the button itself, so each call site keeps its own look. */
  className: string;
  /** Which edge the store list opens from. */
  align?: "left" | "right";
};

/**
 * The buy button, with a choice of Amazon store.
 *
 * NO JAVASCRIPT, for the same reason as SiteNav's menu: a native <details> is
 * a keyboard-accessible disclosure that works before hydration, and this
 * renders on otherwise-static routes. There is no geo-IP on the VPS to guess
 * the country from, so the reader picks it; the list is short enough that
 * picking costs one glance.
 */
export default function BuyMenu({
  label,
  url,
  links,
  className,
  align = "left",
}: Props) {
  if (links.length === 0) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
      </a>
    );
  }

  return (
    <details className="relative inline-block">
      <summary
        className={`${className} cursor-pointer list-none gap-2 [&::-webkit-details-marker]:hidden`}
      >
        {label}
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div
        className={`border-ink/10 bg-paper absolute z-30 mt-2 w-[270px] rounded-2xl border p-2 shadow-[0_18px_40px_-24px_rgba(26,42,74,0.45)] ${
          align === "right" ? "right-0" : "left-0"
        }`}
      >
        <p className="text-ink/60 px-3 pt-1 pb-2 text-[13px]">
          Choose your Amazon store
        </p>
        {links.map((l) => (
          <a
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink hover:bg-sand/30 flex min-h-[44px] items-center justify-between gap-3 rounded-xl px-3 text-[15px]"
          >
            <span>{l.store}</span>
            <span className="text-ink/50 text-[13px]">
              {new URL(l.url).hostname.replace(/^www\./, "")}
            </span>
          </a>
        ))}
      </div>
    </details>
  );
}
