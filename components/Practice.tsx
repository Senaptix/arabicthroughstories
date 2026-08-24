"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  /** Present on a real book route. Omitted by the signed-out landing demo. */
  bookSlug?: string;
  page?: number;
  /**
   * The next story page, or null at the end of the book.
   *
   * Without this the results screen was a dead end: a child finished every
   * exercise and the only thing to press was "Start again", so the reward for
   * getting them all right was doing them again. Carrying on is the thing they
   * actually want, so it is the primary action.
   */
  nextPage?: number | null;
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

/** What each exercise is called on the results list. */
const TYPE_LABEL = {
  match: "Match the words",
  choose: "Finish the sentence",
  order: "Put the words in order",
  pattern: "Make a new sentence",
} as const;

export default function Practice({ exercises, words, bookSlug, page, nextPage }: Props) {
  const [step, setStep] = useState(0);
  /** Per exercise: true right, false wrong, undefined not answered yet.
   *  Indexed by step, so a single one can be retried without losing the
   *  others — which is the point of the results list. */
  const [results, setResults] = useState<(boolean | undefined)[]>([]);
  const [answered, setAnswered] = useState(false);
  /** Bumped on retry to reset every child exercise's internal state. */
  const [run, setRun] = useState(0);
  /** Set while re-doing ONE exercise from the results list, so finishing it
   *  goes back to the results rather than marching on through the rest. */
  const [retryOf, setRetryOf] = useState<number | null>(null);

  // `match` is built here so the YAML carries no duplicated vocabulary.
  const usable = useMemo(
    () => exercises.filter((e) => e.type !== "match" || words.length >= 2),
    [exercises, words.length],
  );

  const isGraded = (i: number) => usable[i].type !== "pattern";
  const graded = usable.filter((_, i) => isGraded(i)).length;
  const correct = usable.filter(
    (_, i) => isGraded(i) && results[i] === true,
  ).length;
  const wrong = usable.filter((_, i) => isGraded(i) && results[i] === false);
  const done = step >= usable.length;
  const savedResult = useRef<string | null>(null);
  const [progressSaved, setProgressSaved] = useState(false);

  useEffect(() => {
    if (!done || !bookSlug || !page) return;
    const signature = `${correct}/${graded}`;
    if (savedResult.current === signature) return;
    savedResult.current = signature;
    fetch("/api/progress/practice", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bookSlug, page, correct, total: graded }),
    })
      .then((response) => response.ok && setProgressSaved(true))
      .catch(() => undefined);
  }, [bookSlug, correct, done, graded, page]);

  function record(i: number, wasCorrect: boolean | undefined) {
    setResults((r) => {
      const next = [...r];
      next[i] = wasCorrect;
      return next;
    });
    setAnswered(true);
  }

  function next() {
    setAnswered(false);
    if (retryOf !== null) {
      setRetryOf(null);
      setStep(usable.length); // straight back to the results
    } else {
      setStep((s) => s + 1);
    }
  }

  function retry(i: number) {
    setResults((r) => {
      const copy = [...r];
      copy[i] = undefined;
      return copy;
    });
    setAnswered(false);
    setRetryOf(i);
    setStep(i);
    setRun((r) => r + 1); // reset that exercise's own internal state
    setProgressSaved(false);
  }

  function restart() {
    setStep(0);
    setResults([]);
    setAnswered(false);
    setRetryOf(null);
    setRun((r) => r + 1);
    setProgressSaved(false);
  }

  if (done) {
    return (
      <div className="border-ink/10 bg-surface/50 rounded-2xl border px-5 py-6">
        <p
          className="text-ink text-center font-medium"
          style={{ fontSize: "18px", lineHeight: 1.5 }}
        >
          {correct} out of {graded} right
        </p>
        <p
          className="text-ink/60 mt-2 text-center"
          style={{ fontSize: "15px", lineHeight: 1.6 }}
        >
          {wrong.length === 0
            ? "Every one right."
            : "Tap “Try again” on any you want another go at."}
        </p>
        {progressSaved && (
          <p className="text-brand-blue mt-2 text-center text-[13px]">
            Practice saved ✓
          </p>
        )}

        {/* Every exercise is listed, including the ungraded one. Leaving it
            out is what made the score look wrong — four exercises, then a
            total out of three with nothing explaining the difference. */}
        <ul className="mt-6 flex flex-col gap-2">
          {usable.map((ex, i) => {
            const state = !isGraded(i)
              ? "ungraded"
              : results[i] === true
                ? "right"
                : results[i] === false
                  ? "wrong"
                  : "unanswered";
            return (
              <li
                key={i}
                className="border-ink/10 bg-paper flex items-center gap-3 rounded-xl border px-3 py-2"
              >
                <span
                  aria-hidden="true"
                  className={
                    state === "right"
                      ? "text-brand-blue"
                      : state === "wrong"
                        ? "text-terracotta"
                        : "text-ink/35"
                  }
                  style={{ fontSize: "17px", lineHeight: 1 }}
                >
                  {state === "right" ? "✓" : state === "wrong" ? "✗" : "•"}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className="text-ink block"
                    style={{ fontSize: "15px", lineHeight: 1.4 }}
                  >
                    {TYPE_LABEL[ex.type]}
                  </span>
                  {state === "ungraded" && (
                    <span
                      className="text-ink/50 block"
                      style={{ fontSize: "13px", lineHeight: 1.4 }}
                    >
                      not scored — every answer makes a good sentence
                    </span>
                  )}
                </span>

                {state === "wrong" && (
                  <button
                    type="button"
                    onClick={() => retry(i)}
                    className="border-brand-blue text-brand-blue inline-flex min-h-[44px] shrink-0 items-center rounded-lg border px-3 font-medium"
                    style={{ fontSize: "14px" }}
                  >
                    Try again
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {/* Carrying on is the primary action, not repeating. "Start again"
            was the only button here, which made finishing feel like a loop. */}
        {bookSlug && nextPage ? (
          <div className="mt-6 flex flex-col gap-2">
            <a
              href={`/books/${bookSlug}/p${nextPage}`}
              className="bg-brand-blue text-paper inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-6 font-medium"
              style={{ fontSize: "16px" }}
            >
              Go to page {nextPage} →
            </a>
            <button
              type="button"
              onClick={restart}
              className="border-ink/15 text-ink/70 hover:border-ink/35 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border px-6 font-medium transition-colors"
              style={{ fontSize: "16px" }}
            >
              Start again
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={restart}
            className="bg-brand-blue text-paper mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-6 font-medium"
            style={{ fontSize: "16px" }}
          >
            Start again
          </button>
        )}
      </div>
    );
  }

  const ex = usable[step];

  return (
    <div>
      <p className="text-ink/55 mb-4" style={{ fontSize: "14px" }}>
        {retryOf !== null
          ? `Another go at ${TYPE_LABEL[ex.type].toLowerCase()}`
          : `${step + 1} of ${usable.length}`}
      </p>

      <div className="border-ink/10 bg-surface/50 rounded-2xl border px-5 py-5">
        {ex.type === "match" && (
          <Match
            key={`${run}-${step}`}
            words={words.slice(0, 5)}
            seed={step + 1}
            onDone={(ok) => record(step, ok)}
            answered={answered}
          />
        )}
        {ex.type === "choose" && (
          <Choose
            key={`${run}-${step}`}
            ex={ex}
            seed={step + 1}
            onDone={(ok) => record(step, ok)}
            answered={answered}
          />
        )}
        {ex.type === "order" && (
          <Order
            key={`${run}-${step}`}
            ex={ex}
            seed={step + 1}
            onDone={(ok) => record(step, ok)}
            answered={answered}
          />
        )}
        {ex.type === "pattern" && (
          /* undefined, not false: this one has no wrong answer, and the
             results list says so rather than quietly leaving it out. */
          <Pattern
            key={`${run}-${step}`}
            ex={ex}
            onDone={() => record(step, undefined)}
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
          {retryOf !== null
            ? "Back to results"
            : step + 1 === usable.length
              ? "See how you did"
              : "Next"}
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
