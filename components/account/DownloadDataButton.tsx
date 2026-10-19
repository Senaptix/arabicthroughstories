"use client";

import { useState, useTransition } from "react";
import { downloadMyData } from "@/app/account/actions";

export default function DownloadDataButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDownload = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await downloadMyData();
        if (!result.ok) {
          setError(result.error);
          return;
        }
        const blob = new Blob([result.json], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        setError("Could not download your data. Please try again.");
      }
    });
  };

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isPending}
        className="inline-flex min-h-[44px] items-center rounded-xl border border-brand-blue px-4 text-[14px] font-medium text-brand-blue hover:bg-brand-blue/5 disabled:opacity-50"
      >
        {isPending ? "Preparing download…" : "Download my data"}
      </button>
      {error && <p className="mt-2 text-[13px] text-terracotta">{error}</p>}
    </div>
  );
}
