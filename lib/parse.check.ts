/**
 * Smallest check that fails if the parsers stop matching the source data.
 * Run: npx tsx lib/parse.check.ts
 *
 * Not a test framework — asserts only. The build already exercises the happy
 * path; this catches the failure the build cannot see, which is Arabic that
 * parses successfully but comes out altered.
 *
 * EVERY BOOK IS CHECKED, not just the first one. `getAllBooks()` enumerates
 * content/books, and `generateStaticParams` builds a route for each, so a
 * second book that skipped these guards would ship unvalidated Arabic to a
 * live route. The generic checks below run per book; the handful that name a
 * specific string or root family are kept apart at the bottom, because they
 * assert facts about one book rather than rules about all of them.
 */
import assert from "node:assert/strict";
import {
  getAllBooks,
  getBook,
  getRecordedPages,
  parseExercises,
  parsePageText,
  parseRootFamilies,
  parseVocabulary,
} from "./parse";
import type { Book } from "./schema";

/** Trailing punctuation is not part of the word. */
const bare = (s: string) =>
  s
    // Ornate Qur'an brackets sit flush against the first and last word of a
    // quoted span (`﴿مَنْ`, `بِآلِهَتِنَا﴾`). Without stripping them those
    // arrive as distinct corpus entries, which both pollutes the corpus and
    // weakens the guard: an exercise containing the invented token `﴿مَنْ`
    // would otherwise pass.
    .replace(/[﴾﴿]/gu, "")
    .replace(/[.،:؟!]+$/u, "")
    .trim();

/** `[الْأَنْبِيَاء: ٥٩]` — a reference, not words of the story. */
const CITATION = /\[[^\]]*\]/gu;

