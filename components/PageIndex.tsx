"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SavedPage = {
  page_number: number;
  read_completed_at: string | null;
  practice_completed_at: string | null;
};

export default function PageIndex({
  bookSlug,
  pages,
  recorded,
}: {
  bookSlug: string;
  pages: number[];
  recorded: number[];
}) {
  const [saved, setSaved] = useState<Map<number, SavedPage>>(new Map());
  useEffect(() => {
    fetch(`/api/progress/status?book=${encodeURIComponent(bookSlug)}`)
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.pages) setSaved(new Map(data.pages.map((item: SavedPage) => [item.page_number, item])));
      })
      .catch(() => undefined);
  }, [bookSlug]);

  const heard = new Set(recorded);
  return (
    <ul className="flex flex-wrap gap-2">
      {pages.map((page) => {
        const hasAudio = heard.has(page);
        const completed = Boolean(saved.get(page)?.read_completed_at);
        return (
          <li key={page}>
            <Link
              href={`/books/${bookSlug}/p${page}`}
              aria-label={`Page ${page}${hasAudio ? ", with audio" : ""}${completed ? ", completed" : ""}`}
              className={hasAudio
                ? "relative inline-flex h-[48px] min-w-[48px] items-center justify-center rounded-[12px] bg-brand-blue px-3 text-[15px] font-medium text-paper transition-transform duration-150 ease-out hover:-translate-y-0.5"
                : "relative inline-flex h-[48px] min-w-[48px] items-center justify-center rounded-[12px] bg-surface/70 px-3 text-[15px] text-brand-blue transition-colors duration-150 ease-out hover:bg-surface"}
            >
              {page}
              {completed && <span aria-hidden="true" className={`absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[12px] ${hasAudio ? "bg-paper text-brand-blue" : "bg-brand-blue text-paper"}`}>✓</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
