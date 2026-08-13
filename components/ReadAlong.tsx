"use client";

import { useRef, useState } from "react";
import PlaybackRate from "./PlaybackRate";
import QuranicText from "./QuranicText";

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
  words,
  lines,
  label,
}: {
  src: string;
  /** The animation, where one exists for this page. */
  video?: string;
  poster?: string;
  /**
   * This page's new words. Given instead of an animation, this is the
   * companion demo — audio, text and vocabulary, which is what a reader
   * gets for every page. No artwork; the pictures stay in the book.
   */
  words?: { ar: string; en: string }[];
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
  const [rate, setRate] = useState(1);

  /**
   * Single-line replay state. Refs, not state: the watcher below reads these
   * every frame and must never see a stale closure, and nothing renders from
   * them.
   */
  const soloUntilRef = useRef<number | null>(null);
  const soloFromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  function endSolo() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    soloUntilRef.current = null;
  }

  /**
   * Stop exactly on the next line's cue.
   *
   * This has to run per-frame. `timeupdate` fires only about four times a
   * second, which at 2× is half a second of audio — enough to bleed into the
   * next line, which is precisely what a single-line replay must not do.
   */
  function watchSolo() {
    const audio = audioRef.current;
    const until = soloUntilRef.current;
    if (!audio || until === null) return;
    if (audio.currentTime >= until) {
      audio.pause();
      // Rewind to the line just heard, so it stays highlighted and pressing
      // play again repeats it rather than jumping ahead.
      audio.currentTime = soloFromRef.current;
      endSolo();
      return;
    }
    rafRef.current = requestAnimationFrame(watchSolo);
  }

  /**
   * Replay one line on its own — the teacher's request. A learner who missed
   * a word wants that line again, not the whole page from the top.
   */
  function playLine(i: number) {
    const audio = audioRef.current;
    if (!audio) return;
    endSolo();
    audio.currentTime = lines[i].at;
    audio.playbackRate = rate;
    soloFromRef.current = lines[i].at;
    soloUntilRef.current = lines[i + 1]?.at ?? null;
    audio
      .play()
      .then(() => {
        if (soloUntilRef.current !== null)
          rafRef.current = requestAnimationFrame(watchSolo);
      })
      .catch(() => setUnavailable(true));
  }

  function changeRate(r: number) {
    setRate(r);
    // Cue times are in media time, so they stay correct at any speed — the
    // highlight follows currentTime, which is unaffected by playbackRate.
    if (audioRef.current) audioRef.current.playbackRate = r;
  }

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
    // The transport button means "play the page", so drop any single-line
    // boundary left over from a replay.
    endSolo();
    audio.play().catch(() => setUnavailable(true));
  }

  function handleTime() {
    const t = audioRef.current?.currentTime ?? 0;

    // Backstop for the per-frame watcher: requestAnimationFrame is throttled
    // in a background tab, where this still fires.
    const until = soloUntilRef.current;
    if (until !== null && t >= until) {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = soloFromRef.current;
      endSolo();
    }

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
    // Re-applied here because a browser may reset playbackRate to 1 when it
    // (re)loads the source or restores the element from bfcache.
    if (audioRef.current) audioRef.current.playbackRate = rate;
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
    endSolo();
    stopVideo();
  }

  if (unavailable) {
    return (
      <p className="text-ink/55" style={{ fontSize: "15px", lineHeight: 1.6 }}>
        This recording could not be played in your browser.
      </p>
    );
  }

  // With neither an animation nor a glossary there is only one pane, so the
  // two-column grid would leave the text stranded at 72% width.
  const twoPane = Boolean(video || words);

  return (
    <div
      className={
        twoPane
          ? "grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:items-center lg:gap-12"
          : "grid gap-8"
      }
    >
      {video ? (
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
      ) : null}

      {/* The glossary is rendered after the text in DOM order — under it on a
          phone, beside it on a wide screen — matching where the box sits on
          the printed page. `order` is layout only; it never reorders how the
          text itself is read. */}
      <div className={video ? undefined : "lg:order-2"}>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggle}
            aria-pressed={playing}
            aria-label={playing ? `Pause ${label}` : `Play ${label}`}
            className="bg-brand-blue text-paper flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-transform duration-150 ease-out hover:scale-105"
          >
            {playing ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                aria-hidden="true"
                fill="currentColor"
              >
                <rect x="4" y="3" width="4.5" height="14" rx="1.2" />
                <rect x="11.5" y="3" width="4.5" height="14" rx="1.2" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                aria-hidden="true"
                fill="currentColor"
              >
                <path d="M6 3.6c0-.8.9-1.3 1.6-.9l9 6.4c.6.4.6 1.4 0 1.8l-9 6.4c-.7.4-1.6-.1-1.6-.9V3.6Z" />
              </svg>
            )}
          </button>

          <p
            className="text-ink/60"
            style={{ fontSize: "15px", lineHeight: 1.5 }}
          >
            {playing ? "Reading…" : `Hear ${label}`}
          </p>
        </div>

        <div className="mt-4">
          <PlaybackRate rate={rate} onChange={changeRate} />
        </div>

        {/* The glyphs never move. Only the surface behind them changes. */}
        <ol lang="ar" dir="rtl" className="mt-6 flex flex-col gap-1">
          {lines.map((line, i) => (
            <li key={i} aria-current={i === active ? "true" : undefined}>
              {/* A button, so the line is reachable by keyboard and announced
                  as activatable. Tapping replays just this line. */}
              <button
                type="button"
                onClick={() => playLine(i)}
                aria-label={`Replay line ${i + 1}`}
                // Inactive lines stay at 60% rather than fading further:
                // below that the tashkeel stops resolving, and a reader
                // looking ahead to the next line needs to be able to read it.
                className={`w-full cursor-pointer rounded-xl px-3 py-1 transition-colors duration-200 ease-out ${
                  i === active
                    ? "bg-brand-blue/15 text-ink"
                    : "text-ink/60 hover:bg-brand-blue/5"
                }`}
                style={{
                  fontFamily: "var(--font-arabic)",
                  fontSize: "clamp(28px, 5.5vw, 34px)",
                  lineHeight: 1.9,
                  textAlign: "start",
                }}
              >
                <QuranicText text={line.ar} />
              </button>
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

      {/* `words &&`, not just `!video`: without it a page that has neither
          renders an empty glossary card with a heading and no words. */}
      {!video && words && words.length > 0 && (
        <div className="border-ink/10 bg-surface/70 h-fit rounded-2xl border px-5 py-5 lg:order-1">
          <p
            lang="ar"
            dir="rtl"
            className="text-ink/70"
            style={{
              fontFamily: "var(--font-arabic)",
              fontSize: "clamp(22px, 4vw, 26px)",
              lineHeight: 1.8,
            }}
          >
            كَلِمَاتٌ جَدِيدَةٌ
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {words?.map((w) => (
              <li
                key={w.ar}
                className="flex items-baseline justify-between gap-4"
              >
                <span
                  lang="ar"
                  dir="rtl"
                  className="text-ink"
                  style={{
                    fontFamily: "var(--font-arabic)",
                    fontSize: "clamp(24px, 5vw, 28px)",
                    lineHeight: 1.8,
                  }}
                >
                  {w.ar}
                </span>
                <span
                  className="text-ink/65 text-right"
                  style={{ fontSize: "15px", lineHeight: 1.7 }}
                >
                  {w.en}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
