import Link from "next/link";

/**
 * What a signed-out visitor sees in place of gated content.
 *
 * ACCESS_MODEL.md is emphatic that a printed URL must never dead-end. So this
 * is NOT a 404 or a redirect: the page still resolves at its own address, the
 * reader is told plainly what is here and how to reach it, and the page's own
 * words and word families stay visible underneath. Someone who scans a code
 * from the book lands on something useful even before they sign in.
 */
export default function GateNotice({
  page,
  bookSlug,
}: {
  page: number;
  bookSlug: string;
}) {
  return (
    <section className="border-brand-blue/20 bg-sand/30 mb-10 rounded-2xl border px-6 py-7">
      <h2
        className="text-ink font-semibold"
        style={{ fontSize: "clamp(19px, 3vw, 22px)", lineHeight: 1.3 }}
      >
        Page {page} is part of the full companion.
      </h2>

      <p
        className="text-ink/75 mt-3 max-w-[52ch]"
        style={{ fontSize: "16px", lineHeight: 1.65 }}
      >
        The audio, the vowelled Arabic and the practice for this page come with
        the book. Activate your copy once and every page opens — on this site
        and on any device you sign in from.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href="/activate"
          className="bg-brand-blue text-paper inline-flex min-h-[48px] items-center rounded-xl px-5 font-medium"
          style={{ fontSize: "16px" }}
        >
          Activate your book
        </Link>
        <Link
          href={`/books/${bookSlug}`}
          className="border-ink/15 text-ink hover:border-ink/35 inline-flex min-h-[48px] items-center rounded-xl border px-5 font-medium transition-colors"
          style={{ fontSize: "16px" }}
        >
          Read the free preview
        </Link>
      </div>

      <p className="text-ink/50 mt-4" style={{ fontSize: "14px" }}>
        The new words and word families for this page are still below.
      </p>
    </section>
  );
}
