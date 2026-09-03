/**
 * The SERIES: every story in Qisas al-Nabiyyin lil-Atfal, grouped into the
 * four volumes Shaykh Abul Hasan published them in.
 *
 * GENERATED from the editor's own teaching slides — "03 Qasas Introduction
 * 3.pptx", slide 5, which lists the work's structure as it is taught. Rebuild
 * with scratchpad/gen_catalogue.py rather than editing by hand.
 *
 * The Arabic titles are copied out of that deck, never retyped. They are HIS
 * titles, not descriptions: Nuh's story is سفينة نوح, Hud's is العاصفة,
 * Salih's is ناقة ثمود. An earlier version of this file used generic
 * "قصة سيدنا X" titles taken from a third-party app; those were wrong, and so
 * was its story list — Ayyub and Yunus are ONE story, and Zakariya stands
 * alone.
 *
 * This is not the same list as `getAllBooks()`. That enumerates content/books —
 * the stories whose Arabic actually exists on this site. This list is wider on
 * purpose: the site is an edition of a whole work, and a visitor should see
 * the shape of it including the parts not made yet. A story with no `slug` has
 * no pages to link to.
 *
 * Asma also approves receipts against this list, so a story can be sold and
 * granted before its companion content ships.
 */
export type CatalogueStatus =
  /** Buyable now. */
  | "on-sale"
  /** Arabic readable on the site; recordings, pictures and print still to come. */
  | "text-online"
  /** Not started in this edition. */
  | "planned";

export type CatalogueEntry = {
  /** Which of the published volumes this story belongs to. */
  volume: number;
  /** Position within that volume. Volume 1 is Part 1 Ibrahim, Part 2 Yusuf. */
  part: number;
  /** The prophet, as a reader would name the story. */
  prophet: string;
  /** Our edition's English title, where it has one. */
  titleEn?: string;
  /** Shaykh Abul Hasan's own Arabic title for the story. */
  titleAr: string;
  /** Present only when there are pages to link to. */
  slug?: string;
  status: CatalogueStatus;
};

/**
 * NAMING — read this before changing a label.
 *
 * Shaykh Abul Hasan's set is five books: Books 1-4 are the stories of the
 * Prophets and Book 5 is the Seerah. To a teacher, "Book 1" therefore means
 * the whole of the first volume, both its stories.
 *
 * So this edition never says "Book one". Our printed Ibrahim is
 * **Part 1 of Volume 1**, and Yusuf is Part 2 of Volume 1. Ustadh Akhlaaq
 * raised this: calling Ibrahim "Book 1" collides with what every teacher
 * already means by it, and there is no version of that confusion worth having
 * in front of the people most likely to recommend the book.
 */

/** الجزء الأول … الجزء الرابع, as the deck names them. */
export const VOLUME_TITLES: Record<number, string> = {
  1: "الجزء الأول",
  2: "الجزء الثاني",
  3: "الجزء الثالث",
  4: "الجزء الرابع",
};

export const CATALOGUE: readonly CatalogueEntry[] = [
  {
    volume: 1,
    part: 1,
    prophet: "Ibrahim",
    titleEn: "Who Broke the Idols?",
    titleAr: "من كسر الأصنام؟",
    slug: "ibrahim",
    status: "on-sale",
  },
  {
    volume: 1,
    part: 2,
    prophet: "Yusuf",
    titleEn: "The Best of Stories",
    titleAr: "أحسن القصص",
    slug: "yusuf",
    status: "text-online",
  },
  {
    volume: 2,
    part: 1,
    prophet: "Nuh",
    titleEn: "Nuh's Ark",
    titleAr: "سفينة نوح",
    status: "planned",
  },
  {
    volume: 2,
    part: 2,
    prophet: "Hud",
    titleEn: "The Storm",
    titleAr: "العاصفة",
    status: "planned",
  },
  {
    volume: 2,
    part: 3,
    prophet: "Salih",
    titleEn: "The She-Camel of Thamud",
    titleAr: "ناقة ثمود",
    status: "planned",
  },
  {
    volume: 3,
    part: 1,
    prophet: "Musa",
    titleAr: "قصة سيدنا موسى عليه السلام",
    status: "planned",
  },
  {
    volume: 4,
    part: 1,
    prophet: "",
    titleEn: "A Look Back at the Earlier Stories",
    titleAr: "نظرة على القصص السابقة",
    status: "planned",
  },
  {
    volume: 4,
    part: 2,
    prophet: "Shu'aib",
    titleAr: "قصة سيدنا شعيب عليه السلام",
    status: "planned",
  },
  {
    volume: 4,
    part: 3,
    prophet: "Dawud and Sulayman",
    titleAr: "قصة سيدنا داود وسليمان عليهما السلام",
    status: "planned",
  },
  {
    volume: 4,
    part: 4,
    prophet: "Ayyub and Yunus",
    titleAr: "قصة سيدنا أيوب ويونس عليهما السلام",
    status: "planned",
  },
  {
    volume: 4,
    part: 5,
    prophet: "Zakariya",
    titleAr: "قصة سيدنا زكريا عليه السلام",
    status: "planned",
  },
  {
    volume: 4,
    part: 6,
    prophet: "Isa",
    titleAr: "قصة سيدنا عيسى عليه السلام",
    status: "planned",
  },
];

/** Buyable — the signal the gate and the coming-soon notices key off. */
export function isPublished(slug: string): boolean {
  return CATALOGUE.some((b) => b.slug === slug && b.status === "on-sale");
}

export function catalogueEntry(slug: string): CatalogueEntry | undefined {
  return CATALOGUE.find((b) => b.slug === slug);
}

/** "Volume 1, Part 1" — how this edition names a story. Never "Book one". */
export function partLabel(slug: string): string | null {
  const e = catalogueEntry(slug);
  return e ? `Volume ${e.volume}, Part ${e.part}` : null;
}

/** The label for a buy button. */
export function buyLabel(slug: string): string {
  const p = partLabel(slug);
  return p ? `Get ${p}` : "Get the book";
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
  titleEn: "Qisas al-Nabiyyin lil-Atfal",
  author: "Shaykh Sayyid Abul Hasan Ali al-Hasani an-Nadwi",
} as const;
