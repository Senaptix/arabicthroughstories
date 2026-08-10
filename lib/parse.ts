import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";
import {
  BookSchema,
  ExercisesFileSchema,
  RootFamilySchema,
  VocabEntrySchema,
  type Book,
  type Exercise,
  type RootFamily,
  type VocabEntry,
} from "./schema";

const CONTENT = path.join(process.cwd(), "content");

/* ------------------------------------------------------------------ *
 * Vocabulary
 * ------------------------------------------------------------------ */

/**
 * Rows look like:
 *   | 1 | قَرْيَةٌ | village | 3 |
 *
 * Some entries legitimately contain a slash for two forms of one word
 * (e.g. "صَنَمٌ / أَصْنَامٌ" — "idol/idols"). That is one entry, kept whole.
 */
const VOCAB_ROW = /^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(\d+)\s*\|/;

export function parseVocabulary(slug: string): VocabEntry[] {
  const file = path.join(CONTENT, "data", `${slug}.vocabulary.md`);
  const raw = fs.readFileSync(file, "utf8");

  const entries: VocabEntry[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const m = VOCAB_ROW.exec(line);
    if (!m) continue;
    entries.push(
      VocabEntrySchema.parse({
        index: Number(m[1]),
        ar: m[2],
        en: m[3],
        page: Number(m[4]),
      }),
    );
  }

  if (entries.length === 0) {
    throw new Error(`No vocabulary rows parsed from ${file}`);
  }

  // The source table is a numbered cumulative index. If the numbering has a
  // gap or repeat, a row was dropped or duplicated during editing — fail
  // loudly rather than quietly serving an incomplete glossary.
  entries.forEach((e, i) => {
    if (e.index !== i + 1) {
      throw new Error(
        `Vocabulary index discontinuity in ${slug}: expected ${i + 1}, got ${e.index} (${e.ar}). A row was likely dropped or duplicated.`,
      );
    }
  });

  return entries;
}

/* ------------------------------------------------------------------ *
 * Root families
 * ------------------------------------------------------------------ */

/**
 * ROOTS.md contains TWO tables and they are NOT interchangeable:
 *
 *   1. "The twelve for the printed appendix" — a curated subset whose middle
 *      column embeds page numbers inline ("سَلَامًا p18 · سَالِمٌ p18").
 *   2. "Full list — all families in Book 1" — every family, with words and
 *      pages in separate positionally-matched columns.
 *
 * The website deliberately shows the FULL list, not the printed twelve
 * (WEBSITE_PLAN.md). Parsing the wrong table yields malformed data that
 * still looks plausible, so the section heading is matched explicitly.
 */
const FULL_LIST_HEADING = /^##\s+Full list/i;
const NEXT_HEADING = /^##\s+/;
const FAMILY_ROW = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([\d,\s]+?)\s*\|/;

export function parseRootFamilies(slug: string): RootFamily[] {
  const file = path.join(CONTENT, "data", `${slug}.roots.md`);
  const raw = fs.readFileSync(file, "utf8");
  const lines = raw.split(/\r?\n/);

  const start = lines.findIndex((l) => FULL_LIST_HEADING.test(l));
  if (start === -1) {
    throw new Error(
      `Could not find the "## Full list" heading in ${file}. The website needs the full family table, not the printed twelve.`,
    );
  }

  const families: RootFamily[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (NEXT_HEADING.test(line)) break; // end of that section

    const m = FAMILY_ROW.exec(line);
    if (!m) continue;

    const root = m[1];
    if (/^-+$/.test(root) || root.toLowerCase() === "root") continue; // header/separator

    const words = m[2]
      .split("·")
      .map((w) => w.trim())
      .filter(Boolean);
    const pages = m[3]
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .map(Number);

    // Words and pages are matched by position. A length mismatch means the
    // source row is wrong and every pairing after the mismatch would be
    // silently misattributed — the worst kind of bug for a teaching text.
    if (words.length !== pages.length) {
      throw new Error(
        `Root family "${root}" in ${slug}: ${words.length} words but ${pages.length} pages. These are positionally matched and must be equal.`,
      );
    }

    families.push(
      RootFamilySchema.parse({
        root,
        members: words.map((ar, idx) => ({ ar, page: pages[idx] })),
      }),
    );
  }

  if (families.length === 0) {
    throw new Error(`No root families parsed from ${file}`);
  }

  return families;
}

/* ------------------------------------------------------------------ *
 * Page text
 * ------------------------------------------------------------------ */

/**
 * The Arabic body of each page, for reading along with the audio.
 *
 * Generated from the book repo — see the header of the .pages.md file. Not
 * every page is present: pages 5-18 live only in the Canva design and have
 * never been exported, so they legitimately have no entry. Callers must
 * handle a missing page rather than assume coverage.
 *
 * Arabic only. The English panel stays in the printed book.
 */
const PAGE_HEADING = /^##\s+Page\s+(\d+)\s*$/;
const PAGE_LINE = /^>\s?(.*)$/;

