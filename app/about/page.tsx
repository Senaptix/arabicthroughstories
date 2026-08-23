import type { Metadata } from "next";
import Link from "next/link";
import BrandLockup from "@/components/BrandLockup";
import Eyebrow from "@/components/Eyebrow";
import HomeBar from "@/components/HomeBar";
import { getBook } from "@/lib/parse";

/**
 * Why this book exists — the case for it, made from sources rather than
 * from adjectives.
 *
 * This page is deliberately the least "marketing" surface on the site. The
 * landing page sells; this one explains, and a parent who reaches it has
 * already decided they want to be convinced rather than pitched. So the
 * argument is carried by quotation: Shaykh Abul Hasan on why he wrote the original,
 * and Shaykh Akram on how Arabic is actually learned. Every claim
 * about either is traceable to something they wrote.
 *
 * NO HAND-TYPED ARABIC. The house rule is that Arabic on this site is
 * parsed from the book's verified corpus and never keyed in — a wrong vowel
 * changes the word. Shaykh Abul Hasan's preface is not in that corpus, so it appears
 * here in English translation only. The one Arabic string on the page is
 * the book's own title, which comes from the parsed book record.
 *
 * Static server component: no client JS beyond the shared `.reveal`
 * scroll animation in globals.css.
 */

export const metadata: Metadata = {
  title: "Why we made this book",
  description:
    "Abul Hasan Ali al-Hasani wrote Qasas an-Nabiyyin for his nephew because there was nothing else for Muslim children to read. This edition supplies what the classroom used to.",
  alternates: { canonical: "./" },
  openGraph: {
    title: "Why we made this book | Qasas Kids",
    description:
      "The reader that has taught Arabic to non-Arabs for generations, and what a child needs to get through it without a teacher in the room.",
    url: "./",
  },
};

const SLUG = "ibrahim";

/** Shaykh Akram's own site, where the pieces quoted here are published.
 *  Linked rather than paraphrased so a reader can check us. */
const AKRAM = {
  reading:
    "https://akramnadwi.com/how-to-progress-in-arabic-reading-and-comprehension-7448/",
  articles: "https://akramnadwi.com/all-post/",
  home: "https://akramnadwi.com/",
} as const;

