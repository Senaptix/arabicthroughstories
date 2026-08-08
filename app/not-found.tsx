import HomeBar from "@/components/HomeBar";

/**
 * A mistyped or retired page number lands here. It gets the same way home
 * as everywhere else — a 404 is the one page where being stranded is most
 * likely, so it is the last place to leave without an exit.
 */
export default function NotFound() {
  return (
    <>
      <HomeBar />
      <main className="mx-auto w-full max-w-[640px] px-6 py-16 sm:px-8">
        <h1
          className="text-ink font-semibold"
          style={{ fontSize: "clamp(22px, 4vw, 30px)", lineHeight: 1.3 }}
        >
          That page isn&rsquo;t here
        </h1>
        <p
          className="text-ink/70 mt-3"
          style={{ fontSize: "16px", lineHeight: 1.6 }}
        >
          Check the page number, or start from the beginning of the book.
        </p>
      </main>
    </>
  );
}
