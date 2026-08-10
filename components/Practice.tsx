"use client";

import { useMemo, useState } from "react";
import type { Exercise, VocabEntry } from "@/lib/schema";

/**
 * Practice exercises for one page, one at a time.
 *
 * Lives on its own route so the page text and vocabulary are NOT on screen
 * while exercising — otherwise every answer is visible above the question.
 *
 * Two interaction choices that matter for this audience:
 *  - Word ordering is TAP-to-place, not drag. Drag is unreliable for small
 *    hands on a phone, and RTL drag targets are a known source of bugs.
 *  - Arabic never moves. Feedback is a colour and border change on a
 *    settled glyph — vocalised Arabic in motion is unreadable, and the
 *    marks are the thing being taught (WEBSITE_DESIGN.md).
 *
 * No score is stored and there is no account, matching WEBSITE_PLAN.md's
 * rule that a page handed to a child has nothing extra to tap.
 */

type Props = {
  exercises: Exercise[];
  /** This page's vocabulary — the `match` exercise is built from it. */
  words: Pick<VocabEntry, "ar" | "en">[];
};

/** Deterministic shuffle: a seeded order, so the server and client agree
 *  and the words do not jump on hydration. */
function shuffled<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const ar = {
  fontFamily: "var(--font-arabic)",
  fontSize: "clamp(24px, 5vw, 30px)",
  lineHeight: 1.8,
} as const;

