/**
 * The SERIES: every story in Qasas an-Nabiyyin lil-Atfal, grouped into the
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
  /** Which of the four published volumes this story belongs to. */
  volume: number;
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
    prophet: "Ibrahim",
    titleEn: "Who Broke the Idols?",
    titleAr: "من كسر الأصنام؟",
    slug: "ibrahim",
    status: "on-sale",
  },
  {
    volume: 1,
    prophet: "Yusuf",
    titleEn: "The Best of Stories",
    titleAr: "أحسن القصص",
    slug: "yusuf",
    status: "text-online",
  },
  {
    volume: 2,
    prophet: "Nuh",
    titleEn: "Nuh's Ark",
    titleAr: "سفينة نوح",
    status: "planned",
  },
  {
    volume: 2,
    prophet: "Hud",
    titleEn: "The Storm",
    titleAr: "العاصفة",
    status: "planned",
  },
  {
    volume: 2,
    prophet: "Salih",
    titleEn: "The She-Camel of Thamud",
    titleAr: "ناقة ثمود",
    status: "planned",
  },
  {
    volume: 3,
    prophet: "Musa",
    titleAr: "قصة سيدنا موسى عليه السلام",
    status: "planned",
  },
  {
    volume: 4,
    prophet: "",
    titleEn: "A Look Back at the Earlier Stories",
    titleAr: "نظرة على القصص السابقة",
    status: "planned",
  },
  {
    volume: 4,
    prophet: "Shu'aib",
    titleAr: "قصة سيدنا شعيب عليه السلام",
    status: "planned",
  },
  {
    volume: 4,
    prophet: "Dawud and Sulayman",
    titleAr: "قصة سيدنا داود وسليمان عليهما السلام",
    status: "planned",
  },
  {
    volume: 4,
    prophet: "Ayyub and Yunus",
    titleAr: "قصة سيدنا أيوب ويونس عليهما السلام",
    status: "planned",
  },
  {
    volume: 4,
    prophet: "Zakariya",
    titleAr: "قصة سيدنا زكريا عليه السلام",
    status: "planned",
  },
  {
    volume: 4,
    prophet: "Isa",
    titleAr: "قصة سيدنا عيسى عليه السلام",
    status: "planned",
  },
];

/**
 * The label for a buy button — "Get book one", not "Get the book".
 *
 * This site sells one part of a four-volume work, and "the book" made it sound
 * like there is only ever one. Derived from the yaml's `series_order` so it
 * says "book two" by itself the day Yusuf lists, rather than needing a hunt
 * through four call sites.
 */
const ORDINALS = [
  "", "one", "two", "three", "four", "five", "six",
  "seven", "eight", "nine", "ten", "eleven", "twelve",
];

export function buyLabel(seriesOrder: number | null | undefined): string {
  const word = seriesOrder ? ORDINALS[seriesOrder] : undefined;
  return word ? `Get book ${word}` : "Get the book";
}

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
