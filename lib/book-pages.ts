// Server-only by use; no "server-only" import so self-checks run under tsx.
import fs from "node:fs";
import path from "node:path";
import { getServiceRoleClient } from "./supabase/service-role";

export type SignedUrlCreator = (
  path: string,
  expiresIn: number,
) => Promise<string | null>;

/**
 * Returns the public cover URL if one exists in public/book/<slug>/01.webp.
 * Page 1 (cover) is not in the bucket: use the existing public cover if there is one.
 */
export function getPublicCoverUrl(slug: string): string | null {
  const filePath = path.join(process.cwd(), "public", "book", slug, "01.webp");
  return fs.existsSync(filePath) ? `/book/${slug}/01.webp` : null;
}

/**
 * Creates a signed URL with a 600-second expiry using the server/service-role
 * Supabase client in lib/supabase/service-role.ts.
 */
export async function createBookPageSignedUrl(
  filePath: string,
  expiresIn = 600,
): Promise<string | null> {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase.storage
      .from("book-pages")
      .createSignedUrl(filePath, expiresIn);

    if (error || !data?.signedUrl) {
      console.error(`Failed to sign URL for ${filePath}:`, error?.message);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error(`Error creating signed URL for ${filePath}:`, err);
    return null;
  }
}

export type PageImageOptions = {
  bookSlug: string;
  page: number;
  canView: boolean;
  createSignedUrl?: SignedUrlCreator;
};

/**
 * Resolves the illustration URL for a book page.
 *
 * Rules:
 * - If canView is false, NEVER generate a signed URL and return null.
 * - Ibrahim pages 1-10 keep using public/book/ibrahim for everyone.
 * - Page 1 (cover) is not in the bucket: use the existing public cover if there is one.
 * - For entitled readers, full pages live in the private Supabase Storage bucket
 *   `book-pages` at <book>/<NN>.webp, signed for 600 seconds.
 */
export async function getPageImageUrl({
  bookSlug,
  page,
  canView,
  createSignedUrl = createBookPageSignedUrl,
}: PageImageOptions): Promise<string | null> {
  // If canViewPage() fails, keep current behaviour (preview or paywall).
  // Never generate a signed URL for a reader who fails the check.
  if (!canView) {
    return null;
  }

  const pad = String(page).padStart(2, "0");

  // Ibrahim pages 1-10 keep using public/book/ibrahim for everyone.
  if (bookSlug === "ibrahim" && page <= 10) {
    return `/book/ibrahim/${pad}.webp`;
  }

  // Page 1 (cover) is not in the bucket: use the existing public cover if there is one.
  if (page === 1) {
    return getPublicCoverUrl(bookSlug);
  }

  // Full pages live in the PRIVATE Supabase Storage bucket `book-pages` at <book>/<NN>.webp
  const storagePath = `${bookSlug}/${pad}.webp`;
  return await createSignedUrl(storagePath, 600);
}
