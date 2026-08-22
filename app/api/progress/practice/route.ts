import { NextResponse } from "next/server";
import { requireProgressAccess } from "@/lib/access";
import { isPublishedPage, practiceProgressSchema } from "@/lib/progress";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const parsed = practiceProgressSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isPublishedPage(parsed.data.bookSlug, parsed.data.page)) {
    return NextResponse.json({ error: "invalid_progress" }, { status: 400 });
  }

  // Access is checked AFTER parsing, because it is per page: free
  // preview progress saves without an entitlement, gated pages do not.
  const context = await requireProgressAccess(parsed.data.bookSlug, parsed.data.page);
  if ("error" in context) {
    const status = context.error === "signed_out" ? 401 : context.error === "no_access" ? 403 : 409;
    return NextResponse.json(context, { status });
  }

  const supabase = await createClient();
  const current = await supabase
    .from("page_progress")
    .select("best_correct, graded_total")
    .eq("child_id", context.profile.id)
    .eq("book_slug", parsed.data.bookSlug)
    .eq("page_number", parsed.data.page)
    .maybeSingle();
  if (current.error) return NextResponse.json({ error: "save_failed" }, { status: 500 });

  const bestCorrect = Math.max(current.data?.best_correct ?? 0, parsed.data.correct);
  const gradedTotal = Math.max(current.data?.graded_total ?? 0, parsed.data.total);
  const now = new Date().toISOString();
  const { error } = await supabase.from("page_progress").upsert(
    {
      child_id: context.profile.id,
      book_slug: parsed.data.bookSlug,
      page_number: parsed.data.page,
      viewed_at: now,
      practice_completed_at: now,
      best_correct: bestCorrect,
      graded_total: gradedTotal,
      updated_at: now,
    },
    { onConflict: "child_id,book_slug,page_number" },
  );
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 500 });
  return NextResponse.json({ saved: true, profileName: context.profile.display_name });
}
