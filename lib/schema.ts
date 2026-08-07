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

export const BookSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be url-safe lowercase"),
  title_en: z.string().min(1),
  title_ar: z.string().min(1),
  series: z.string().nullable(),
  series_order: z.number().int().positive().nullable(),
  page_count: z.number().int().positive(),
  age_range: z.string().min(1),
  /** Graded-vowelling level — see SERIES_PLAN.md in the book repo. */
  vowelling: z.enum(["full", "mostly", "partial", "minimal", "natural"]),
  audio_status: z.enum(["none", "draft", "final"]),
  /** Pages that carry no story text (cover, contents, appendix). */
  non_story_pages: z.array(z.number().int().positive()).default([]),
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
    .max(2, "the site shows at most two sample pages — it is a companion, not the book")
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
   * One page presented as a read-along: narration, the animation for that
   * page, and the line currently being read.
   *
   * `at` is the second each line begins, measured from the audio rather than
   * estimated. If the narration is ever re-recorded these must be measured
   * again — silently stale timings would highlight the wrong line, which
   * teaches the wrong word.
   */
  read_along: z
    .object({
      page: z.number().int().positive(),
      video: z.string().min(1),
      poster: z.string().min(1),
      lines: z
        .array(
          z.object({
            at: z.number().nonnegative(),
            ar: z.string().min(1),
          }),
        )
        .min(1),
    })
    .optional(),
});

export type VocabEntry = z.infer<typeof VocabEntrySchema>;
export type FamilyMember = z.infer<typeof FamilyMemberSchema>;
export type RootFamily = z.infer<typeof RootFamilySchema>;
export type Book = z.infer<typeof BookSchema>;
