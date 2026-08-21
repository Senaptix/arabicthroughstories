import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { AvatarKey } from "@/lib/profile";

export const ACTIVE_CHILD_COOKIE = "qk_child";

export type ChildProfile = {
  id: string;
  display_name: string;
  avatar_key: AvatarKey;
  created_at: string;
};

export async function getParentId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || typeof data?.claims?.sub !== "string") return null;
  return data.claims.sub;
}

export async function getProfiles(parentId: string): Promise<ChildProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("child_profiles")
    .select("id, display_name, avatar_key, created_at")
    .eq("parent_id", parentId)
    .order("created_at");

  if (error) throw new Error(`Could not load child profiles: ${error.message}`);
  return (data ?? []) as ChildProfile[];
}

export async function getActiveProfile(parentId: string) {
  const cookieStore = await cookies();
  const childId = cookieStore.get(ACTIVE_CHILD_COOKIE)?.value;
  if (!childId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("child_profiles")
    .select("id, display_name, avatar_key, created_at")
    .eq("id", childId)
    .eq("parent_id", parentId)
    .maybeSingle();
  return (data as ChildProfile | null) ?? null;
}

export async function requireProgressContext() {
  const parentId = await getParentId();
  if (!parentId) return { error: "signed_out" as const };
  const profile = await getActiveProfile(parentId);
  if (!profile) return { error: "no_profile" as const };
  return { parentId, profile };
}
