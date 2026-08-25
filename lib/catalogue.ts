/**
 * The SERIES: every story in Qasas an-Nabiyyin lil-Atfal that this edition
 * covers, in the order Shaykh Abul Hasan wrote them.
 *
 * This is not the same list as `getAllBooks()`. That enumerates content/books —
 * the stories whose Arabic, audio and vocabulary actually exist on this site.
 * This list is deliberately wider, because the site is an edition of a
 * twelve-story work and a visitor should see the whole shape of it, including
 * the parts not made yet. A story with no `slug` has no pages to link to.
 *
 * Asma also approves receipts against this list, so a story can be sold and
 * granted before its companion content ships.
 *
 * ARABIC TITLES ONLY WHERE WE HAVE OUR OWN. Ibrahim and Yusuf carry the titles
 * from their own yaml. The rest are left without Arabic on purpose: the only
 * Arabic titles available for them come from a third-party app whose text has
 * already been shown to differ from the printed book, and unverified Arabic
 * does not go on this site.
 */
export type CatalogueStatus =
  /** Buyable now. */
  | "on-sale"
  /** Arabic readable on the site; recordings, pictures and print still to come. */
  | "text-online"
  /** Not started in this edition. */
  | "planned";

export type CatalogueEntry = {
  /** The prophet, as a reader would name the story. */
  prophet: string;
  /** Our edition's title, where it has one. */
  titleEn?: string;
  /** Present only when there are pages to link to. */
  slug?: string;
  status: CatalogueStatus;
};

export const CATALOGUE: readonly CatalogueEntry[] = [
  {
    prophet: "Ibrahim",
    titleEn: "Who Broke the Idols?",
    slug: "ibrahim",
    status: "on-sale",
  },
  {
    prophet: "Yusuf",
    titleEn: "The Best of Stories",
    slug: "yusuf",
    status: "text-online",
  },
  { prophet: "Nuh", status: "planned" },
  { prophet: "Hud", status: "planned" },
  { prophet: "Salih", status: "planned" },
  { prophet: "Musa", status: "planned" },
  { prophet: "Shu'aib", status: "planned" },
  { prophet: "Dawud and Sulayman", status: "planned" },
  { prophet: "Ayyub", status: "planned" },
  { prophet: "Yunus", status: "planned" },
  { prophet: "Zakariya and Yahya", status: "planned" },
  { prophet: "Isa", status: "planned" },
];

/** Buyable — the signal the gate and the coming-soon notices key off. */
export function isPublished(slug: string): boolean {
  return CATALOGUE.some((b) => b.slug === slug && b.status === "on-sale");
}

export function catalogueEntry(slug: string): CatalogueEntry | undefined {
  return CATALOGUE.find((b) => b.slug === slug);
}

/**
 * The work this site is an edition of.
 *
 * The Arabic is the source's own running head, exactly as the editor supplied
 * it and as it is printed at the top of every page of his copy. Unvowelled
 * there and unvowelled here — a title is not the teaching text, and vowelling
 * it would be inventing pointing the book itself does not use.
 */
export const SERIES = {
  titleAr: "قصص النبيين للأطفال",
  titleEn: "Qasas an-Nabiyyin lil-Atfal",
  author: "Shaykh Sayyid Abul Hasan Ali al-Hasani an-Nadwi",
} as const;
