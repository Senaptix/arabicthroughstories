/**
 * Smallest check that fails if the parsers stop matching the source data.
 * Run: npx tsx lib/parse.check.ts
 *
 * Not a test framework — asserts only. The build already exercises the happy
 * path; this catches the failure the build cannot see, which is Arabic that
 * parses successfully but comes out altered.
 */
import assert from "node:assert/strict";
import {
  getBook,
  getRecordedPages,
  parseExercises,
  parsePageText,
  parseRootFamilies,
  parseVocabulary,
} from "./parse";

const book = getBook("ibrahim");

// The site is a companion, not the book. The schema caps sample pages at two;
// this is the check that someone noticing the cap can't just raise it without
// tripping a second guard.
assert.ok(
  book.sample_pages.length <= 2,
  "the site must not host more than two sample pages",
);

const sample = book.sample_pages[0];

// Byte-identical to the book repo's manuscript. Any normalisation, trimming
// of marks, or encoding slip changes the word — the one bug that must never
// ship in a book that teaches vowels.
assert.equal(
  sample.ar[sample.ar.length - 1],
  "قَالَتْ هَاجَرُ: إِذًا لَا يُضَيِّعُنَا!",
  "sample Arabic altered somewhere between the manuscript and the yaml",
);
assert.equal(sample.ar.length, 6);
assert.equal(sample.en.length, 6);

// The landing page joins roots to vocabulary by exact Arabic string. If those
// two files drift, the page throws at build time — check it here instead.
const vocab = parseVocabulary("ibrahim");
const sajada = parseRootFamilies("ibrahim").find((f) => f.root === "س ج د");
assert.ok(sajada, "س ج د family missing");
for (const m of sajada.members) {
  assert.ok(
    vocab.some((v) => v.ar === m.ar),
    `${m.ar} is in a root family but not in the vocabulary index`,
  );
}

// Page text: every story page must have some, or a page card renders a
// player with nothing to read along to.
const pageText = parsePageText("ibrahim");
for (let n = 3; n <= 52; n++) {
  assert.ok(pageText.has(n), `page ${n} has no text in ibrahim.pages.md`);
  assert.ok(pageText.get(n)!.length > 0, `page ${n} text is empty`);
}

// The page text and the read-along must be the same words. They come from
// different files, so drift between them would show a child one thing on
// the page card and another in the read-along.
for (const r of book.read_alongs) {
  const strip = (s: string[]) => s.join("").replace(/\s+/g, "");
  assert.equal(
    strip(pageText.get(r.page)!),
    strip(r.lines.map((l) => l.ar)),
    `page ${r.page}: page text and read-along text have drifted apart`,
  );
}

// Every recorded clip must correspond to a page that has text.
for (const n of getRecordedPages("ibrahim")) {
  assert.ok(pageText.has(n), `audio exists for page ${n} but no text does`);
}

/* ------------------------------------------------------------------ *
 * Exercises — the corpus guard
 *
 * Exercise Arabic is the only Arabic on the site that was composed rather
 * than copied wholesale from a source file: a blank is a sentence minus a
 * word, a pattern exercise recombines verified words into a new sentence.
 * This asserts every token still exists in the verified corpus, so a typo
 * or an invented word fails the build.
 *
 * NOTE what this does and does not prove. It proves each WORD is real and
 * correctly spelled, including its vowel marks. It does NOT prove a new
 * COMBINATION is grammatically correct — a case ending that is right in
 * isolation can be wrong in a new position. The `pattern` exercises still
 * need a native read. The guard is a floor, not a substitute for review.
 * ------------------------------------------------------------------ */

/** Trailing punctuation is not part of the word. */
const bare = (s: string) => s.replace(/[.،:؟!]+$/u, "").trim();

const corpus = new Set<string>();
for (const lines of parsePageText("ibrahim").values()) {
  for (const line of lines)
    for (const w of line.split(/\s+/)) corpus.add(bare(w));
}
for (const v of vocab) for (const w of v.ar.split(/\s+/)) corpus.add(bare(w));

const exercises = parseExercises("ibrahim");
assert.ok(exercises.size > 0, "no exercises parsed");

function assertInCorpus(s: string, where: string) {
  for (const w of s.split(/\s+/)) {
    const t = bare(w);
    if (!t) continue;
    assert.ok(
      corpus.has(t),
      `${where}: "${t}" is not in the verified corpus (pages.md / vocabulary.md). ` +
        `Exercise Arabic must be drawn from words the book actually uses.`,
    );
  }
}

for (const [page, list] of exercises) {
  assert.ok(
    pageText.has(page),
    `exercises exist for page ${page} but no text does`,
  );

  for (const ex of list) {
    const where = `page ${page} ${ex.type}`;
    if (ex.type === "choose") {
      for (const w of ex.sentence) assertInCorpus(w, where);
      for (const o of ex.options) assertInCorpus(o, where);
      assert.ok(
        ex.options.includes(ex.answer),
        `${where}: the answer is not among its own options`,
      );
      assert.ok(
        ex.gap < ex.sentence.length,
        `${where}: gap ${ex.gap} is past the end of the sentence`,
      );
      assert.equal(
        bare(ex.sentence[ex.gap]),
        ex.answer,
        `${where}: the answer does not match the word it replaces`,
      );
      assert.equal(
        new Set(ex.options).size,
        ex.options.length,
        `${where}: duplicate options make more than one answer correct`,
      );
    }
    if (ex.type === "order") {
      for (const w of ex.answer) assertInCorpus(w, where);
      // Must be a real line of that page, or the "correct" order is invented.
      assert.ok(
        pageText.get(page)!.some((l) => l === ex.answer.join(" ")),
        `${where}: the answer is not a line of page ${page}`,
      );
    }
    if (ex.type === "pattern") {
      for (const w of ex.stem) assertInCorpus(w, where);
      for (const o of ex.options) assertInCorpus(o.ar, where);
      assert.equal(
        new Set(ex.options.map((o) => o.ar)).size,
        ex.options.length,
        `${where}: duplicate options`,
      );
    }
  }
}

console.log(
  `parse checks passed (${exercises.size} pages of exercises, ` +
    `${corpus.size} corpus words)`,
);
