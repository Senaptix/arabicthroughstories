/**
 * Small uppercase section label with a short rule — the site's recurring
 * way to title a block without a full heading. Originally local to the
 * landing page; shared here so the page-card route uses the same visual
 * language instead of a second copy.
 *
 * Server component — static markup only.
 */
export default function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-brand-blue flex items-center gap-3"
      style={{
        fontSize: "13px",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
      }}
    >
      <span aria-hidden="true" className="bg-brand-blue/40 h-px w-8" />
      {children}
    </p>
  );
}
