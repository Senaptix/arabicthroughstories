"use client";

import { useEffect, useState } from "react";

export default function PageProgress({ bookSlug, page }: { bookSlug: string; page: number }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/progress/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bookSlug, page }),
    })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => data?.profileName && setProfileName(data.profileName))
      .catch(() => undefined);
  }, [bookSlug, page]);

  async function markRead() {
    setStatus("saving");
    const response = await fetch("/api/progress/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bookSlug, page }),
    }).catch(() => null);
    if (response?.ok) {
      const data = await response.json();
      setProfileName(data.profileName);
      setStatus("saved");
    } else {
      setStatus("idle");
    }
  }

  if (!profileName && status === "idle") return null;
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-y border-ink/10 py-4">
      <p className="text-[14px] text-ink/60">
        {status === "saved" ? `Saved as read for ${profileName}.` : `Saving progress for ${profileName}.`}
      </p>
      <button type="button" onClick={markRead} disabled={status !== "idle"} className="min-h-[44px] rounded-xl border border-brand-blue px-4 text-[14px] font-medium text-brand-blue disabled:opacity-60">
        {status === "saving" ? "Saving…" : status === "saved" ? "Page saved ✓" : "Mark page read"}
      </button>
    </div>
  );
}