function checkBook(book: Book): number {
  const slug = book.slug;
  const at = (s: string) => `${slug}: ${s}`;

  // The site is a companion, not the book. The schema caps sample pages at
  // two; this is the check that someone noticing the cap can't just raise it
  // without tripping a second guard.
  assert.ok(
    book.sample_pages.length <= 2,
    at("the site must not host more than two sample pages"),
  );

  // The landing page joins roots to vocabulary by exact Arabic string. If
  // those two files drift, the page throws at build time — check it here.
  const vocab = parseVocabulary(slug);
  for (const family of parseRootFamilies(slug)) {
    for (const m of family.members) {
      assert.ok(
        vocab.some((v) => v.ar === m.ar),
        at(`${m.ar} is in root family "${family.root}" but not in the vocabulary index`),
      );
    }
  }

  // Page text: every story page must have some, or a page card renders a
  // player with nothing to read along to. Which pages are story pages comes
  // from the book's own record rather than a hardcoded range, so a book of a
  // different length is checked just as strictly.
  const pageText = parsePageText(slug);
  for (let n = 1; n <= book.page_count; n++) {
    if (book.non_story_pages.includes(n)) continue;
    assert.ok(pageText.has(n), at(`page ${n} has no text in ${slug}.pages.md`));
    assert.ok(pageText.get(n)!.length > 0, at(`page ${n} text is empty`));
  }

  // Nothing may claim to be a page the book does not have.
  for (const n of pageText.keys()) {
    assert.ok(
      n >= 1 && n <= book.page_count,
      at(`${slug}.pages.md has page ${n}, outside the book's ${book.page_count} pages`),
    );
  }

  // The page text and the read-along must be the same words. They come from
  // different files, so drift between them would show a child one thing on
  // the page card and another in the read-along.
  for (const r of book.read_alongs) {
    const strip = (s: string[]) => s.join("").replace(/\s+/g, "");
    assert.ok(
      pageText.has(r.page),
      at(`read-along exists for page ${r.page} but no page text does`),
    );
    assert.equal(
      strip(pageText.get(r.page)!),
      strip(r.lines.map((l) => l.ar)),
      at(`page ${r.page}: page text and read-along text have drifted apart`),
    );
  }

  // Every recorded clip must correspond to a page that has text.
  for (const n of getRecordedPages(slug)) {
    assert.ok(pageText.has(n), at(`audio exists for page ${n} but no text does`));
  }

  /* ---------------------------------------------------------------- *
   * Exercises — the corpus guard
   *
   * Exercise Arabic is the only Arabic on the site that was composed
   * rather than copied wholesale from a source file: a blank is a
   * sentence minus a word, a pattern exercise recombines verified words
   * into a new sentence. This asserts every token still exists in the
   * verified corpus, so a typo or an invented word fails the build.
   *
   * NOTE what this does and does not prove. It proves each WORD is real
   * and correctly spelled, including its vowel marks. It does NOT prove a
   * new COMBINATION is grammatically correct — a case ending that is right
   * in isolation can be wrong in a new position. The `pattern` exercises
   * still need a native read. The guard is a floor, not a substitute for
   * review.
   * ---------------------------------------------------------------- */

  const corpus = new Set<string>();

  /* The conjunction وَ is a proclitic, not part of the word it attaches to:
   * the book writing `وَكَانَتْ` means it uses `كَانَتْ`. Admitting both forms
   * matters for grammar, not just convenience — a question opening with `مَنْ`
   * takes no conjunction, and without this the only waw-less form in the
   * corpus may be one carrying a kasra that is correct solely because of the
   * word that followed it in the book (`كَانَتِ النَّارُ`). That is how page 41
   * came to ask `مَنْ كَانَتِ تَبْحَثُ`, breaking the sukūn on تاء التأنيث.
   *
   * The cost: for a word whose first root letter is waw (`وَلَدٌ`), this also
   * admits a meaningless remainder (`لَدٌ`). Junk entries only ever widen the
   * corpus, and the guard is a floor rather than a native read either way. */
  const add = (t: string) => {
    if (!t) return;
    corpus.add(t);
    if (t.startsWith("وَ") && t.length > 2) corpus.add(t.slice(2));
  };

  for (const lines of pageText.values()) {
    for (const line of lines)
      for (const w of line.replace(CITATION, " ").split(/\s+/)) add(bare(w));
  }
  for (const v of vocab) for (const w of v.ar.split(/\s+/)) add(bare(w));

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

  const exercises = parseExercises(slug);
  for (const [page, list] of exercises) {
    assert.ok(
      pageText.has(page),
      at(`exercises exist for page ${page} but no text does`),
    );

    for (const ex of list) {
      const where = at(`page ${page} ${ex.type}`);
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
      if (ex.type === "question") {
        // The question text and every option are Arabic drawn from the page,
        // so they go through the same corpus guard as everything else. The
        // English gloss is not Arabic and is not checked.
        assertInCorpus(ex.ar, where);
        for (const o of ex.options) assertInCorpus(o, where);
        assert.ok(
          ex.options.includes(ex.answer),
          `${where}: the answer is not among its own options`,
        );
        assert.equal(
          new Set(ex.options).size,
          ex.options.length,
          `${where}: duplicate options make more than one answer correct`,
        );
        // A question whose answer is not on the page it belongs to is either
        // mis-filed or unanswerable from what the child just read.
        const pageWords = new Set(
          (pageText.get(page) ?? [])
            .flatMap((l) => l.replace(CITATION, " ").split(/\s+/))
            .map(bare)
            .filter(Boolean),
        );
        for (const w of ex.answer.split(/\s+/)) {
          const t = bare(w);
          if (!t) continue;
          assert.ok(
            pageWords.has(t),
            `${where}: the answer "${ex.answer}" uses "${t}", which is not on page ${page}. A comprehension question must be answerable from its own page.`,
          );
        }
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
    `  ${slug}: ${book.page_count} pages, ${vocab.length} words, ` +
      `${corpus.size} corpus tokens, ${exercises.size} pages of exercises`,
  );
  return corpus.size;
}

/* ------------------------------------------------------------------ *
 * Every book
 * ------------------------------------------------------------------ */

const books = getAllBooks();
assert.ok(books.length > 0, "no books found in content/books");
for (const book of books) checkBook(book);

/* ------------------------------------------------------------------ *
 * Book-specific spot checks
 *
 * These name one exact string and one exact root family. They are facts
 * about Ibrahim rather than rules about books, so they live apart from the
 * generic pass and are skipped when that book is absent. Add an equivalent
 * block per book rather than weakening these into something generic — the
 * whole point is that they are literal.
 * ------------------------------------------------------------------ */

if (books.some((b) => b.slug === "ibrahim")) {
  const ibrahim = getBook("ibrahim");
  const sample = ibrahim.sample_pages[0];
  assert.ok(sample, "ibrahim has no sample page");

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

  // The landing page is built around this family and throws without it.
  const sajada = parseRootFamilies("ibrahim").find((f) => f.root === "س ج د");
  assert.ok(sajada, "س ج د family missing from ibrahim.roots.md");

  assert.ok(parseExercises("ibrahim").size > 0, "ibrahim has no exercises");
}

console.log(`parse checks passed for ${books.length} book(s)`);
