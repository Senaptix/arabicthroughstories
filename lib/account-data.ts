/**
 * Pure functions for GDPR account data export and purchase record anonymisation.
 * No server dependencies or side effects; safe to test under tsx.
 */

export type ChildProfileRow = {
  id: string;
  display_name: string;
  avatar_key: string;
  created_at: string;
};

export type BookProgressRow = {
  child_id: string;
  book_slug: string;
  last_page: number;
  started_at: string;
  last_seen_at: string;
};

export type PageProgressRow = {
  child_id: string;
  book_slug: string;
  page_number: number;
  viewed_at: string;
  read_completed_at: string | null;
  practice_completed_at: string | null;
  best_correct: number | null;
  graded_total: number | null;
  updated_at: string;
};

export type EntitlementRow = {
  book_slug: string;
  source: string;
  starts_at: string;
  expires_at: string;
};

export type ActivationRow = {
  id: string;
  order_number: string;
  status: string;
  note: string | null;
  book_slugs: string[];
  created_at: string;
  reviewed_at: string | null;
};

export type PaddleTransactionRow = {
  transaction_id: string;
  book_slug: string;
  parent_id?: string | null;
  customer_email?: string | null;
  kind?: string | null;
  status?: string | null;
  created_at: string;
};

export type VocabWord = {
  index: number;
  ar: string;
  en: string;
  page: number;
};

/**
 * Extracts saved words for a child based on pages marked as read.
 * Matches the logic in app/account/my-words/page.tsx.
 */
export function extractSavedWords(
  childId: string,
  pageProgress: PageProgressRow[],
  vocabByBook: Record<string, VocabWord[]>,
): Array<{
  child_id: string;
  book_slug: string;
  words: VocabWord[];
}> {
  const completedByBook = new Map<string, Set<number>>();
  for (const row of pageProgress) {
    if (row.child_id === childId && row.read_completed_at) {
      let set = completedByBook.get(row.book_slug);
      if (!set) {
        set = new Set<number>();
        completedByBook.set(row.book_slug, set);
      }
      set.add(row.page_number);
    }
  }

  const result: Array<{ child_id: string; book_slug: string; words: VocabWord[] }> = [];
  for (const [bookSlug, completedPages] of completedByBook.entries()) {
    const vocab = vocabByBook[bookSlug] ?? [];
    const words = vocab.filter((w) => completedPages.has(w.page));
    result.push({
      child_id: childId,
      book_slug: bookSlug,
      words,
    });
  }
  return result;
}

export type AccountExportResult = {
  exported_at: string;
  account: {
    email: string;
  };
  child_profiles: Array<{
    id: string;
    display_name: string;
    avatar_key: string;
    created_at: string;
  }>;
  progress: {
    books: Array<{
      child_id: string;
      book_slug: string;
      last_page: number;
      started_at: string;
      last_seen_at: string;
    }>;
    pages: Array<{
      child_id: string;
      book_slug: string;
      page_number: number;
      viewed_at: string;
      read_completed_at: string | null;
      practice_completed_at: string | null;
      best_correct: number | null;
      graded_total: number | null;
      updated_at: string;
    }>;
  };
  saved_words: Array<{
    child_id: string;
    child_name: string;
    book_slug: string;
    words: VocabWord[];
  }>;
  entitlements: Array<{
    book_slug: string;
    source: string;
    starts_at: string;
    expires_at: string;
  }>;
  activations: Array<{
    id: string;
    order_number: string;
    book_slugs: string[];
    status: string;
    note: string | null;
    created_at: string;
    reviewed_at: string | null;
  }>;
  purchases: Array<{
    transaction_id: string;
    book_slug: string;
    kind: string;
    status: string;
    created_at: string;
  }>;
};

/**
 * Builds the complete structured GDPR data export for a parent account.
 * Scopes child profiles, progress, saved words and purchases strictly to this account.
 */
export function buildAccountExport(params: {
  email: string;
  profiles: ChildProfileRow[];
  bookProgress: BookProgressRow[];
  pageProgress: PageProgressRow[];
  vocabByBook: Record<string, VocabWord[]>;
  entitlements: EntitlementRow[];
  activations: ActivationRow[];
  purchases: PaddleTransactionRow[];
  exportedAt?: string;
}): AccountExportResult {
  const childIds = new Set(params.profiles.map((p) => p.id));

  // Progress strictly scoped to this parent's child profiles
  const scopedBookProgress = params.bookProgress
    .filter((bp) => childIds.has(bp.child_id))
    .map((bp) => ({
      child_id: bp.child_id,
      book_slug: bp.book_slug,
      last_page: bp.last_page,
      started_at: bp.started_at,
      last_seen_at: bp.last_seen_at,
    }));

  const scopedPageProgress = params.pageProgress
    .filter((pp) => childIds.has(pp.child_id))
    .map((pp) => ({
      child_id: pp.child_id,
      book_slug: pp.book_slug,
      page_number: pp.page_number,
      viewed_at: pp.viewed_at,
      read_completed_at: pp.read_completed_at,
      practice_completed_at: pp.practice_completed_at,
      best_correct: pp.best_correct,
      graded_total: pp.graded_total,
      updated_at: pp.updated_at,
    }));

  const savedWords: Array<{
    child_id: string;
    child_name: string;
    book_slug: string;
    words: VocabWord[];
  }> = [];

  for (const profile of params.profiles) {
    const childSaved = extractSavedWords(profile.id, scopedPageProgress, params.vocabByBook);
    for (const item of childSaved) {
      savedWords.push({
        child_id: item.child_id,
        child_name: profile.display_name,
        book_slug: item.book_slug,
        words: item.words,
      });
    }
  }

  const scopedPurchases = params.purchases.map((p) => ({
    transaction_id: p.transaction_id,
    book_slug: p.book_slug,
    kind: p.kind ?? "annual",
    status: p.status ?? "granted",
    created_at: p.created_at,
  }));

  return {
    exported_at: params.exportedAt ?? new Date().toISOString(),
    account: {
      email: params.email,
    },
    child_profiles: params.profiles.map((p) => ({
      id: p.id,
      display_name: p.display_name,
      avatar_key: p.avatar_key,
      created_at: p.created_at,
    })),
    progress: {
      books: scopedBookProgress,
      pages: scopedPageProgress,
    },
    saved_words: savedWords,
    entitlements: params.entitlements.map((e) => ({
      book_slug: e.book_slug,
      source: e.source,
      starts_at: e.starts_at,
      expires_at: e.expires_at,
    })),
    activations: params.activations.map((a) => ({
      id: a.id,
      order_number: a.order_number,
      book_slugs: a.book_slugs,
      status: a.status,
      note: a.note,
      created_at: a.created_at,
      reviewed_at: a.reviewed_at,
    })),
    purchases: scopedPurchases,
  };
}

/**
 * Pure function mirroring the SQL RPC for purchase anonymisation on deletion:
 * nulls customer_email and parent_id, while keeping transaction_id, book_slug,
 * kind, status, and created_at.
 */
export function anonymisePurchaseRecord(row: {
  transaction_id: string;
  book_slug: string;
  parent_id?: string | null;
  customer_email?: string | null;
  kind?: string | null;
  status?: string | null;
  created_at: string;
}) {
  return {
    transaction_id: row.transaction_id,
    book_slug: row.book_slug,
    parent_id: null,
    customer_email: null,
    kind: row.kind ?? null,
    status: row.status ?? null,
    created_at: row.created_at,
  };
}
