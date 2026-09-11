import type { Metadata } from "next";
import Link from "next/link";
import Eyebrow from "@/components/Eyebrow";
import HomeBar from "@/components/HomeBar";

/**
 * The reels — the one page on this site where people may have faces.
 *
 * WHY IT IS SEPARATE. The book, its companion and the homepage are faceless,
 * because madrasas are part of the market and faces are what they object to.
 * That is a decision about the product. The marketing reels were generated
 * with faces on ordinary townspeople, and the owner confirmed on 2026-09-11
 * that this is acceptable for marketing — but NOT on the main page of the
 * sales funnel. So they live here, reached from social links, and nowhere
 * else on the site.
 *
 * ENFORCED, not just documented: lib/parse.check.ts fails the build if any
 * file other than this one references /marketing/. A faced clip therefore
 * cannot drift onto the homepage or a reading page by accident.
 *
 * NOT LINKED from the homepage or the site nav, and kept out of search, so
 * it never becomes part of the funnel's discovery path. It links OUT to the
 * homepage; nothing links in except social profiles.
 *
 * NO PROPHET, ever, faces or not. These reels narrate Ibrahim (as) while
 * showing only what he sees; the owner checked every reel for this before
 * they were published here. Any reel added later must be checked the same
 * way — that rule is not relaxed for marketing.
 *
 * Source: book repo deliverables/reels-astra-v2, re-encoded to 720x1280 H.264
 * with fast-start so playback begins before the download finishes.
 */

export const metadata: Metadata = {
  title: "Watch the story begin",
  description:
    "The opening of Who Broke the Idols?, read aloud in Arabic with every word highlighted as it is spoken.",
  alternates: { canonical: "./" },
  robots: { index: false, follow: true },
};

const REELS = [
  {
    file: "01-opening",
    label: "1 · The story begins",
    pages: "Pages 3–4",
    note: "Azar, the idol-seller, and the house of idols.",
  },
  {
    file: "02-bridge",
    label: "2 · Stones that cannot hear",
    pages: "Pages 5–6",
    note: "Azar's son sees what the people worship.",
  },
  {
    file: "03-mouse",
    label: "3 · The fly and the mouse",
    pages: "Page 7",
    note: "The idols cannot even stop a mouse.",
  },
];

export default function WatchPage() {
  return (
    <>
      <HomeBar />

      <main className="mx-auto w-full max-w-[1100px] px-6 py-12 sm:px-8 lg:py-20">
        <header className="max-w-[60ch]">
          <Eyebrow>Watch</Eyebrow>
          <h1
            className="text-ink mt-4 font-semibold text-balance"
            style={{
              fontSize: "clamp(30px, 5.5vw, 46px)",
              lineHeight: 1.12,
              letterSpacing: "-0.015em",
            }}
          >
            The story begins, read aloud.
          </h1>
          <p
            className="text-ink/70 mt-4"
            style={{ fontSize: "clamp(16px, 2.5vw, 18px)", lineHeight: 1.65 }}
          >
            The first pages of <em>Who Broke the Idols?</em>, narrated in
            Arabic. Each word lights up as it is spoken, with the English
            underneath — the same reading the book and its companion give a
            child on every page.
          </p>
        </header>

        <ul className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
          {REELS.map((reel) => (
            <li key={reel.file} className="mx-auto w-full max-w-[340px]">
              <video
                src={`/marketing/reels/${reel.file}.mp4`}
                poster={`/marketing/reels/${reel.file}.jpg`}
                controls
                playsInline
                preload="none"
                className="border-ink/10 aspect-[9/16] w-full rounded-2xl border bg-black"
              >
                Your browser cannot play this video.
              </video>
              <p
                className="text-ink mt-4 font-medium"
                style={{ fontSize: "16px", lineHeight: 1.4 }}
              >
                {reel.label}
              </p>
              <p
                className="text-ink/55 mt-1"
                style={{ fontSize: "14px", lineHeight: 1.5 }}
              >
                <span className="text-brand-blue">{reel.pages}</span> ·{" "}
                {reel.note}
              </p>
            </li>
          ))}
        </ul>

        <div className="border-ink/10 mt-16 border-t pt-10">
          <p
            className="text-ink/75 max-w-[52ch]"
            style={{ fontSize: "clamp(16px, 2.5vw, 18px)", lineHeight: 1.65 }}
          >
            The book carries on from here — fifty illustrated pages, every word
            vowelled, with audio and practice for each one.
          </p>
          <Link
            href="/"
            className="text-brand-blue mt-4 inline-block font-medium underline underline-offset-4"
            style={{ fontSize: "17px" }}
          >
            See the book →
          </Link>
        </div>
      </main>
    </>
  );
}