export default function Practice({ exercises, words }: Props) {
  const [step, setStep] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(false);
  /** Bumped on retry to reset every child exercise's internal state. */
  const [run, setRun] = useState(0);

  // `match` is built here so the YAML carries no duplicated vocabulary.
  const usable = useMemo(
    () => exercises.filter((e) => e.type !== "match" || words.length >= 2),
    [exercises, words.length],
  );

  const graded = usable.filter((e) => e.type !== "pattern").length;
  const done = step >= usable.length;

  function finish(wasCorrect: boolean) {
    setAnswered(true);
    if (wasCorrect) setCorrect((c) => c + 1);
  }

  function next() {
    setAnswered(false);
    setStep((s) => s + 1);
  }

  if (done) {
    return (
      <div className="border-ink/10 bg-surface/50 rounded-2xl border px-5 py-8 text-center">
        <p className="text-ink" style={{ fontSize: "18px", lineHeight: 1.5 }}>
          {correct} out of {graded}
        </p>
        <p
          className="text-ink/60 mt-2"
          style={{ fontSize: "15px", lineHeight: 1.6 }}
        >
          {correct === graded
            ? "Every one right."
            : "Try the ones you missed again."}
        </p>
        <button
          type="button"
          onClick={() => {
            setStep(0);
            setCorrect(0);
            setAnswered(false);
            setRun((r) => r + 1);
          }}
          className="bg-brand-blue text-paper mt-6 inline-flex min-h-[48px] items-center rounded-xl px-6 font-medium"
          style={{ fontSize: "16px" }}
        >
          Start again
        </button>
      </div>
    );
  }

  const ex = usable[step];

  return (
    <div>
      <p className="text-ink/55 mb-4" style={{ fontSize: "14px" }}>
        {step + 1} of {usable.length}
      </p>

      <div className="border-ink/10 bg-surface/50 rounded-2xl border px-5 py-5">
        {ex.type === "match" && (
          <Match
            key={`${run}-${step}`}
            words={words.slice(0, 5)}
            seed={step + 1}
            onDone={finish}
            answered={answered}
          />
        )}
        {ex.type === "choose" && (
          <Choose
            key={`${run}-${step}`}
            ex={ex}
            seed={step + 1}
            onDone={finish}
            answered={answered}
          />
        )}
        {ex.type === "order" && (
          <Order
            key={`${run}-${step}`}
            ex={ex}
            seed={step + 1}
            onDone={finish}
            answered={answered}
          />
        )}
        {ex.type === "pattern" && (
          <Pattern
            key={`${run}-${step}`}
            ex={ex}
            onDone={() => setAnswered(true)}
          />
        )}
      </div>

      {answered && (
        <button
          type="button"
          onClick={next}
          className="bg-brand-blue text-paper mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-6 font-medium"
          style={{ fontSize: "16px" }}
        >
          {step + 1 === usable.length ? "See how you did" : "Next"}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Prompt({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-ink mb-4 font-medium"
      style={{ fontSize: "16px", lineHeight: 1.5 }}
    >
      {children}
    </p>
  );
}

/** Shared option-button styling: neutral, then right/wrong once answered. */
function optionClass(state: "idle" | "right" | "wrong") {
  const base =
    "inline-flex min-h-[48px] items-center justify-center rounded-xl border px-4 py-2 text-center transition-colors duration-150 ease-out";
  if (state === "right")
    return `${base} border-brand-blue bg-brand-blue/15 text-ink`;
  if (state === "wrong")
    return `${base} border-terracotta bg-terracotta/10 text-ink`;
  return `${base} border-ink/15 bg-paper text-ink hover:border-ink/35`;
}

function Match({
  words,
  seed,
  onDone,
  answered,
}: {
  words: Pick<VocabEntry, "ar" | "en">[];
  seed: number;
  onDone: (ok: boolean) => void;
  answered: boolean;
}) {
  const shuffledEn = useMemo(() => shuffled(words, seed), [words, seed]);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);

  const allMatched = words.every((w) => picked[w.ar] !== undefined);
  const allRight = words.every((w) => picked[w.ar] === w.en);

  function pickEn(en: string) {
    if (answered || !active) return;
    const nextPicked = { ...picked, [active]: en };
    setPicked(nextPicked);
    setActive(null);
    if (words.every((w) => nextPicked[w.ar] !== undefined)) {
      onDone(words.every((w) => nextPicked[w.ar] === w.en));
    }
  }

  return (
    <div>
      <Prompt>Match each word to its meaning.</Prompt>
      <div className="flex flex-col gap-2">
        {words.map((w) => {
          const chosen = picked[w.ar];
          const state = !answered
            ? "idle"
            : chosen === w.en
              ? "right"
              : "wrong";
          return (
            <button
              key={w.ar}
              type="button"
              onClick={() =>
                !answered && setActive(active === w.ar ? null : w.ar)
              }
              className={`${optionClass(state)} w-full justify-between gap-3 ${
                active === w.ar ? "ring-brand-blue ring-2" : ""
              }`}
            >
              <span lang="ar" dir="rtl" style={ar}>
                {w.ar}
              </span>
              <span className="text-ink/60" style={{ fontSize: "14px" }}>
                {chosen ?? "—"}
              </span>
            </button>
          );
        })}
      </div>

      {!allMatched && (
        <div className="mt-4 flex flex-wrap gap-2">
          {shuffledEn
            .filter((w) => !Object.values(picked).includes(w.en))
            .map((w) => (
              <button
                key={w.en}
                type="button"
                disabled={!active}
                onClick={() => pickEn(w.en)}
                className={`${optionClass("idle")} disabled:opacity-40`}
                style={{ fontSize: "14px" }}
              >
                {w.en}
              </button>
            ))}
        </div>
      )}

      {!allMatched && !active && (
        <p className="text-ink/50 mt-3" style={{ fontSize: "13px" }}>
          Tap an Arabic word first, then its meaning.
        </p>
      )}
      {answered && !allRight && (
        <p
          className="text-ink/70 mt-4"
          style={{ fontSize: "14px", lineHeight: 1.6 }}
        >
          The right pairs: {words.map((w) => `${w.ar} = ${w.en}`).join(" · ")}
        </p>
      )}
    </div>
  );
}

function Choose({
  ex,
  seed,
  onDone,
  answered,
}: {
  ex: Extract<Exercise, { type: "choose" }>;
  seed: number;
  onDone: (ok: boolean) => void;
  answered: boolean;
}) {
  const options = useMemo(() => shuffled(ex.options, seed), [ex.options, seed]);
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div>
      <Prompt>Choose the word that finishes the sentence.</Prompt>

      <p
        lang="ar"
        dir="rtl"
        style={{ ...ar, textAlign: "start" }}
        className="mb-5"
      >
        {ex.sentence.map((w, i) =>
          i === ex.gap ? (
            <span
              key={i}
              className={
                picked
                  ? "border-b-2 border-brand-blue"
                  : "border-ink/30 border-b-2 border-dashed"
              }
            >
              {picked ?? "     "}{" "}
            </span>
          ) : (
            <span key={i}>{w} </span>
          ),
        )}
      </p>

      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const state = !answered
            ? "idle"
            : o === ex.answer
              ? "right"
              : o === picked
                ? "wrong"
                : "idle";
          return (
            <button
              key={o}
              type="button"
              disabled={answered}
              onClick={() => {
                setPicked(o);
                onDone(o === ex.answer);
              }}
              className={optionClass(state)}
            >
              <span lang="ar" dir="rtl" style={ar}>
                {o}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Order({
  ex,
  seed,
  onDone,
  answered,
}: {
  ex: Extract<Exercise, { type: "order" }>;
  seed: number;
  onDone: (ok: boolean) => void;
  answered: boolean;
}) {
  const pool = useMemo(
    () =>
      shuffled(
        ex.answer.map((w, i) => ({ w, i })),
        seed,
      ),
    [ex.answer, seed],
  );
  const [placed, setPlaced] = useState<{ w: string; i: number }[]>([]);

  const remaining = pool.filter((p) => !placed.some((q) => q.i === p.i));
  const isRight = placed.map((p) => p.w).join(" ") === ex.answer.join(" ");

  return (
    <div>
      <Prompt>Put the words in order.</Prompt>

      {/* The answer line reads right-to-left, like the sentence it builds. */}
      <div
        dir="rtl"
        className="border-ink/15 bg-paper mb-4 flex min-h-[64px] flex-wrap items-center gap-2 rounded-xl border border-dashed px-3 py-2"
      >
        {placed.length === 0 && (
          <span className="text-ink/40" style={{ fontSize: "14px" }}>
            Tap the words below, in order
          </span>
        )}
        {placed.map((p) => (
          <button
            key={p.i}
            type="button"
            disabled={answered}
            onClick={() => setPlaced((cur) => cur.filter((q) => q.i !== p.i))}
            className={optionClass(
              !answered ? "idle" : isRight ? "right" : "wrong",
            )}
          >
            <span lang="ar" dir="rtl" style={ar}>
              {p.w}
            </span>
          </button>
        ))}
      </div>

      <div dir="rtl" className="flex flex-wrap gap-2">
        {remaining.map((p) => (
          <button
            key={p.i}
            type="button"
            disabled={answered}
            onClick={() => setPlaced((cur) => [...cur, p])}
            className={optionClass("idle")}
          >
            <span lang="ar" dir="rtl" style={ar}>
              {p.w}
            </span>
          </button>
        ))}
      </div>

      {remaining.length === 0 && !answered && (
        <button
          type="button"
          onClick={() => onDone(isRight)}
          className="border-brand-blue text-brand-blue mt-4 inline-flex min-h-[48px] items-center rounded-xl border px-5 font-medium"
          style={{ fontSize: "15px" }}
        >
          Check
        </button>
      )}

      {answered && !isRight && (
        <p
          lang="ar"
          dir="rtl"
          className="text-ink/70 mt-4"
          style={{ ...ar, textAlign: "start" }}
        >
          {ex.answer.join(" ")}
        </p>
      )}
    </div>
  );
}

function Pattern({
  ex,
  onDone,
}: {
  ex: Extract<Exercise, { type: "pattern" }>;
  onDone: () => void;
}) {
  const [picked, setPicked] = useState<{ ar: string; en: string } | null>(null);

  return (
    <div>
      <Prompt>Make a new sentence. Pick a word to finish it.</Prompt>

      <p
        lang="ar"
        dir="rtl"
        style={{ ...ar, textAlign: "start" }}
        className="mb-5"
      >
        {ex.stem.join(" ")}{" "}
        <span
          className={
            picked
              ? "border-brand-blue border-b-2"
              : "border-ink/30 border-b-2 border-dashed"
          }
        >
          {picked?.ar ?? "     "}
        </span>
      </p>

      <div className="flex flex-wrap gap-2">
        {ex.options.map((o) => (
          <button
            key={o.ar}
            type="button"
            onClick={() => {
              setPicked(o);
              onDone();
            }}
            className={optionClass(picked?.ar === o.ar ? "right" : "idle")}
          >
            <span lang="ar" dir="rtl" style={ar}>
              {o.ar}
            </span>
          </button>
        ))}
      </div>

      {picked && (
        <p
          className="text-ink/70 mt-4"
          style={{ fontSize: "15px", lineHeight: 1.6 }}
        >
          You made a sentence meaning &ldquo;{picked.en}&rdquo;. Every one of
          these works — try another.
        </p>
      )}
    </div>
  );
}
