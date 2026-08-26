/**
 * Measure where each line of a page starts in its recording.
 *
 * Line cues are MEASURED, never estimated: a stale or guessed cue highlights
 * the wrong line while the child is looking at it, which teaches the wrong
 * word. This script is the thing that regenerates them (lib/parse.ts's
 * parseTimings header promises exactly that).
 *
 * How it works, and the two approaches that were tried and rejected:
 *
 *   1. "Take the N-1 longest silences." Wrong. On some pages a mid-sentence
 *      pause is longer than a real line break — page 4 is the known example,
 *      and it is why this whole script is not three lines long.
 *
 *   2. "Split the clip in proportion to how much text each line carries,
 *      then snap to the nearest silence." Better, but still wrong on 6 of
 *      the 22 hand-checked pages, by up to 1.9s. The flaw is that it
 *      measures wall-clock time, and wall-clock includes the pauses — a
 *      line followed by a long breath looks like a longer line.
 *
 *   3. What it does now: align on SPEECH time. Silences are subtracted, so
 *      each line is judged only on how long the reader was actually talking,
 *      compared to how much text that line carries. Boundaries are then
 *      chosen by a DP over ordered candidates, scoring the whole
 *      segmentation at once rather than each boundary independently — so a
 *      boundary placed slightly late is punished by the short segment it
 *      leaves behind, and the fit self-corrects.
 *
 * THE RESULT, measured against the 22 pages whose cues were set by hand:
 * this reproduces 16 of 22 exactly and gets 6 wrong, by up to 2.4s. It does
 * NOT write anything, and there is deliberately no --write flag. Read on
 * before trying to add one.
 *
 * Everything below was tried and did not lift that number:
 *   - all 1680 combinations of silence threshold, minimum pause, wall-clock
 *     vs speech-time fit, four text-weight models (including a mora count,
 *     which the fully-vowelled text makes computable) and a long-pause bonus.
 *     Every one of them tops out at 16/22.
 *   - a long-pause prior. Pause length simply is not the signal: on page 20
 *     a 0.84s pause sits mid-line while a real line break gets only 0.45s.
 *     "Take the N-1 longest silences" scores 68/91 cues.
 *   - consensus across 72 parameterisations, hoping agreement would flag the
 *     bad pages. It does not: pages 11, 15, 19 and 24 are agreed by 92-100%
 *     of settings and are all wrong. There is no self-check here.
 *
 * Every true cue IS at a detected silence (91/91 at noise=-32dB), so the
 * detection is fine — the *choice* is what fails, because the reader's pace
 * varies far more than the text length predicts. Fixing this properly needs
 * forced alignment against the words (ASR), not silence heuristics.
 *
 * So: this script PROPOSES cues for a human to check by ear, and re-checks
 * the committed ones. Cues reach content/data/ibrahim.timings.json only by a
 * person confirming them. A page with audio but no cues is not broken — it
 * gets a plain player instead of a read-along (see the page-card route).
 *
 * Usage:
 *   npx tsx scripts/measure-timings.ts [slug]   propose cues for pages that
 *       have none, and re-check the committed ones against the detector.
 *       Slug defaults to ibrahim.
 */

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { getRecordedPages, parsePageText, parseTimings } from "../lib/parse";

const SLUG = process.argv[2] ?? "ibrahim";
const AUDIO_DIR = path.join(process.cwd(), "public", "audio", SLUG);
const TIMINGS = path.join(
  process.cwd(),
  "content",
  "data",
  `${SLUG}.timings.json`,
);

/** Quiet threshold and minimum quiet length for a gap to count as a candidate. */
const NOISE_DB = -32;
const MIN_SILENCE = 0.22;

type Silence = { start: number; end: number };

function ffprobeDuration(file: string): number {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  );
  return Number(out.trim());
}

function detectSilences(file: string): Silence[] {
  // silencedetect reports on STDERR even though ffmpeg exits 0, so this needs
  // spawnSync — execFileSync hands back stdout only and would look silent.
  const r = spawnSync(
    "ffmpeg",
    [
      "-i",
      file,
      "-af",
      `silencedetect=noise=${NOISE_DB}dB:d=${MIN_SILENCE}`,
      "-f",
      "null",
      "-",
    ],
    { encoding: "utf8" },
  );
  const stderr = r.stderr ?? "";

  const silences: Silence[] = [];
  let pendingStart: number | null = null;
  for (const line of stderr.split("\n")) {
    const s = /silence_start:\s*(-?[\d.]+)/.exec(line);
    if (s) pendingStart = Number(s[1]);
    const e = /silence_end:\s*(-?[\d.]+)/.exec(line);
    if (e && pendingStart !== null) {
      silences.push({ start: pendingStart, end: Number(e[1]) });
      pendingStart = null;
    }
  }
  return silences;
}

/**
 * How much "speaking" each line represents. Non-space characters, which
 * includes the vowel marks — those are syllables, so they genuinely track
 * duration rather than inflating it.
 */
const weight = (line: string) => [...line.replace(/\s+/g, "")].length;

/** Seconds of actual speech between two times, i.e. minus any quiet. */
function speechBetween(silences: Silence[], a: number, b: number): number {
  let quiet = 0;
  for (const s of silences) {
    const lo = Math.max(a, s.start);
    const hi = Math.min(b, s.end);
    if (hi > lo) quiet += hi - lo;
  }
  return Math.max(0, b - a - quiet);
}

