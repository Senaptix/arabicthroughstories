import type { ReactNode } from "react";
import { checkoutEnabled, priceIdFor } from "@/lib/paddle";

export type StoreLink = { store: string; url: string };

export type OnlineOption = { label: string; href: string };

/**
 * Online (Paddle) options for a book, or [] while checkout is off. Labels and
 * links only: no prices, no price ids. Server components only (reads PADDLE_*).
 */
export function onlineOptionsFor(slug?: string): OnlineOption[] {
  if (!checkoutEnabled()) return [];

  if (priceIdFor("yusuf")) {
    const part1: OnlineOption = {
      label: "Part 1: Who Broke the Idols?",
      href: "/buy/ibrahim",
    };
    const part2: OnlineOption = {
      label: "Part 2: Yusuf",
      href: "/buy/yusuf",
    };
    const out: OnlineOption[] =
      slug === "yusuf"
        ? [part2, ...(priceIdFor("ibrahim") ? [part1] : [])]
        : [...(priceIdFor("ibrahim") ? [part1] : []), part2];
    if (priceIdFor("both")) {
      out.push({ label: "Both parts", href: "/buy/both" });
    }
    return out;
  }

  if (!slug || !priceIdFor(slug)) return [];
  const out: OnlineOption[] = [
    { label: "Digital Edition (this part)", href: `/buy/${slug}` },
  ];
  if (priceIdFor("both")) out.push({ label: "Both parts", href: "/buy/both" });
  return out;
}

type Props = {
  label: ReactNode;
  /** Used alone when there are no per-country links. */
  url: string;
  links: StoreLink[];
  /** Classes for the button itself, so each call site keeps its own look. */
  className: string;
  /** Which edge the store list opens from. */
  align?: "left" | "right";
  /** Book slug; when checkout is on, adds a "Read online now" group first. */
  slug?: string;
  paperbacks?: { label: string; url: string; links: StoreLink[] }[];
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
  slug,
  paperbacks,
}: Props) {
  const online = onlineOptionsFor(slug);
  const stores: StoreLink[] =
    links.length > 0 || online.length === 0 ? links : [{ store: "Amazon", url }];
  if (stores.length === 0 && !paperbacks?.length) {
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
        className={`border-ink/10 bg-paper absolute z-30 mt-2 w-[270px] max-h-[70vh] overflow-y-auto rounded-2xl border p-2 shadow-[0_18px_40px_-24px_rgba(26,42,74,0.45)] ${
          align === "right" ? "right-0" : "left-0"
        }`}
      >
        {online.length > 0 && (
          <>
            <p className="text-ink/60 px-3 pt-1 pb-2 text-[13px]">
              Read online now
            </p>
            {online.map((o) => (
              <a
                key={o.href}
                href={o.href}
                className="text-brand-blue hover:bg-sand/30 flex min-h-[44px] items-center rounded-xl px-3 text-[15px] font-medium"
              >
                {o.label}
              </a>
            ))}
            <div className="border-ink/10 my-2 border-t" />
          </>
        )}
        {paperbacks?.length ? (
          <>
            <p className="text-ink/60 px-3 pt-1 pb-2 text-[13px]">Paperback on Amazon</p>
            {paperbacks.map((book) => (
              <details key={book.url} className="border-ink/10 border-t">
                <summary className="text-brand-blue cursor-pointer px-3 py-3 text-[14px] font-medium">
                  {book.label}
                </summary>
                {(book.links.length ? book.links : [{ store: "Amazon", url: book.url }]).map((store) => (
                  <a key={store.url} href={store.url} target="_blank" rel="noopener noreferrer"
                    className="text-ink hover:bg-sand/30 flex min-h-[44px] items-center rounded-xl px-5 text-[15px]">
                    {store.store}
                  </a>
                ))}
              </details>
            ))}
          </>
        ) : (
          <>
        <p className="text-ink/60 px-3 pt-1 pb-2 text-[13px]">
          {online.length > 0
            ? "Paperback on Amazon"
            : "Choose your Amazon store"}
        </p>
        {stores.map((l) => (
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
          </>
        )}
      </div>
    </details>
  );
}
