import ActivationReview from "@/components/admin/ActivationReview";
import { getAdminAccess } from "@/lib/admin";
import { CATALOGUE } from "@/lib/catalogue";
import { activationIssuerSecret } from "@/lib/activation-codes";
import { createClient } from "@/lib/supabase/server";

/**
 * Amazon activations still waiting on a receipt — Asma's queue.
 *
 * Checks admin access ITSELF rather than trusting the page that renders it.
 * The page checks too, and that is deliberate: a component that reads other
 * families' email addresses should not become readable by being dropped
 * somewhere else later. Cheap here, since getAdminAccess is per-request.
 *
 * Approving happens HERE since 2026-08-24. It used to mean opening the
 * Supabase table editor and changing a status cell by hand, which put a
 * production database in front of a clerical job. The write path is a
 * security-definer RPC behind the same two gates as code issuing: the app
 * checks ADMIN_EMAILS, the database checks the issuer secret.
 */

type PendingRow = {
  activation_id: string;
  email: string;
  order_number: string;
  book_slugs: string[] | null;
  claimed_at: string;
  expires_at: string | null;
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso) - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export default async function PendingActivations() {
  const access = await getAdminAccess();
  if (!access.allowed) return null;

  let secret: string;
  try {
    secret = activationIssuerSecret();
  } catch {
    return (
      <p className="text-ink/60 text-[15px]">
        The activation queue is unavailable: the issuer secret is not
        configured on this server.
      </p>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_pending_activations", {
    p_issuer_secret: secret,
    p_limit: 100,
  });

  if (error) {
    return (
      <p className="text-ink/60 text-[15px]">
        The activation queue could not be loaded. Try again shortly.
      </p>
    );
  }

  const rows = (data ?? []) as PendingRow[];

  if (rows.length === 0) {
    return (
      <p className="text-ink/60 text-[15px] leading-6">
        Nothing waiting. Every Amazon activation has been approved or
        rejected.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-ink/60 text-[14px]">
        {rows.length} waiting. Match each order number to the receipt in{" "}
        <span className="font-medium">receipts@qasaskids.com</span>, tick every
        book the receipt covers, and approve. One order often contains both.
      </p>

      <ul className="divide-ink/10 border-ink/12 divide-y rounded-2xl border">
        {rows.map((row) => (
          <ActivationReview
            key={row.activation_id}
            activationId={row.activation_id}
            email={row.email}
            orderNumber={row.order_number}
            claimedBooks={row.book_slugs ?? []}
            daysLeft={daysUntil(row.expires_at)}
            catalogue={CATALOGUE}
          />
        ))}
      </ul>
    </div>
  );
}
