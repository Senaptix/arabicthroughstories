/**
 * Sits under any player. The narration is synthesised, and a synthetic
 * Arabic voice is weakest exactly where this book teaches: short case
 * endings (i'rāb). Every clip is checked by a human before it ships, but
 * saying so plainly is fairer to a parent than letting them discover it.
 *
 * `hidden` is set per page, not per book — a human recording (e.g. Yusuf
 * 3-5, read by Marjan) carries none of this caveat, even on a page in a
 * book that is still mostly synthetic.
 */
export default function AudioNote({ hidden = false }: { hidden?: boolean }) {
  if (hidden) return null;
  return (
    <p lang="en" className="mt-3 text-[14px] text-[var(--ink)]/55">
      This narration is read by an AI voice and checked by a human. A few
      words carry slight pronunciation errors, usually in the short endings.
      We plan to re-record the series with a human narrator.
    </p>
  );
}