/**
 * Choose N-1 ordered boundaries so that each line's share of SPEECH time
 * best matches its share of the text. Scores the whole segmentation, not
 * each boundary in isolation. Returns null if there are not enough
 * candidates to seat every line.
 */
function alignLines(
  weights: number[],
  candidates: number[],
  duration: number,
  silences: Silence[],
): number[] | null {
  const N = weights.length;
  const B = N - 1;
  if (B === 0) return [];
  const M = candidates.length;
  if (M < B) return null;

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const totalSpeech = speechBetween(silences, 0, duration);
  const expected = weights.map((w) => (w / totalWeight) * totalSpeech);

  /** Relative squared error of one line spanning [t0, t1]. */
  const cost = (i: number, t0: number, t1: number) => {
    const exp = expected[i];
    if (exp <= 0) return 0;
    const actual = speechBetween(silences, t0, t1);
    const rel = (actual - exp) / exp;
    return rel * rel;
  };

  const INF = Infinity;
  // dp[k][j] — boundaries 1..k+1 placed, the last at candidates[j].
  const dp: number[][] = Array.from({ length: B }, () =>
    new Array(M).fill(INF),
  );
  const from: number[][] = Array.from({ length: B }, () =>
    new Array(M).fill(-1),
  );

  for (let j = 0; j < M; j++) dp[0][j] = cost(0, 0, candidates[j]);

  for (let k = 1; k < B; k++) {
    for (let j = k; j < M; j++) {
      let best = INF;
      let bestPrev = -1;
      for (let p = k - 1; p < j; p++) {
        if (dp[k - 1][p] === INF) continue;
        const c = dp[k - 1][p] + cost(k, candidates[p], candidates[j]);
        if (c < best) {
          best = c;
          bestPrev = p;
        }
      }
      dp[k][j] = best;
      from[k][j] = bestPrev;
    }
  }

  let best = INF;
  let bestLast = -1;
  for (let j = B - 1; j < M; j++) {
    if (dp[B - 1][j] === INF) continue;
    const c = dp[B - 1][j] + cost(B, candidates[j], duration);
    if (c < best) {
      best = c;
      bestLast = j;
    }
  }
  if (bestLast === -1) return null;

  const out: number[] = [];
  let j = bestLast;
  for (let k = B - 1; k >= 0; k--) {
    out.unshift(candidates[j]);
    j = from[k][j];
  }
  return out;
}

function measure(
  page: number,
  lines: string[],
): { at: number[]; note?: string } | null {
  const file = path.join(AUDIO_DIR, `p${page}.mp3`);
  if (!fs.existsSync(file)) return null;
  if (lines.length === 1) return { at: [0] };

  const duration = ffprobeDuration(file);
  const silences = detectSilences(file);

  // A line begins when speech resumes, i.e. at the END of a quiet stretch.
  // Ignore a leading silence at 0 — line 1 is pinned to 0 regardless.
  const candidates = silences
    .map((s) => s.end)
    .filter((t) => t > 0.05 && t < duration);

  const seated = alignLines(lines.map(weight), candidates, duration, silences);
  if (!seated) {
    return {
      at: [],
      note: `only ${candidates.length} usable silences for ${lines.length} lines`,
    };
  }

  const at = [0, ...seated].map((t) => Math.round(t * 100) / 100);
  for (let i = 1; i < at.length; i++) {
    if (at[i] <= at[i - 1])
      return { at: [], note: "boundaries not strictly increasing" };
  }
  return { at };
}

/* ------------------------------------------------------------------ */

const text = parsePageText(SLUG);
const recorded = [...getRecordedPages(SLUG)].sort((a, b) => a - b);
const committed = parseTimings(SLUG);

const results = new Map<number, number[]>();
const problems: string[] = [];
let exact = 0;
let compared = 0;
let worst = 0;

for (const page of recorded) {
  const lines = text.get(page);
  if (!lines) {
    problems.push(`p${page}: audio but no text`);
    continue;
  }
  const m = measure(page, lines);
  if (!m) continue;
  if (m.at.length === 0) {
    problems.push(`p${page}: ${m.note}`);
    continue;
  }
  if (m.at.length !== lines.length) {
    problems.push(
      `p${page}: got ${m.at.length} cues for ${lines.length} lines`,
    );
    continue;
  }
  results.set(page, m.at);

  const truth = committed.get(page);
  if (truth && truth.length === m.at.length) {
    const max = Math.max(...m.at.map((t, i) => Math.abs(t - truth[i])));
    compared++;
    if (max <= 0.02) exact++;
    worst = Math.max(worst, max);
    if (max > 0.02) {
      console.log(
        `p${page}  DRIFT ${max.toFixed(2)}s  measured [${m.at.join(", ")}]  committed [${truth.join(", ")}]`,
      );
    }
  } else {
    console.log(`p${page}  ${m.at.length} lines  [${m.at.join(", ")}]`);
  }
}

if (compared) {
  console.log(
    `\nGround truth: ${exact}/${compared} pages reproduce exactly, worst drift ${worst.toFixed(2)}s`,
  );
}

if (problems.length) {
  console.log(`\nSkipped (needs a human ear):`);
  for (const p of problems) console.log(`  ${p}`);
}

const proposed = [...results.keys()].filter((p) => !committed.has(p));
if (proposed.length) {
  console.log(
    `\n${proposed.length} page(s) above have audio but no committed cues. Roughly one in\nfour of these proposals is wrong, so check each by ear before pasting it\ninto ${path.relative(process.cwd(), TIMINGS)}. Until then those pages get a\nplain player, which is correct — not a gap to be filled in by guessing.`,
  );
}