export function parsePageText(slug: string): Map<number, string[]> {
  const file = path.join(CONTENT, "data", `${slug}.pages.md`);
  if (!fs.existsSync(file)) return new Map();

  const out = new Map<number, string[]>();
  let current: number | null = null;

  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const h = PAGE_HEADING.exec(line);
    if (h) {
      current = Number(h[1]);
      out.set(current, []);
      continue;
    }
    if (current === null) continue;
    const q = PAGE_LINE.exec(line);
    if (!q) continue;
    const text = q[1].trim();
    if (text) out.get(current)!.push(text);
  }

  // A heading with no lines under it would render an empty page body — a
  // generation bug, not valid data.
  for (const [page, lines] of out) {
    if (lines.length === 0) {
      throw new Error(
        `Page ${page} in ${slug}.pages.md has a heading but no text.`,
      );
    }
  }

  return out;
}

/**
 * Where each line of a page starts in its recording, in seconds. Generated
 * by measuring the audio — see the header of the .timings.json file. Stale
 * timings highlight the wrong line, so these are regenerated whenever a clip
 * is re-recorded, never adjusted by hand.
 */
export function parseTimings(slug: string): Map<number, number[]> {
  const file = path.join(CONTENT, "data", `${slug}.timings.json`);
  if (!fs.existsSync(file)) return new Map();
  const raw: Record<string, number[]> = JSON.parse(
    fs.readFileSync(file, "utf8"),
  );
  return new Map(Object.entries(raw).map(([k, v]) => [Number(k), v]));
}

export type ReadAlongLines = {
  src: string;
  lines: { at: number; ar: string }[];
};

/**
 * The read-along for one page: its clip plus the line cues. Null unless the
 * page has audio, text, and one cue per line — a partial set would leave
 * lines that never highlight.
 */
export function getReadAlong(
  slug: string,
  page: number,
): ReadAlongLines | null {
  if (!getRecordedPages(slug).has(page)) return null;
  const text = parsePageText(slug).get(page);
  const at = parseTimings(slug).get(page);
  if (!text || !at || at.length !== text.length) return null;
  return {
    src: `${AUDIO_BASE}/audio/${slug}/p${page}.mp3`,
    lines: text.map((ar, i) => ({ at: at[i], ar })),
  };
}

/**
 * Practice exercises per page. Empty map when the book has no exercises
 * file yet — a book without them simply shows no practice link.
 */
export function parseExercises(slug: string): Map<number, Exercise[]> {
  const file = path.join(CONTENT, "data", `${slug}.exercises.yaml`);
  if (!fs.existsSync(file)) return new Map();
  const parsed = ExercisesFileSchema.parse(
    yaml.load(fs.readFileSync(file, "utf8")),
  );
  return new Map(parsed.pages.map((p) => [p.page, p.exercises]));
}

/**
 * Which pages have a recorded clip, read from disk rather than tracked in
 * config. Drop `p7.mp3` into public/audio/<slug>/ and page 7 lights up on
 * the next build — there is no list to forget to update.
 */
export function getRecordedPages(slug: string): Set<number> {
  const dir = path.join(process.cwd(), "public", "audio", slug);
  if (!fs.existsSync(dir)) return new Set();
  const pages = new Set<number>();
  for (const f of fs.readdirSync(dir)) {
    const m = /^p(\d+)\.mp3$/.exec(f);
    if (m) pages.add(Number(m[1]));
  }
  return pages;
}

/* ------------------------------------------------------------------ *
 * Books
 * ------------------------------------------------------------------ */

export function getBook(slug: string): Book {
  const file = path.join(CONTENT, "books", `${slug}.yaml`);
  return BookSchema.parse(yaml.load(fs.readFileSync(file, "utf8")));
}

export function getAllBooks(): Book[] {
  const dir = path.join(CONTENT, "books");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => getBook(path.basename(f, ".yaml")))
    .sort((a, b) => (a.series_order ?? 999) - (b.series_order ?? 999));
}

/* ------------------------------------------------------------------ *
 * Per-page views — what a QR scan actually needs
 * ------------------------------------------------------------------ */

export type PageContent = {
  book: Book;
  page: number;
  words: VocabEntry[];
  families: RootFamily[];
  audioSrc: string;
  /** Whether a clip actually exists on disk for this page. */
  hasAudio: boolean;
  /** The page's Arabic, or [] where the text has never been exported. */
  text: string[];
};

/**
 * Audio base is configurable so audio can move host (VPS → CDN → object
 * storage) without a code change. See WEBSITE_BUILD.md § Hosting.
 */
const AUDIO_BASE = process.env.NEXT_PUBLIC_AUDIO_BASE_URL ?? "";

export function getPageContent(slug: string, page: number): PageContent {
  const book = getBook(slug);
  const allWords = parseVocabulary(slug);
  const allFamilies = parseRootFamilies(slug);

  return {
    book,
    page,
    words: allWords.filter((w) => w.page === page),
    // A family belongs to this page if any of its members first appear here.
    families: allFamilies.filter((f) => f.members.some((m) => m.page === page)),
    audioSrc: `${AUDIO_BASE}/audio/${slug}/p${page}.mp3`,
    hasAudio: getRecordedPages(slug).has(page),
    text: parsePageText(slug).get(page) ?? [],
  };
}

/** Every page number that should get a route. */
export function getPageNumbers(book: Book): number[] {
  return Array.from({ length: book.page_count }, (_, i) => i + 1);
}
