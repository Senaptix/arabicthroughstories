/**
 * Every book that can be BOUGHT, which is not the same list as every book that
 * has companion content.
 *
 * `getAllBooks()` enumerates content/books — the books whose Arabic, audio and
 * vocabulary exist. This list is deliberately separate and wider, because a
 * book goes on sale before its companion ships: Yusuf is on Amazon and its
 * receipts need approving while its content is still being built.
 *
 * Asma approves against THIS list. Driving her queue off getAllBooks() would
 * make it impossible to grant a book that has been sold but not yet published,
 * which is exactly the case that matters at launch.
 *
 * Adding a book here does not publish anything. It only lets an entitlement be
 * granted for it, so the day the content lands the people who already bought
 * it are already inside.
 */
export type CatalogueEntry = {
  slug: string;
  /** Shown to the reviewer in the approval queue. */
  title: string;
  /** False until the companion content ships. */
  published: boolean;
};

export const CATALOGUE: readonly CatalogueEntry[] = [
  { slug: "ibrahim", title: "Who Broke the Idols? — Ibrahim", published: true },
  { slug: "yusuf", title: "The Story of Yusuf", published: false },
];

export function catalogueTitle(slug: string): string {
  return CATALOGUE.find((b) => b.slug === slug)?.title ?? slug;
}

export function isCatalogueSlug(slug: string): boolean {
  return CATALOGUE.some((b) => b.slug === slug);
}
