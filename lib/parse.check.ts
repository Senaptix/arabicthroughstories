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

console.log("parse checks passed");
