"use server";

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  isAuthWeakPasswordError,
  type AuthError,
} from "@supabase/supabase-js";
import { z } from "zod";
import {
  ACTIVE_CHILD_COOKIE,
  getParentId,
  getProfiles,
} from "@/lib/account";
import { AVATAR_KEYS } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/safe-redirect";
import {
  activationIssuerSecret,
  looksLikeActivationCode,
  redemptionRateKey,
} from "@/lib/activation-codes";

export type ActionState = { message?: string; success?: string };

const emailSchema = z.string().trim().email().max(254);
const passwordSchema = z.string().min(10).max(128);
const orderNumberSchema = z
  .string()
  .trim()
  .min(1, "Enter your Amazon order number or activation code.")
  .max(100, "Use 100 characters or fewer for the order number.")
  .refine(
    (value) => !/[\u0000-\u001f\u007f]/.test(value),
    "That order number contains unsupported characters.",
  );
const profileNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name or nickname.")
  .max(30, "Use 30 characters or fewer.")
  .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "That name contains unsupported characters.");

const GENERIC_SIGN_UP_ERROR = "We could not create the account. Please try again.";

function signUpErrorMessage(error: AuthError) {
  switch (error.code) {
    case "email_exists":
    case "user_already_exists":
      return "An account already uses that email address. Sign in instead, or reset the password if needed.";
    case "over_email_send_rate_limit":
      return "Too many confirmation emails have just been sent. Please wait a few minutes and try again.";
    case "email_address_invalid":
      return "That email address was not accepted. Check it carefully and try again.";
    case "weak_password":
      if (isAuthWeakPasswordError(error)) {
        if (error.reasons.includes("pwned")) {
          return "Choose a different password. That one has appeared in a known data breach.";
        }
        if (error.reasons.includes("characters")) {
          return "Your password needs at least one lowercase letter, one uppercase letter, one number and one symbol.";
        }
        if (error.reasons.includes("length")) {
          return "Choose a longer password and try again.";
        }
      }
      return "Choose a longer password with at least one lowercase letter, one uppercase letter, one number and one symbol.";
    default:
      return GENERIC_SIGN_UP_ERROR;
  }
}

/**
 * Resolve a caller-supplied `next` against our own origin.
 *
 * This was a `startsWith("/")` check, which `/\evil.com` walks straight
 * through — see lib/safe-redirect.ts for why, and for why the guard now lives
 * in one place. It is async only because the origin comes from siteOrigin();
 * the check itself is shared with the auth callback, so the two can no longer
 * drift apart.
 */
async function safeNext(
  value: FormDataEntryValue | null,
  fallback = "/account",
) {
  return safeRedirectPath(value, await siteOrigin(), fallback);
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
  redirect(await safeNext(formData.get("next")));
}

export async function signUp(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      email: emailSchema,
      password: passwordSchema,
      orderNumber: orderNumberSchema,
    })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      orderNumber: formData.get("orderNumber"),
    });
  if (!parsed.success) {
    const orderIssue = parsed.error.issues.find(
      (issue) => issue.path[0] === "orderNumber",
    );
    if (orderIssue) return { message: orderIssue.message };
    return { message: "Use a valid email and a password of at least 10 characters." };
  }

  const supabase = await createClient();
  if (looksLikeActivationCode(parsed.data.orderNumber)) {
    let issuerSecret: string;
    try {
      issuerSecret = activationIssuerSecret();
    } catch {
      return { message: "Activation codes are temporarily unavailable. Please try again later." };
    }

    const requestHeaders = await headers();
    const forwardedFor = requestHeaders.get("x-forwarded-for");
    const clientAddress = requestHeaders.get("x-real-ip")
      ?? forwardedFor?.split(",").at(-1)?.trim()
      ?? null;
    const { data, error } = await supabase.rpc("check_activation_code_for_signup", {
      p_code: parsed.data.orderNumber,
      p_rate_key: redemptionRateKey(
        parsed.data.email,
        clientAddress,
      ),
      p_issuer_secret: issuerSecret,
    });

    if (error || data === "not_authorised") {
      return { message: "Activation codes are temporarily unavailable. Please try again later." };
    }
    if (data === "rate_limited") {
      return { message: "Too many activation-code attempts. Please wait 15 minutes and try again." };
    }
    if (data === "already_used") {
      return { message: "That activation code has already been used. Email accounts@qasaskids.com if this is unexpected." };
    }
    if (data !== "ok") {
      return { message: "That activation code was not recognised. Check it and try again." };
    }
  }

  const redirectTo = `${await siteOrigin()}/auth/callback?next=${encodeURIComponent("/account")}`;
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: redirectTo,
      data: { order_number: parsed.data.orderNumber },
    },
  });
  if (error) {
    // Do not log the email, password, order number or Supabase's raw message.
    // The stable code and HTTP status are enough to diagnose production auth.
    console.error("Supabase sign-up failed", {
      code: error.code ?? "unknown",
      status: error.status ?? null,
    });
    const actionableMessage = signUpErrorMessage(error);
    if (actionableMessage !== GENERIC_SIGN_UP_ERROR) {
      return { message: actionableMessage };
    }
    if (looksLikeActivationCode(parsed.data.orderNumber)) {
      return { message: "That activation code could not be redeemed. It may already have been used." };
    }
    return { message: GENERIC_SIGN_UP_ERROR };
  }
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
  redirect(await safeNext(parsed.data.next ?? null));
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

/**
 * Rename a child profile.
 *
 * Children outgrow the name they were signed up with, and a nickname typed
 * by a parent in a hurry should not be permanent.
 *
 * Scoped twice over: the `.eq("parent_id", ...)` below, and the RLS policy on
 * child_profiles. Either alone would do; both means a mistake in one is not a
 * way into another family's profiles.
 */
export async function renameProfile(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parentId = await getParentId();
  if (!parentId) redirect("/account/sign-in");

  const parsed = z
    .object({ profileId: z.string().uuid(), displayName: profileNameSchema })
    .safeParse({
      profileId: formData.get("profileId"),
      displayName: formData.get("displayName"),
    });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Check the name." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("child_profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", parsed.data.profileId)
    .eq("parent_id", parentId)
    .select("id")
    .maybeSingle();

  // No row back means the profile is not this parent's, or does not exist.
  // Same message either way — which of the two it is, is not theirs to learn.
  if (error || !data) {
    return { message: "We could not rename that profile. Please try again." };
  }

  revalidatePath("/account");
  return { success: `Renamed to ${parsed.data.displayName}.` };
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
