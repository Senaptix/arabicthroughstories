import Link from "next/link";
import type { Book } from "@/lib/schema";

/**
 * A book cover in the library grid. Cover is fixed at the book's real
 * proportions (688x968 -> 0.711) so it is never cropped to a square. No
 * cover art exists yet, so the image area is a placeholder block in the
 * illustration-accent sand tone, ready to hold artwork later.
 * See WEBSITE_DESIGN.md ("Book card (library grid)").
 *
 * Server component.
 */
export default function BookCard({ book }: { book: Book }) {
  return (
    <Link
      href={`/books/${book.slug}`}
      className="group flex flex-col gap-3 rounded-2xl transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <div
        aria-hidden="true"
        className="bg-sand border-panel-light w-full rounded-2xl border"
        style={{ aspectRatio: "688 / 968" }}
      />

      <div className="flex flex-col gap-1 px-1">
        <p
          lang="ar"
          dir="rtl"
          className="text-ink"
          style={{
            fontFamily: "var(--font-arabic)",
            fontSize: "clamp(24px, 5vw, 30px)",
            lineHeight: 1.8,
            textAlign: "start",
          }}
        >
          {book.title_ar}
        </p>
        <p
          lang="en"
          className="text-ink font-semibold"
          style={{
            fontFamily: "var(--font-latin)",
            fontSize: "clamp(16px, 2.5vw, 18px)",
            lineHeight: 1.6,
          }}
        >
          {book.title_en}
        </p>
        <p lang="en" className="text-brand-blue" style={{ fontSize: "14px", lineHeight: 1.4 }}>
          {book.age_range}
          {book.series ? ` · ${book.series}` : ""}
        </p>
      </div>
    </Link>
  );
}
