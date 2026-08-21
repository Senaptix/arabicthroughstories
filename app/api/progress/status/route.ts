import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireProgressContext } from "@/lib/account";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const context = await requireProgressContext();
  if ("error" in context) return NextResponse.json(context, { status: context.error === "signed_out" ? 401 : 409 });
  const bookSlug = z.string().regex(/^[a-z0-9-]+$/).safeParse(request.nextUrl.searchParams.get("book"));
  if (!bookSlug.success) return NextResponse.json({ error: "invalid_book" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("page_progress")
    .select("page_number, read_completed_at, practice_completed_at, best_correct, graded_total")
    .eq("child_id", context.profile.id)
    .eq("book_slug", bookSlug.data);
  if (error) return NextResponse.json({ error: "load_failed" }, { status: 500 });
  return NextResponse.json({ profileName: context.profile.display_name, pages: data ?? [] });
}