export default function AboutPage() {
  const book = getBook(SLUG);

  return (
    <div className="overflow-x-hidden">
      <HomeBar />

      {/* ---------------------------------------------------------------- *
       * Opening. States the whole thesis in two sentences, because a
       * reader who goes no further should still leave with the argument.
       * ---------------------------------------------------------------- */}
      <section className="mx-auto w-full max-w-[720px] px-6 pt-12 pb-4 sm:px-8 lg:pt-16">
        <div className="reveal">
          <Eyebrow>Why we made this</Eyebrow>
          <h1
            className="text-ink mt-5 font-semibold text-balance"
            style={{ fontSize: "clamp(30px, 5vw, 44px)", lineHeight: 1.15 }}
          >
            This book has taught Arabic for generations. It always came{" "}
            <span className="text-brand-blue">with a teacher</span>.
          </h1>
          <p
            className="text-ink/75 mt-6"
            style={{ fontSize: "18px", lineHeight: 1.7 }}
          >
            Seminaries across the world teach Arabic from{" "}
            <i>Qasas an-Nabiyyin</i>. Every word carries its vowels, the
            language rises story by story, and the teachers who use it love
            it. It was written for a room with an ustadh in it. Your child is
            reading at the kitchen table.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
       * Shaykh Abul Hasan's own reason. This is the strongest thing on the page and
       * it is not ours: a scholar looking at what a child had to read and
       * blaming the adults. Same reason, seventy years apart.
       * ---------------------------------------------------------------- */}
      <section className="bg-sand/25 border-ink/5 mt-10 border-y">
        <div className="mx-auto w-full max-w-[720px] px-6 py-16 sm:px-8 lg:py-20">
          <div className="reveal">
            <Eyebrow>Where it came from</Eyebrow>
            <h2
              className="text-ink mt-4 font-semibold text-balance"
              style={{ fontSize: "clamp(24px, 3.6vw, 32px)", lineHeight: 1.25 }}
            >
              A scholar looked at what his nephew was reading
            </h2>
            <p
              className="text-ink/75 mt-5"
              style={{ fontSize: "17px", lineHeight: 1.75 }}
            >
              Shaykh Sayyid Abul Hasan Ali al-Hasani an-Nadwi wrote the first
              volume of <i>Qasas an-Nabiyyin</i> for a child in his own family.
              He opens the book by explaining why.
            </p>
          </div>

          <Quote className="reveal mt-8">
            I see that you are very fond of stories and tales, as is every
            child your age … but I am saddened that I see nothing in your hands
            except tales of cats and dogs, lions and wolves, monkeys and bears.
            <strong className="font-semibold">
              {" "}
              And we are to blame for that, for that is what you find in print.
            </strong>{" "}
            So I decided to write for you, and for children of the Muslims like
            you, the stories of the Prophets and Messengers in a simple style
            suited to your age and taste — and so I did.
            <Cite>
              Abul Hasan Ali al-Hasani, preface to <i>Qasas an-Nabiyyin</i>,
              vol. 1
            </Cite>
          </Quote>

          <p
            className="text-ink/75 reveal mt-8"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            He blames the adults for printing nothing better. Seventy years
            later we looked at the same shelf in a different country and
            reached his conclusion. That is why we made this edition.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
       * His four conditions. This is the answer to "is it any good" and it
       * is better than anything we could assert: the author describing his
       * own method, which happens to be sound language pedagogy.
       * ---------------------------------------------------------------- */}
      <section className="mx-auto w-full max-w-[720px] px-6 py-16 sm:px-8 lg:py-20">
        <div className="reveal">
          <Eyebrow>Why the book is good</Eyebrow>
          <h2
            className="text-ink mt-4 font-semibold text-balance"
            style={{ fontSize: "clamp(24px, 3.6vw, 32px)", lineHeight: 1.25 }}
          >
            Four rules he set himself
          </h2>
          <p
            className="text-ink/75 mt-5"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            He bound himself to four conditions. They describe how children
            learn a language better than most of what gets written on the
            subject now.
          </p>
        </div>

        <ol className="reveal mt-8 grid gap-5">
          <Rule n={1} title="The fewest words, repeated the most">
            He keeps the vocabulary to a minimum and fixes it by recurrence.
            A word you meet on one page comes back on the next, and the next.
            Children read these stories long before they could pass a test on
            them.
          </Rule>
          <Rule n={2} title="The language of the Qur'an">
            The Arabic is Qur'anic. He sets the verses in place, in his own
            phrase, like the stone in a ring. A child who reads these stories
            is reading toward the Qur'an.
          </Rule>
          <Rule n={3} title="Belief taught without a lesson">
            The narrative carries tawhid, prophethood and the hereafter. He
            never stops to list them or define them.
          </Rule>
          <Rule n={4} title="The child never feels taught">
            He simplifies the stories so nothing lands as a burden. The child
            takes it in while following the story.
          </Rule>
        </ol>
      </section>

      {/* ---------------------------------------------------------------- *
       * Shaykh Akram. The pivot of the page: he is why this edition was
       * attempted at all, and his published words carry the method claim
       * so that we never have to reach for modern jargon.
       * ---------------------------------------------------------------- */}
      <section className="bg-sand/25 border-ink/5 border-y">
        <div className="mx-auto w-full max-w-[720px] px-6 py-16 sm:px-8 lg:py-20">
          <div className="reveal">
            <Eyebrow>Why we started</Eyebrow>
            <h2
              className="text-ink mt-4 font-semibold text-balance"
              style={{ fontSize: "clamp(24px, 3.6vw, 32px)", lineHeight: 1.25 }}
            >
              A teacher who kept quoting a book
            </h2>
            <p
              className="text-ink/75 mt-5"
              style={{ fontSize: "17px", lineHeight: 1.75 }}
            >
              Our editor has studied with Shaykh Dr Mohammad Akram Nadwi
              since 2007. In that time he has heard the Shaykh recommend{" "}
              <i>Qasas an-Nabiyyin</i> to students beginning Arabic, to
              teachers building a syllabus, and to parents asking where to
              start. After enough years of that, you sit down and read it
              yourself.
            </p>
            <p
              className="text-ink/75 mt-5"
              style={{ fontSize: "17px", lineHeight: 1.75 }}
            >
              Writing on how to make progress in Arabic reading, he sets out
              the order:
            </p>
          </div>

          <Quote className="reveal mt-8">
            Begin with simple, well-written Arabic texts containing short,
            clear, and eloquent sentences. Progress to short storybooks that use
            familiar vocabulary and straightforward grammar.
            <Cite>
              Mohammad Akram Nadwi,{" "}
              <a
                href={AKRAM.reading}
                target="_blank"
                rel="noreferrer"
                className="text-brand-blue underline-offset-4 hover:underline"
              >
                How to progress in Arabic reading and comprehension
              </a>
            </Cite>
          </Quote>

          <p
            className="text-ink/75 reveal mt-8"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            He names <i>Qisas al-Nabiyyin</i> among the books for that stage.
            Elsewhere he is blunter: keep away from vocabulary lists and
            grammar books, and read the people who used the language well.
            Short sentences first, then short stories, raising the level as
            you go.
          </p>
          <p
            className="text-ink/75 reveal mt-5"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            You absorb a language from meaning you can follow. That idea
            shaped every page of this edition.
          </p>

          <p
            className="text-ink/50 reveal mt-8"
            style={{ fontSize: "14px", lineHeight: 1.7 }}
          >
            Shaykh Akram's articles are published at{" "}
            <a
              href={AKRAM.articles}
              target="_blank"
              rel="noreferrer"
              className="text-brand-blue underline-offset-4 hover:underline"
            >
              akramnadwi.com
            </a>
