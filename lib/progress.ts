import { z } from "zod";
import { getBook } from "@/lib/parse";

export const pageProgressSchema = z.object({
  bookSlug: z.string().regex(/^[a-z0-9-]+$/),
  page: z.number().int().positive(),
});

export const practiceProgressSchema = pageProgressSchema.extend({
  correct: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
}).refine((value) => value.correct <= value.total);

/**
 * May reading progress be recorded against this page?
 *
 * Excludes non-story pages. The cover, the contents and the appendix carry no
 * story text, so counting them inflates "pages completed" and — worse — lets
 * `last_page` point at them, which offered a child "Continue page 1" and sent
 * them to the cover. Nothing is read on those pages, so nothing is recorded.
 */
export function isTrackablePage(bookSlug: string, page: number) {
  try {
    const book = getBook(bookSlug);
    if (page > book.page_count) return false;
    return !book.non_story_pages.includes(page);
  } catch {
    return false;
  }
}
