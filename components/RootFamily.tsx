import Link from "next/link";
import type { RootFamily as RootFamilyType } from "@/lib/schema";

/**
 * The root-family box — the site's distinctive component. The root letters
 * sit in a badge (letter-spaced so they read as separate letters, not a
 * word); each family member's page number is a followable link, which is
 * what makes this better than the printed appendix. See
 * WEBSITE_DESIGN.md ("Root family box").
 *
 * Server component — plain links, no client state needed.
 */
export default function RootFamily({
  families,
  bookSlug,
  currentPage,
}: {
  families: RootFamilyType[];
  bookSlug: string;
  currentPage: number;
}) {
  return (
    <section aria-label="Word family" className="flex flex-col gap-4">
      <h2
        lang="ar"
        dir="rtl"
        className="text-brand-blue font-semibold"
        style={{
          fontFamily: "var(--font-arabic)",
          fontSize: "clamp(24px, 5vw, 30px)",
          lineHeight: 1.8,
          textAlign: "start",
        }}
      >
        أُسْرَةُ الْكَلِمَةِ
      </h2>

      {families.length === 0 ? (
        <p lang="en" className="text-ink/70" style={{ fontSize: "15px", lineHeight: 1.7 }}>
          No word family on this page.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {families.map((family) => (
            <div key={family.root} className="flex flex-wrap items-center gap-3">
              <span
                lang="ar"
                dir="rtl"
                className="bg-brand-blue text-paper inline-flex shrink-0 items-center justify-center rounded-[12px] px-3 py-1.5"
                style={{
                  fontFamily: "var(--font-arabic)",
                  fontSize: "clamp(22px, 4vw, 28px)",
                  lineHeight: 1.4,
                  letterSpacing: "0.15em",
                }}
              >
                {family.root}
              </span>

              <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {family.members.map((member) => {
                  const isHere = member.page === currentPage;
                  return (
                    <li key={`${member.ar}-${member.page}`} className="flex items-baseline gap-1.5">
                      <span
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
                        {member.ar}
                      </span>
                      {isHere ? (
                        <span
                          lang="en"
                          aria-current="location"
                          className="text-brand-blue font-semibold underline decoration-dotted"
                          style={{ fontSize: "14px" }}
                        >
                          {member.page} (here)
                        </span>
                      ) : (
                        <Link
                          href={`/books/${bookSlug}/p${member.page}`}
                          lang="en"
                          className="text-brand-blue underline transition-colors duration-150 ease-out hover:text-ink"
                          style={{ fontSize: "14px" }}
                        >
                          {member.page}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
