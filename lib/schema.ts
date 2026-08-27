import { z } from "zod";

/**
 * Schemas for book content parsed out of the hand-maintained markdown in
 * content/data/. These validate at build time so a malformed row fails the
 * build rather than shipping a broken page.
 *
 * Arabic strings are never normalised, trimmed of diacritics, or "cleaned".
 * A wrong vowel changes the word — see the book repo's CLAUDE.md.
 */

export const VocabEntrySchema = z.object({
  /** Position in the cumulative index (1-based, from the source table). */
  index: z.number().int().positive(),
  /** Fully vowelled Arabic, verbatim from source. */
  ar: z.string().min(1),
  /** English gloss, verbatim from source. */
  en: z.string().min(1),
  /** Page of first appearance. */
  page: z.number().int().positive(),
});

export const FamilyMemberSchema = z.object({
  ar: z.string().min(1),
  page: z.number().int().positive(),
});

export const RootFamilySchema = z.object({
  /** Three (or more) letters, space-separated, e.g. "ع ب د". */
  root: z.string().min(1),
  /** At least two — a one-member "family" isn't a family. */
  members: z.array(FamilyMemberSchema).min(2),
});

/**
 * Practice exercises for one page. See content/data/<slug>.exercises.yaml.
 *
 * Every Arabic string is resolved from the verified corpus rather than
 * typed; lib/parse.check.ts re-checks each token on every build.
 */
export const ExerciseSchema = z.discriminatedUnion("type", [
  /** Match each word to its meaning. Built at render time from the page's
   *  vocabulary, so it carries no content of its own. */
  z.object({ type: z.literal("match") }),

  /** Choose the word that finishes the sentence. `gap` indexes `sentence`. */
  z.object({
    type: z.literal("choose"),
    gap: z.number().int().nonnegative(),
    answer: z.string().min(1),
    sentence: z.array(z.string().min(1)).min(2),
    options: z.array(z.string().min(1)).min(2),
  }),

  /** Put the words in order. The words are shuffled for display. */
  z.object({
    type: z.literal("order"),
    answer: z.array(z.string().min(1)).min(3),
  }),

  /**
   * A comprehension question about the page: مَنْ كَسَرَ الْأَصْنَامَ؟ — four
   * answers, tap one.
   *
   * The only exercise that asks whether the child FOLLOWED THE STORY rather
   * than whether they remember a word. Everything else here tests vocabulary
   * or word order; a child can pass all of it having understood nothing.
   *
   * Modelled on the teacher's own revision slides, which ask exactly this and
   * in this form (مَنْ يَعْبُدُ الْأَصْنَامَ؟ / Who worshipped the idols?).
   * The English is shown beneath, because the question is about comprehension
   * and a child who cannot yet read the question cannot show what they
   * understood of the story.
   *
   * Every option is a word or phrase FROM THAT PAGE, so the corpus guard
   * applies unchanged — no carve-out, nothing relaxed.
   */
  z.object({
    type: z.literal("question"),
    ar: z.string().min(1),
    en: z.string().min(1),
    answer: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
  }),

  /**
   * Make a new sentence like this one. UNGRADED: every option produces a
   * valid sentence, which is the point — it is production practice, not a
   * test with a single right answer.
   */
  z.object({
    type: z.literal("pattern"),
    stem: z.array(z.string().min(1)).min(1),
    options: z
      .array(z.object({ ar: z.string().min(1), en: z.string().min(1) }))
      .min(2),
  }),
]);

export const ExercisePageSchema = z.object({
  page: z.number().int().positive(),
  exercises: z.array(ExerciseSchema).min(1),
});

export const ExercisesFileSchema = z.object({
  pages: z.array(ExercisePageSchema).min(1),
});

export const BookSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be url-safe lowercase"),
  title_en: z.string().min(1),
  title_ar: z.string().min(1),
  series: z.string().nullable(),
  series_order: z.number().int().positive().nullable(),
  page_count: z.number().int().positive(),
  age_range: z.string().min(1),
  /**
   * Where "Buy the book" points — the Amazon listing.
   *
   * EMPTY until the listing is live, and the landing page checks it: with no
   * URL the buy CTA is not rendered at all and the preview becomes the
   * primary action. That way the sales page can ship before the listing
   * exists without ever showing a button that goes nowhere. Filling this in
   * is the whole of "go live".
   */
  buy_url: z
    .union([z.string().url(), z.literal("")])
    .default(""),
  audio_status: z.enum(["none", "draft", "final"]),
  /** Pages that carry no story text (cover, contents, appendix). */
  non_story_pages: z.array(z.number().int().positive()).default([]),
  /**
   * Pages whose audio is a human recording, not synthetic TTS.
   *
   * AudioNote's synthetic-voice caveat is per-page true or false, never
   * per-book: a book can carry a mix (Yusuf's early pages re-recorded by
   * Marjan while later ones are still Fasih TTS), and showing the caveat on
   * a human recording is as wrong as omitting it from a synthetic one.
   */
  human_narrated_pages: z.array(z.number().int().positive()).default([]),
  /**
   * Sample pages for the marketing page — a taste, not the book.
   *
   * The website is a COMPANION: audio, vocabulary and word families belong
   * online, the full text does not (it would deter buying the book). The
   * cap of two is enforced here so this cannot quietly grow into a reader
   * one page at a time.
   */
  sample_pages: z
    .array(
      z.object({
        page: z.number().int().positive(),
        ar: z.array(z.string().min(1)).min(1),
        en: z.array(z.string().min(1)).min(1),
      }),
    )
    .max(
      2,
      "the site shows at most two sample pages — it is a companion, not the book",
    )
    .default([]),
  /**
   * How many pages of the book can be read on the site, from page 1.
   *
   * A PREVIEW, not the book. The site is a companion; the full text stays
   * in print. Raising this puts more of the product online — a commercial
   * decision, not a layout one.
   */
  preview_pages: z.number().int().positive().default(0),
  /**
   * Pages presented as a read-along: narration and the line currently being
   * read, over the page's animation where one exists and the page image
   * otherwise.
   *
   * `at` is the second each line begins, measured from the audio rather than
   * estimated. If the narration is ever re-recorded these must be measured
   * again — silently stale timings would highlight the wrong line, which
   * teaches the wrong word.
   *
   * Capped at two, for the same reason as `sample_pages`: this is a
   * companion, not the book. See ACCESS_MODEL.md in the book repo.
   */
  read_alongs: z
    .array(
      z.object({
        page: z.number().int().positive(),
        audio: z.string().min(1),
        /** The animation, where one has been made for this page. */
        video: z.string().min(1).optional(),
        poster: z.string().min(1).optional(),
        /**
         * Show this page's new words beside the text — the companion demo:
         * audio, text and vocabulary, which is what a reader gets for every
         * page. No artwork; the pictures stay in the book.
         */
        words: z.boolean().default(false),
        lines: z
          .array(
            z.object({
              at: z.number().nonnegative(),
              ar: z.string().min(1),
            }),
          )
          .min(1),
      }),
    )
    .max(2, "read-alongs are a sample — the site is a companion, not the book")
    .default([]),
});

export type Exercise = z.infer<typeof ExerciseSchema>;
export type ExercisePage = z.infer<typeof ExercisePageSchema>;
export type VocabEntry = z.infer<typeof VocabEntrySchema>;
export type FamilyMember = z.infer<typeof FamilyMemberSchema>;
export type RootFamily = z.infer<typeof RootFamilySchema>;
export type Book = z.infer<typeof BookSchema>;
