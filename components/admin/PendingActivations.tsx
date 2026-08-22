import { getAdminAccess } from "@/lib/admin";
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
 * Read-only on purpose. Approving still happens in the Supabase table editor,
 * where the trigger grants the 12 months on one cell change. An approve button
 * here would need its own write path and its own audit story; the queue was
 * the missing half, not the approving.
 */

type PendingRow = {
  activation_id: string;
  email: string;
  order_number: string;
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
        <span className="font-medium">receipts@qasaskids.com</span>, then set
        the row&rsquo;s status to <span className="font-medium">approved</span>{" "}
        in Supabase — that one change grants the 12 months.
      </p>

      <ul className="divide-ink/10 border-ink/12 divide-y rounded-2xl border">
        {rows.map((row) => {
          const days = daysUntil(row.expires_at);
          // Under a week means this parent is about to lose access while
          // still waiting on us, which is the worst version of this queue
          // going unread.
          const pressing = days !== null && days <= 7;

          return (
            <li
              key={row.activation_id}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="text-ink truncate text-[15px] font-medium">
                  {row.email}
                </p>
                <p className="text-ink/60 mt-0.5 font-mono text-[14px]">
                  {row.order_number}
                </p>
              </div>
              <p
                className={`text-[14px] ${
                  pressing ? "text-brand-blue font-medium" : "text-ink/50"
                }`}
              >
                {days === null
                  ? "no access recorded"
                  : days === 0
                    ? "access ends today"
                    : `${days} ${days === 1 ? "day" : "days"} of access left`}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
