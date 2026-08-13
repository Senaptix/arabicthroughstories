"use client";

/**
 * Playback speed for a recording.
 *
 * Discrete buttons rather than a slider, deliberately. A slider is fiddly
 * for small hands on a phone, gives no way to land back on exactly 1×, and
 * would need a label to say what value it is on. Four fixed steps are a
 * bigger tap target and are self-describing.
 *
 * 0.75× is the slow step, not 0.5×: half speed was tried and judged too
 * slow to follow — it stretches the words far enough apart that the sentence
 * stops hanging together, which defeats the point. 0.75× still separates the
 * short vowels, which is what a learner needs to hear. The faster steps are
 * for re-listening to a page already known.
 *
 * Pitch is left alone. Browsers default `preservesPitch` to true, so slowing
 * down does not drop the reciter into a growl; the recording has to stay a
 * usable pronunciation model at every speed.
 *
 * Presentational only — the parent owns the state and applies it to its own
 * media element, so this never needs a ref passed across a boundary.
 */

export const RATES = [0.75, 1, 1.5, 2] as const;

export default function PlaybackRate({
  rate,
  onChange,
}: {
  rate: number;
  onChange: (rate: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        id="playback-speed-label"
        className="text-ink/55 shrink-0"
        style={{ fontSize: "13px" }}
      >
        Speed
      </span>
      <div
        role="group"
        aria-labelledby="playback-speed-label"
        className="border-ink/10 bg-surface/70 flex gap-1 rounded-full border p-1"
      >
        {RATES.map((r) => {
          const active = r === rate;
          return (
            <button
              key={r}
              type="button"
              onClick={() => onChange(r)}
              aria-pressed={active}
              aria-label={`Play at ${r} times speed`}
              className={`inline-flex min-h-[40px] min-w-[48px] items-center justify-center rounded-full px-2 font-medium transition-colors duration-150 ease-out ${
                active
                  ? "bg-brand-blue text-paper"
                  : "text-brand-blue hover:bg-surface"
              }`}
              style={{ fontSize: "14px" }}
            >
              {r}&times;
            </button>
          );
        })}
      </div>
    </div>
  );
}