. We quote him because his writing shaped this edition. He has not
            endorsed it.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
       * The gap, then the fix. Kept adjacent on purpose: the list of what
       * we added is only persuasive once the reader knows what it replaces.
       * ---------------------------------------------------------------- */}
      <section className="mx-auto w-full max-w-[720px] px-6 py-16 sm:px-8 lg:py-20">
        <div className="reveal">
          <Eyebrow>What was missing</Eyebrow>
          <h2
            className="text-ink mt-4 font-semibold text-balance"
            style={{ fontSize: "clamp(24px, 3.6vw, 32px)", lineHeight: 1.25 }}
          >
The ustadh supplied everything the book left out
          </h2>
          <p
            className="text-ink/75 mt-5"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            In a madrasa the ustadh teaches this book aloud. He reads, gives
            the meaning of each new word, corrects the reading, and asks the
            child to retell the story back. For many students it is their first
            meeting with Arabic vocabulary, and with translation, which he
            supplies in the room.
          </p>
          <p
            className="text-ink/75 mt-5"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            Take the ustadh away and your child can still sound out every
            word on the page. She will not know what happened in the story.
          </p>
          <p
            className="text-ink mt-5 font-semibold"
            style={{ fontSize: "18px", lineHeight: 1.7 }}
          >
            So we put him on the page.
          </p>
        </div>

        <ul className="reveal mt-9 grid gap-4 sm:grid-cols-2">
          <Feature title="English underneath">
            Meaning never has to wait. The Arabic stays whole and the English
            sits with it, so a parent who does not read Arabic can still sit
            down and read it together.
          </Feature>
          <Feature title="Every new word, where it appears">
            We gloss each word on the page where it first appears. Nobody
            turns to a glossary at the back.
          </Feature>
          <Feature title="Read aloud by a native reader">
            A native reader reads every page, and the line lights up as he
            reads it. Pronunciation comes from a voice, the way it always has.
          </Feature>
          <Feature title="Word families">
            You meet a root on one page and recognise it on another. That is
            how Arabic rewards a reader.
          </Feature>
          <Feature title="A picture on every page">
            The image holds the meaning while the language is still arriving.
          </Feature>
          <Feature title="Practice that asks for answers">
            Short exercises drawn from the page your child has just read.
            They ask her to produce the language, not point at it.
          </Feature>
        </ul>
      </section>

      {/* ---------------------------------------------------------------- *
       * The depiction policy. Stated on its own, factually, without
       * defensiveness. This audience looks for it, and finding it answered
       * before they have to ask is worth more than any reassurance.
       * ---------------------------------------------------------------- */}
      <section className="bg-sand/25 border-ink/5 border-y">
        <div className="mx-auto w-full max-w-[720px] px-6 py-16 sm:px-8 lg:py-20">
          <div className="reveal">
            <Eyebrow>What is not drawn</Eyebrow>
            <h2
              className="text-ink mt-4 font-semibold text-balance"
              style={{ fontSize: "clamp(24px, 3.6vw, 32px)", lineHeight: 1.25 }}
            >
              No Prophet appears in this book, in any form
            </h2>
            <p
              className="text-ink/75 mt-5"
              style={{ fontSize: "17px", lineHeight: 1.75 }}
            >
              Not faceless, not from behind, not in silhouette, shadow or
              reflection, and not by any substitute figure. Nor do angels.
              Where a scene is seen through Ibrahim's eyes you see the night
              sky, the idol house, the fire, and no part of him.
            </p>
            <p
              className="text-ink/75 mt-5"
              style={{ fontSize: "17px", lineHeight: 1.75 }}
            >
              We give no person in these pages facial features. We settled
              that before the first drawing and have held it on every page
              since.
            </p>
            <p
              className="text-ink/75 mt-5"
              style={{ fontSize: "17px", lineHeight: 1.75 }}
            >
              We kept the stories whole. We simplified the language for a
              young reader and cut no episode for being difficult. Where the
              story is grave, the picture carries the weight without dwelling
              on the act.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
       * Who made it. Named contributions, because "a team" persuades
       * nobody, and because a reader deciding whether to trust the Arabic
       * wants to know who checked it.
       *
       * Credits say what each person did and nothing beyond it. Haneefah
       * corrected a draft that had her drawing the illustrations; she did
       * not draw them, she chose and rejected them, which the QA records in
       * the book repo document at length. Marjan Ahmed listened to all fifty
       * recordings, not Akhlaaq Choudry. Ask the person before crediting.
       *
       * THE AI DISCLOSURE IS DELIBERATE AND SHOULD STAY. Saying it plainly
       * costs nothing next to being found out, and the work that followed
       * the generation is the actual argument: a character bible, a
       * depiction rule with no exceptions, and a reviewer who rejected 22
       * pages in one pass and then rejected the batch sent to fix them.
       * Hiding the tool would also hide that.
       *
       * The 587 is counted, not estimated: every png/jpg under generated/,
       * FlowImages/, art/, for-upload/, art-consistency/ and
       * source-illustrations/ in the book repo, deduplicated by md5 and
       * excluding contact sheets, approval cards and page-number overlays.
       * 835 files, 248 of them copies. It is a floor rather than a total,
       * since rejects that never left WhatsApp were never saved. Recount
       * before changing the figure.
       * ---------------------------------------------------------------- */}
      <section className="mx-auto w-full max-w-[720px] px-6 py-16 sm:px-8 lg:py-20">
        <div className="reveal">
          <Eyebrow>Who made it</Eyebrow>
          <h2
            className="text-ink mt-4 font-semibold text-balance"
            style={{ fontSize: "clamp(24px, 3.6vw, 32px)", lineHeight: 1.25 }}
          >
            How the pictures were made
          </h2>
          <p
            className="text-ink/75 mt-5"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            We generated the illustrations with AI image tools, then revised
            them against a written standard until they earned their place. We
            would rather say that here than leave you to wonder.

            What it took: a character bible fixing how the idols, the
            buildings and the clothing look from one page to the next. A
            depiction rule with no exceptions. And a reviewer who kept
            sending them back.
          </p>
          <p
            className="text-ink/75 mt-5"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            This project holds 587 distinct illustrations. Fifty of them are
            in the book. The rest were rejected, and the count only includes
            what was kept: more went past in a message thread and were never
            saved at all.

            Haneefah, the editor's daughter, holds a diploma in art. She chose
            what each page shows, then reviewed every generated page against
            the ones already accepted. In one pass she sent back
            twenty-two: the style had drifted, some had gone photo-real, some
            carried speckling the accepted pages did not have. She rejected
            the batch produced to fix those as well. Every page in this book
            went through more than one version, and most through many.
          </p>
          <p
            className="text-ink/75 mt-5"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            The faces took the longest. No person in this book has facial
            features and no Prophet appears at all, and image generators
            fight both rules. Page after page came back with a carved face on
            an idol or eyes on a bystander in the crowd, and went back again.
            The rule you read about above cost more than any other decision in
            the book.
          </p>
          <p
            className="text-ink/75 mt-5"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            Maulana Marjan Ahmed, who translates much of Shaykh Akram's work
            into Bangla, proofread every line of the Arabic and listened to all
            fifty recordings against the text, correcting what he found.
          </p>
          <p
            className="text-ink/75 mt-5"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            Ustadh Akhlaaq Choudry of Al Salam Institute, one of the editor's
            own Arabic teachers, gave a great deal of his time to checking the
            text. Other Arabic teachers advised on the typefaces, which sounds
            like a small matter until you watch a child try to read a fully
            vowelled line set in the wrong one. Ulema gave their guidance on
            the illustrations.
          </p>
          <p
            className="text-ink/75 mt-5"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            Whatever is correct here comes from its sources and its teachers.
            The mistakes are ours, and we would be grateful to be told of
            them.
          </p>
        </div>

        <div className="reveal mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/#inside"
            className="bg-brand-blue text-paper inline-flex min-h-[48px] items-center rounded-2xl px-6 font-medium transition-transform duration-150 ease-out hover:-translate-y-0.5"
          >
            Look inside the book
          </Link>
          <Link
            href="/"
            className="border-ink/15 text-ink hover:border-ink/35 inline-flex min-h-[48px] items-center rounded-2xl border px-6 font-medium transition-colors duration-150 ease-out"
          >
            Back to the start
          </Link>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-[1100px] px-6 py-12 sm:px-8">
        <div className="border-ink/10 flex flex-col gap-5 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
          <BrandLockup size="footer" />
          <div className="sm:text-right">
            <p
              className="text-ink/60"
              style={{ fontSize: "14px", lineHeight: 1.6 }}
            >
              {book.title_en} — book {book.series_order} of the{" "}
              <i>Qasas an-Nabiyyin</i> readers.
            </p>
            <p
              className="text-ink/45 mt-1"
              style={{ fontSize: "14px", lineHeight: 1.6 }}
            >
              After{" "}
              <a
                href={AKRAM.home}
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink/70 underline-offset-4 hover:underline"
              >
                Abul Hasan Ali al-Hasani
              </a>
              , may Allah have mercy on him
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------- *
 * Local pieces. Not exported — only this page uses them, and a file per
 * blockquote would be filing for its own sake.
 * -------------------------------------------------------------------- */

