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
    "Abul Hasan Ali al-Hasani wrote Qasas an-Nabiyyin for his nephew because there was nothing else for Muslim children to read. This edition adds what a classroom used to supply.",
  alternates: { canonical: "./" },
  openGraph: {
    title: "Why we made this book | Qasas Kids",
    description:
      "The reader that has taught Arabic to non-Arabs for generations — and what a child needs to get through it without a teacher in the room.",
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
            The book was never the problem. The{" "}
            <span className="text-brand-blue">missing teacher</span> was.
          </h1>
          <p
            className="text-ink/75 mt-6"
            style={{ fontSize: "18px", lineHeight: 1.7 }}
          >
            <i>Qasas an-Nabiyyin</i> has taught Arabic to non-Arabs for
            generations. It is fully vowelled, carefully graded, and loved by
            the teachers who use it. But it was written for a room with a
            teacher in it — and most of our children are not in that room.
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
            He does not blame the child for preferring stories. He blames the
            adults for printing nothing better. Seventy years later we looked at
            the same shelf in a different country and came to the same
            conclusion — which is the entire reason this edition exists.
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
            Shaykh Abul Hasan bound himself to four conditions when he wrote. They are a
            better description of how children learn a language than most of
            what is written on the subject now.
          </p>
        </div>

        <ol className="reveal mt-8 grid gap-5">
          <Rule n={1} title="The fewest words, repeated the most">
            The vocabulary is kept to the barest minimum and fixed in the mind
            by recurrence rather than by drill. A word met on one page returns
            on the next, and the next — which is why the stories can be read
            long before the reader could pass a test on them.
          </Rule>
          <Rule n={2} title="The language of the Qur'an">
            The Arabic is Qur'anic, with verses set in place — in his phrase —
            like the stone in a ring. A child who reads these stories is
            reading toward the Qur'an, not away from it.
          </Rule>
          <Rule n={3} title="Belief taught without a lesson">
            Tawhid, prophethood and the hereafter are carried by the narrative
            itself rather than listed and defined.
          </Rule>
          <Rule n={4} title="The child never feels taught">
            The stories are simplified so that nothing lands as a burden. What
            is learned is taken in incidentally, while following a story.
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
              This edition began with Shaykh Dr Mohammad Akram Nadwi, whose
              student our editor has been since 2007. He returns to{" "}
              <i>Qasas an-Nabiyyin</i> constantly — recommending it to students
              beginning Arabic, to teachers building a syllabus, and to parents
              asking where to start. After enough years of hearing a book
              recommended, you sit down with it properly.
            </p>
            <p
              className="text-ink/75 mt-5"
              style={{ fontSize: "17px", lineHeight: 1.75 }}
            >
              Writing on how to make progress in Arabic reading, he sets out the
              order plainly:
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
            Among the books he names for that stage is{" "}
            <i>Qisas al-Nabiyyin</i> itself. Elsewhere he is blunter about what
            to avoid: those acquiring Arabic should keep away from books of
            vocabulary lists and grammar rules, and read instead the writing of
            people who used the language well — short sentences first, then
            short stories, raising the level as they go.
          </p>
          <p
            className="text-ink/75 reveal mt-5"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            A language, on this view, is not assembled from parts. It is
            absorbed from meaning the learner can actually follow. That single
            idea is the reason this edition looks the way it does.
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
            . He is quoted here because his writing shaped this book — not as
            an endorsement of it.
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
            Everything a learner needed came from a person
          </h2>
          <p
            className="text-ink/75 mt-5"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            In a madrasa, <i>Qasas an-Nabiyyin</i> is taught aloud. The teacher
            reads, gives the meaning of each new word, corrects the reading,
            asks the child to retell the story back. For many students it is
            their first meeting with Arabic vocabulary — and with translation,
            supplied in the room.
          </p>
          <p
            className="text-ink/75 mt-5"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            Take the teacher away and the book does not become harder to
            decode. It becomes impossible to understand. A child can sound out
            every word on the page perfectly and still not know what happened.
          </p>
          <p
            className="text-ink mt-5 font-semibold"
            style={{ fontSize: "18px", lineHeight: 1.7 }}
          >
            So we put the teacher on the page.
          </p>
        </div>

        <ul className="reveal mt-9 grid gap-4 sm:grid-cols-2">
          <Feature title="English underneath">
            Meaning never has to wait. The Arabic stays whole and the English
            sits with it, so a parent who does not read Arabic can still sit
            down and read it together.
          </Feature>
          <Feature title="Every new word, where it appears">
            Glossed on the page it is first met, not in a glossary at the back
            that no child turns to.
          </Feature>
          <Feature title="Read aloud by a native reader">
            Every page, with the line highlighted as it is read — so
            pronunciation comes from a voice, the way it always has.
          </Feature>
          <Feature title="Word families">
            A root met on one page is recognised on another, which is how
            Arabic actually rewards a reader.
          </Feature>
          <Feature title="A picture on every page">
            The image holds the meaning while the language is still arriving.
          </Feature>
          <Feature title="Practice that asks for answers">
            Short exercises drawn from the page just read — producing the
            language, not just recognising it.
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
              reflection, and not by any substitute figure. Neither are angels.
              Where a scene is seen through Ibrahim's eyes, you see only what he
              saw — the night sky, the idol house, the fire — and no part of
              him.
            </p>
            <p
              className="text-ink/75 mt-5"
              style={{ fontSize: "17px", lineHeight: 1.75 }}
            >
              No person in these pages is given facial features. This was
              settled before the first drawing was made, and it has held on
              every page since without exception.
            </p>
            <p
              className="text-ink/75 mt-5"
              style={{ fontSize: "17px", lineHeight: 1.75 }}
            >
              We have also kept the stories whole. Language is simplified for a
              young reader; episodes are not removed for being difficult. Where
              the story is grave, the picture carries the weight of it without
              dwelling on the act.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
       * Who made it. Named contributions, because "a team" persuades
       * nobody. Haneefah is credited as art director because that is the
       * job she did — nineteen, diploma in art. Softening it to "helped
       * with the pictures" would be a disservice dressed as modesty.
       * ---------------------------------------------------------------- */}
      <section className="mx-auto w-full max-w-[720px] px-6 py-16 sm:px-8 lg:py-20">
        <div className="reveal">
          <Eyebrow>Who made it</Eyebrow>
          <h2
            className="text-ink mt-4 font-semibold text-balance"
            style={{ fontSize: "clamp(24px, 3.6vw, 32px)", lineHeight: 1.25 }}
          >
            The art was directed by an artist
          </h2>
          <p
            className="text-ink/75 mt-5"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            Haneefah art-directed this edition. She holds a diploma in art,
            and it shows in the work: she decided what each page should show,
            took the illustrations through revision after revision until they
            held together as one book rather than fifty separate pictures, and
            set the pages themselves. Where a page here feels right, it is
            usually because she sent an earlier version back.
          </p>
          <p
            className="text-ink/75 mt-5"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            Arabic teachers checked the vowelling word by word, listened to the
            recordings line by line against the page, and advised on the
            typefaces — which sounds like a small matter until you watch a child
            try to read a fully vowelled line set in the wrong one. Ulema gave
            their guidance on the illustrations.
          </p>
          <p
            className="text-ink/75 mt-5"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            Whatever is correct in this book comes from its sources and its
            teachers. The mistakes are ours, and we would be grateful to be told
            of them.
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
