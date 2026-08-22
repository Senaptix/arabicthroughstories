import { NextResponse } from "next/server";
import { requireProgressAccess } from "@/lib/access";
import { isPublishedPage, pageProgressSchema } from "@/lib/progress";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {

  const parsed = pageProgressSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isPublishedPage(parsed.data.bookSlug, parsed.data.page)) {
    return NextResponse.json({ error: "invalid_page" }, { status: 400 });
  }

  // Access is checked AFTER parsing, because it is per page: free
  // preview progress saves without an entitlement, gated pages do not.
  const context = await requireProgressAccess(parsed.data.bookSlug, parsed.data.page);
  if ("error" in context) {
    const status = context.error === "signed_out" ? 401 : context.error === "no_access" ? 403 : 409;
    return NextResponse.json(context, { status });
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const pageResult = await supabase.from("page_progress").upsert(
    {
      child_id: context.profile.id,
      book_slug: parsed.data.bookSlug,
      page_number: parsed.data.page,
      viewed_at: now,
      updated_at: now,
    },
    { onConflict: "child_id,book_slug,page_number" },
  );
  const bookResult = await supabase.from("book_progress").upsert(
    {
      child_id: context.profile.id,
      book_slug: parsed.data.bookSlug,
      last_page: parsed.data.page,
      last_seen_at: now,
    },
    { onConflict: "child_id,book_slug" },
  );

  if (pageResult.error || bookResult.error) {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
  return NextResponse.json({ saved: true, profileName: context.profile.display_name });
}
