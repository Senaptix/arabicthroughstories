"use server";

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  ACTIVE_CHILD_COOKIE,
  getParentId,
  getProfiles,
} from "@/lib/account";
import { AVATAR_KEYS } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { message?: string; success?: string };

const emailSchema = z.string().trim().email().max(254);
const passwordSchema = z.string().min(10).max(128);
const profileNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name or nickname.")
  .max(30, "Use 30 characters or fewer.")
  .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "That name contains unsupported characters.");

function safeNext(value: FormDataEntryValue | null, fallback = "/account") {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : fallback;
}

async function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  return (await headers()).get("origin") ?? "https://qasaskids.com";
}

export async function signIn(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1) })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { message: "Enter a valid email address and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { message: "The email address or password was not recognised." };
  redirect(safeNext(formData.get("next")));
}

export async function signUp(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ email: emailSchema, password: passwordSchema })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) {
    return { message: "Use a valid email and a password of at least 10 characters." };
  }

  const supabase = await createClient();
  const redirectTo = `${await siteOrigin()}/auth/callback?next=${encodeURIComponent("/account")}`;
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) return { message: "We could not create the account. Please try again." };
  redirect("/account/sign-in?check-email=1");
}

export async function sendPasswordReset(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { message: "Enter a valid email address." };

  const supabase = await createClient();
  const redirectTo = `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(
    "/account/reset-password",
  )}`;
  await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo });
  // Always use the same response so this form cannot reveal registered emails.
  return { success: "If that address has an account, a reset link is on its way." };
}

export async function resendConfirmation(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { message: "Enter a valid email address." };

  const supabase = await createClient();
  await supabase.auth.resend({
    type: "signup",
    email: parsed.data,
    options: { emailRedirectTo: `${await siteOrigin()}/account/confirm-email` },
  });
  // Keep the response identical for registered and unknown addresses.
  return { success: "If that address is awaiting confirmation, a fresh email is on its way." };
}

export async function confirmEmailToken(formData: FormData) {
  const parsed = z
    .object({
      tokenHash: z.string().min(20).max(2048),
      type: z.enum(["email", "recovery"]),
      next: z.string().optional(),
    })
    .safeParse({
      tokenHash: formData.get("tokenHash"),
      type: formData.get("type"),
      next: formData.get("next"),
    });
  if (!parsed.success) redirect("/account/sign-in?error=link");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: parsed.data.tokenHash,
    type: parsed.data.type,
  });
  if (error) redirect("/account/sign-in?error=link");
  redirect(safeNext(parsed.data.next ?? null));
}

export async function updatePassword(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ password: passwordSchema, confirm: passwordSchema })
    .refine((value) => value.password === value.confirm)
    .safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) {
    return { message: "Use matching passwords of at least 10 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { message: "That link may have expired. Request a new password reset." };
  redirect("/account?password-updated=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_CHILD_COOKIE);
  redirect("/");
}

export async function createProfile(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parentId = await getParentId();
  if (!parentId) redirect("/account/sign-in");

  const parsed = z
    .object({ displayName: profileNameSchema, avatarKey: z.enum(AVATAR_KEYS) })
    .safeParse({ displayName: formData.get("displayName"), avatarKey: formData.get("avatarKey") });
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Check the profile details." };
  if ((await getProfiles(parentId)).length >= 5) return { message: "You can create up to five child profiles." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("child_profiles")
    .insert({
      parent_id: parentId,
      display_name: parsed.data.displayName,
      avatar_key: parsed.data.avatarKey,
    })
    .select("id")
    .single();
  if (error || !data) return { message: "We could not create that profile. Please try again." };

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_CHILD_COOKIE, data.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/account");
  return { success: `${parsed.data.displayName}'s profile is ready.` };
}

export async function switchProfile(formData: FormData) {
  const parentId = await getParentId();
  if (!parentId) redirect("/account/sign-in");
  const id = z.string().uuid().safeParse(formData.get("profileId"));
  if (!id.success) redirect("/account");

  const supabase = await createClient();
  const { data } = await supabase
    .from("child_profiles")
    .select("id")
    .eq("id", id.data)
    .eq("parent_id", parentId)
    .maybeSingle();
  if (!data) redirect("/account");

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_CHILD_COOKIE, data.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/account");
  redirect("/account");
}
