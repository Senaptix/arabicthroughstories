"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * The homepage hero pictures — pages from both parts, alternating.
 *
 * Below lg: a native swipe row (CSS scroll-snap, no library). The next card
 * peeks in so the row reads as swipeable, and the dots track and set the
 * current page.
 *
 * lg and up: the original loose-sheet fan. The front card slides on to the
 * next picture every few seconds and the two back cards always show the ones
 * coming next, so the deck appears to advance. It pauses on hover and does
 * not move at all under prefers-reduced-motion.
 *
 * FACELESS ONLY. This is the main page of the sales funnel. Faced marketing
 * art is confined to the /watch page by the build (lib/parse.check.ts),
 * which is also why its folder is never named in this file.
 */

export type HeroPage = { file: string; alt: string };

const ADVANCE_MS = 4500;
const SHADOW = "shadow-[0_18px_40px_-24px_rgba(26,42,74,0.45)]";

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function HeroGallery({ pages }: { pages: HeroPage[] }) {
  return (
    <>
      <SwipeRow pages={pages} />
      <Fan pages={pages} />
    </>
  );
}

function SwipeRow({ pages }: { pages: HeroPage[] }) {
  const row = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // The current slide is whichever one's centre is nearest the row's centre.
  const onScroll = () => {
    const el = row.current;
    if (!el) return;
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(el.children).forEach((child, i) => {
      const s = child as HTMLElement;
      const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
      if (d < bestDist) {
        best = i;
        bestDist = d;
      }
    });
    setActive(best);
  };

  const show = (i: number) => {
    const el = row.current;
    const s = el?.children[i] as HTMLElement | undefined;
    if (!el || !s) return;
    el.scrollTo({
      left: s.offsetLeft - (el.clientWidth - s.offsetWidth) / 2,
      behavior: reducedMotion() ? "auto" : "smooth",
    });
  };

  return (
    <div className="-mx-6 sm:-mx-8 lg:hidden">
      <div
        ref={row}
        onScroll={onScroll}
        role="region"
        aria-roledescription="carousel"
        aria-label="Pages from the books — swipe for more"
        tabIndex={0}
        className="relative flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pt-2 pb-6 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {pages.map((p, i) => (
          <div
            key={p.file}
            className="w-[72%] max-w-[320px] shrink-0 snap-center"
          >
            <Image
              src={`/art/${p.file}`}
              alt={p.alt}
              width={688}
              height={968}
              priority={i === 0}
              sizes="(max-width: 640px) 72vw, 320px"
              className={`border-ink/10 w-full rounded-xl border ${SHADOW}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1">
        {pages.map((p, i) => (
          <button
            key={p.file}
            type="button"
            onClick={() => show(i)}
            aria-label={`Show picture ${i + 1} of ${pages.length}`}
            aria-current={i === active}
            className="p-2"
          >
            <span
              className={`block h-2 rounded-full transition-all ${
                i === active ? "bg-brand-blue w-5" : "bg-ink/20 w-2"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function Fan({ pages }: { pages: HeroPage[] }) {
  const n = pages.length;
  // pos runs 0..n. Slot n holds a copy of the first page, so the step from the
  // last page back to the first still slides forwards, then resets unseen.
  const [deck, setDeck] = useState({ pos: 0, slide: true });
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || reducedMotion()) return;
    const t = window.setInterval(() => {
      // A reset that never landed (a background tab skips transitionend)
      // is repaired here rather than sliding past the end of the strip.
      setDeck((d) =>
        d.pos >= n ? { pos: 0, slide: false } : { pos: d.pos + 1, slide: true },
      );
    }, ADVANCE_MS);
    return () => window.clearInterval(t);
  }, [paused, n]);

  const front = deck.pos % n;
  const after = (k: number) => pages[(front + k) % n];

  return (
    <div
      className="relative hidden aspect-[4/3.4] lg:block"
      aria-hidden="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Sheet
        page={after(1)}
        className="absolute top-[6%] left-0 w-[52%] -rotate-6"
      />
      <Sheet
        page={after(2)}
        className="absolute top-0 right-[2%] w-[46%] rotate-3"
      />
      <div
        className={`border-ink/10 absolute bottom-0 left-[24%] w-[54%] rotate-1 overflow-hidden rounded-xl border ${SHADOW}`}
      >
        <div
          className="flex"
          style={{
            transform: `translateX(-${deck.pos * 100}%)`,
            transition: deck.slide
              ? "transform 700ms cubic-bezier(0.2, 0.75, 0.25, 1)"
              : "none",
          }}
          onTransitionEnd={() =>
            setDeck((d) => (d.pos === n ? { pos: 0, slide: false } : d))
          }
        >
          {[...pages, pages[0]].map((p, k) => (
            <Image
              key={k}
              src={`/art/${p.file}`}
              alt=""
              width={688}
              height={968}
              priority={k === 0}
              sizes="260px"
              className="w-full shrink-0"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** A back sheet. Keyed on the file so a new picture remounts and fades in. */
function Sheet({ page, className }: { page: HeroPage; className: string }) {
  return (
    <Image
      key={page.file}
      src={`/art/${page.file}`}
      alt=""
      width={688}
      height={968}
      sizes="260px"
      className={`hero-fade border-ink/10 rounded-xl border ${SHADOW} ${className}`}
    />
  );
}
