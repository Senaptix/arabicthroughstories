"use client";

import { useRef, useState } from "react";

/**
 * Narration + animation + the line being read, for one page.
 *
 * The active line is marked by a COLOUR CHANGE, never by movement. Sliding
 * or fading vocalised Arabic makes the tashkeel harder to resolve, and the
 * marks are the thing being taught — see WEBSITE_DESIGN.md ("Motion"). The
 * glyphs never move; only the surface behind them changes.
 *
 * No autoplay. The child presses play, as on a page card.
 *
 * Lives on the marketing page only. Keep it off the page-card route, which
 * has a JS budget (WEBSITE_BUILD.md).
 */

type Line = { at: number; ar: string };

export default function ReadAlong({
  src,
  video,
  poster,
  lines,
  label,
}: {
  src: string;
  video: string;
  poster: string;
  lines: Line[];
  /** What to call this in the UI — e.g. "the opening of the story". The page
   *  number is deliberately not shown: this is where the book begins, and a
   *  reader has no reason to care which sheet it is printed on. */
  label: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState(-1);
  const [unavailable, setUnavailable] = useState(false);

  function stopVideo() {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  }

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      return;
    }
    audio.play().catch(() => setUnavailable(true));
  }

  function handleTime() {
    const t = audioRef.current?.currentTime ?? 0;
    // Lines are in order; the active one is the last that has started.
    let i = -1;
    for (let n = 0; n < lines.length; n++) {
      if (t + 0.05 >= lines[n].at) i = n;
      else break;
    }
    setActive(i);
  }

  function handlePlay() {
    setPlaying(true);
    // Checked at play time rather than held in state: no effect needed, and
    // it picks up a preference changed since the page loaded.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // The animation is shorter than the narration, so it loops underneath.
    videoRef.current?.play().catch(() => {});
  }

  function handlePause() {
    setPlaying(false);
    videoRef.current?.pause();
  }

  function handleEnded() {
    setPlaying(false);
    setActive(-1);
    stopVideo();
  }

  if (unavailable) {
    return (
      <p className="text-ink/55" style={{ fontSize: "15px", lineHeight: 1.6 }}>
        This recording could not be played in your browser.
      </p>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:items-center lg:gap-12">
      <div className="border-ink/10 bg-night/5 relative mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl border lg:mx-0 lg:max-w-none">
        <video
          ref={videoRef}
          src={video}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          className="block h-auto w-full"
        />
      </div>

      <div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggle}
            aria-pressed={playing}
            aria-label={playing ? `Pause ${label}` : `Play ${label}`}
            className="bg-brand-blue text-paper flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-transform duration-150 ease-out hover:scale-105"
          >
            {playing ? (
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="currentColor">
                <rect x="4" y="3" width="4.5" height="14" rx="1.2" />
                <rect x="11.5" y="3" width="4.5" height="14" rx="1.2" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="currentColor">
                <path d="M6 3.6c0-.8.9-1.3 1.6-.9l9 6.4c.6.4.6 1.4 0 1.8l-9 6.4c-.7.4-1.6-.1-1.6-.9V3.6Z" />
              </svg>
            )}
          </button>

          <p className="text-ink/60" style={{ fontSize: "15px", lineHeight: 1.5 }}>
            {playing ? "Reading…" : `Hear ${label}`}
          </p>
        </div>

        {/* The glyphs never move. Only the surface behind them changes. */}
        <ol lang="ar" dir="rtl" className="mt-6 flex flex-col gap-1">
          {lines.map((line, i) => (
            <li
              key={i}
              aria-current={i === active ? "true" : undefined}
              // Inactive lines stay at 60% rather than fading further: below
              // that the tashkeel stops resolving, and a reader looking ahead
              // to the next line needs to be able to read it.
              className={`rounded-xl px-3 py-1 transition-colors duration-200 ease-out ${
                i === active
                  ? "bg-brand-blue/15 text-ink"
                  : "text-ink/60"
              }`}
              style={{
                fontFamily: "var(--font-arabic)",
                fontSize: "clamp(28px, 5.5vw, 34px)",
                lineHeight: 1.9,
                textAlign: "start",
              }}
            >
              {line.ar}
            </li>
          ))}
        </ol>

        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onTimeUpdate={handleTime}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onError={() => setUnavailable(true)}
        />
      </div>
    </div>
  );
}
