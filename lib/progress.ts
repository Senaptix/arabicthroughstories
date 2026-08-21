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

export function isPublishedPage(bookSlug: string, page: number) {
  try {
    const book = getBook(bookSlug);
    return page <= book.page_count;
  } catch {
    return false;
  }
}