function Quote({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <blockquote
      className={`border-brand-blue/30 text-ink/85 border-l-2 pl-5 sm:pl-7 ${className}`}
      style={{ fontSize: "18px", lineHeight: 1.7 }}
    >
      {children}
    </blockquote>
  );
}

function Cite({ children }: { children: React.ReactNode }) {
  return (
    <footer
      className="text-ink/50 mt-4 not-italic"
      style={{ fontSize: "14px", lineHeight: 1.6 }}
    >
      — {children}
    </footer>
  );
}

function Rule({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="border-ink/10 bg-paper rounded-2xl border p-5 sm:p-6">
      <p className="flex items-baseline gap-3">
        <span
          className="text-brand-blue/50 font-semibold"
          style={{ fontSize: "15px" }}
        >
          {n}
        </span>
        <span className="text-ink font-semibold" style={{ fontSize: "17px" }}>
          {title}
        </span>
      </p>
      <p
        className="text-ink/70 mt-2 pl-6"
        style={{ fontSize: "16px", lineHeight: 1.7 }}
      >
        {children}
      </p>
    </li>
  );
}

function Feature({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="border-ink/10 rounded-2xl border p-5">
      <p className="text-ink font-semibold" style={{ fontSize: "16px" }}>
        {title}
      </p>
      <p
        className="text-ink/70 mt-2"
        style={{ fontSize: "15px", lineHeight: 1.65 }}
      >
        {children}
      </p>
    </li>
  );
}
