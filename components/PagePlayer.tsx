"use client";

import { useRef, useState } from "react";
import PlaybackRate from "./PlaybackRate";

/**
 * The player for a page that HAS a recording but no measured line cues.
 *
 * Native `controls`, not the custom transport in ReadAlong: without cues
 * there is no line to highlight, so there is nothing for a bespoke player to
 * add over the browser's own — which already gives a scrub bar and works
 * with screen readers and system media keys for free.
 *
 * The speed buttons are here because native controls do not expose speed
 * consistently: Chrome hides it behind an overflow menu, and several mobile
 * browsers omit it entirely. 0.5× is the point of the feature for a learner,
 * so it cannot be left to chance.
 *
 * See scripts/measure-timings.ts for why these pages have no cues and why
 * they are not simply guessed at.
 */
export default function PagePlayer({
  src,
  page,
}: {
  src: string;
  page: number;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [rate, setRate] = useState(1);

  function changeRate(r: number) {
    setRate(r);
    if (ref.current) ref.current.playbackRate = r;
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <audio
        ref={ref}
        controls
        preload="none"
        src={src}
        aria-label={`Page ${page} read aloud`}
        // Re-applied on play: a browser that reloads the source (or restores
        // the element from bfcache) resets playbackRate to 1 silently.
        onPlay={() => {
          if (ref.current) ref.current.playbackRate = rate;
        }}
        className="w-full"
      />
      <PlaybackRate rate={rate} onChange={changeRate} />
    </div>
  );
}
