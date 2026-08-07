"use client";

import { useRef, useState } from "react";

/**
 * The audio player for a page card. One control (play/pause), a scrub bar,
 * and elapsed/total time — nothing else. No autoplay: the child presses
 * play. Audio for most pages doesn't exist yet, so a missing or broken
 * source degrades to a quiet "Audio coming soon" state instead of an error
 * or a visibly broken player. See WEBSITE_DESIGN.md ("Audio player").
 *
 * The only client component of the four — it owns play state.
 */
export default function AudioPlayer({ src, label }: { src: string; label?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [unavailable, setUnavailable] = useState(false);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      return;
    }
    audio.play().catch(() => setUnavailable(true));
  }

  function handleScrub(value: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(duration) || duration <= 0) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }

  if (unavailable) {
    return (
      <div
        role="status"
        className="border-panel-light flex min-h-[56px] items-center gap-3 rounded-2xl border px-4 py-3"
      >
        <span lang="en" className="text-ink/60" style={{ fontSize: "15px", lineHeight: 1.7 }}>
          Audio coming soon
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onError={() => setUnavailable(true)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
        aria-pressed={playing}
        className="bg-brand-blue text-paper flex shrink-0 items-center justify-center rounded-full transition-transform duration-150 ease-out hover:scale-105"
        style={{ width: "56px", height: "56px" }}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {label ? (
          <span lang="en" className="text-ink/60 truncate" style={{ fontSize: "14px", lineHeight: 1.4 }}>
            {label}
          </span>
        ) : null}
        <div className="flex items-center gap-2">
          <input
            type="range"
            aria-label="Seek"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => handleScrub(Number(e.target.value))}
            disabled={!duration}
            className="accent-brand-blue h-8 flex-1 cursor-pointer disabled:cursor-default"
          />
          <span lang="en" className="text-ink/70 shrink-0 tabular-nums" style={{ fontSize: "14px" }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 3.5L16 10L5 16.5V3.5Z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="4.5" height="14" rx="1" fill="currentColor" />
      <rect x="11.5" y="3" width="4.5" height="14" rx="1" fill="currentColor" />
    </svg>
  );
}
