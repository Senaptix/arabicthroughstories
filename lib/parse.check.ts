/**
 * Smallest check that fails if the parsers stop matching the source data.
 * Run: npx tsx lib/parse.check.ts
 *
 * Not a test framework — asserts only. The build already exercises the happy
 * path; this catches the failure the build cannot see, which is Arabic that
 * parses successfully but comes out altered.
 */
import assert from "node:assert/strict";
import { getBook, parseRootFamilies, parseVocabulary } from "./parse";

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

console.log("parse checks passed");
