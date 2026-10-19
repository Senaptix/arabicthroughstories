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
import { weakPasswordMessage } from "@/lib/password-rules";
import { siteOrigin } from "@/lib/site-origin";
import {
  activationIssuerSecret,
  looksLikeActivationCode,
  redemptionRateKey,
} from "@/lib/activation-codes";
import { cancelPaddleSubscription, createCustomerPortalSession } from "@/lib/paddle";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { buildAccountExport } from "@/lib/account-data";
import { getAllBooks, parseVocabulary } from "@/lib/parse";

export type ActionState = { message?: string; success?: string };

const emailSchema = z.string().trim().email().max(254);
const passwordSchema = z.string().min(10).max(128);
const orderNumberSchema = z
  .string()
  .trim()
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

function signUpErrorMessage(error: AuthError, password: string) {
  switch (error.code) {
    case "email_exists":
    case "user_already_exists":
      return "An account already uses that email address. Sign in instead, or reset the password if needed.";
    case "over_email_send_rate_limit":
      return "Too many confirmation emails have just been sent. Please wait a few minutes and try again.";
    case "email_address_invalid":
      return "That email address was not accepted. Check it carefully and try again.";
    case "weak_password":
      return weakPasswordMessage(
        password,
        isAuthWeakPasswordError(error) && error.reasons.includes("pwned"),
      );
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
      orderNumber: formData.get("orderNumber") ?? "",
    });
  if (!parsed.success) {
    const orderIssue = parsed.error.issues.find(
      (issue) => issue.path[0] === "orderNumber",
    );
    if (orderIssue) return { message: orderIssue.message };
    return { message: "Use a valid email and a password of at least 10 characters." };
  }

  const supabase = await createClient();
  // The code / order number is optional: blank creates an account with no entitlement.
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

  const next = await safeNext(formData.get("next"));
  const redirectTo = `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;
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
    const actionableMessage = signUpErrorMessage(error, parsed.data.password);
    if (actionableMessage !== GENERIC_SIGN_UP_ERROR) {
      return { message: actionableMessage };
    }
    if (looksLikeActivationCode(parsed.data.orderNumber)) {
      return { message: "That activation code could not be redeemed. It may already have been used." };
    }
    return { message: GENERIC_SIGN_UP_ERROR };
  }
  redirect(
    next === "/account"
      ? "/account/sign-in?check-email=1"
      : `/account/sign-in?check-email=1&next=${encodeURIComponent(next)}`,
  );
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

/**
 * Claim a book from inside the account — the path that did not exist.
 *
 * Until now the order-number box appeared once, on the signup form, and
 * nowhere else. That dead-ended everyone whose claim came later: a parent
 * whose receipt was rejected, one whose provisional window lapsed, an event
 * buyer who already had an account, someone who signed up before the field
 * existed — and, most importantly, every existing member buying the NEXT book
 * in the series. The database always allowed it (the insert policy on
 * activations, and redeem_activation_code granted to authenticated); only the
 * form was missing.
 *
 * Same one-field rule as signup: a QK- code redeems outright, anything else
 * is treated as an Amazon order number and goes to Asma's queue.
 */
export async function claimBook(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parentId = await getParentId();
  if (!parentId) redirect("/account/sign-in?next=/account");

  const parsed = orderNumberSchema.safeParse(formData.get("orderNumber"));
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Check the number." };
  }
  const claim = parsed.data;
  const supabase = await createClient();

  // --- activation code: redeems immediately, no review ---------------------
  if (looksLikeActivationCode(claim)) {
    const { data, error } = await supabase.rpc("redeem_activation_code", {
      p_code: claim,
    });
    if (error) {
      return { message: "We could not check that code. Please try again." };
    }
    switch (data) {
      case "ok":
        revalidatePath("/account");
        return { success: "Done — your access now runs for 12 months." };
      case "already_used":
        return {
          message:
            "That activation code has already been used. Email accounts@qasaskids.com if this is unexpected.",
        };
      case "rate_limited":
        return {
          message: "Too many attempts. Please wait 15 minutes and try again.",
        };
      default:
        return {
          message: "That activation code was not recognised. Check it and try again.",
        };
    }
  }

  // --- Amazon order number: joins the review queue --------------------------
  // A parent correcting a typo will legitimately submit twice, so repeats are
  // allowed — but an identical claim already waiting is told so rather than
  // silently adding a duplicate to Asma's queue.
  const { data: existing } = await supabase
    .from("activations")
    .select("id")
    .eq("parent_id", parentId)
    .eq("order_number", claim)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return {
      success:
        "We already have that order number and are checking it. Email your receipt to receipts@qasaskids.com if you have not yet.",
    };
  }

  const { error } = await supabase
    .from("activations")
    .insert({ parent_id: parentId, order_number: claim });

  if (error) {
    return { message: "We could not record that order number. Please try again." };
  }

  revalidatePath("/account");
  return {
    success:
      "Order number received. Email your receipt to receipts@qasaskids.com and we will extend your access to 12 months.",
  };
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

export async function manageSubscription() {
  const parentId = await getParentId();
  if (!parentId) redirect("/account/sign-in");

  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("paddle_subscriptions")
    .select("subscription_id, customer_id")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub?.customer_id) {
    redirect("/account");
  }

  const portalUrl = await createCustomerPortalSession(
    sub.customer_id,
    sub.subscription_id ? [sub.subscription_id] : undefined,
  );

  if (!portalUrl) {
    redirect("/account");
  }

  redirect(portalUrl);
}

export type DownloadDataResult =
  | { ok: true; filename: string; json: string }
  | { ok: false; error: string };

/**
 * "Download my data" server action.
 * Returns a JSON file payload containing the signed-in parent's email,
 * child profiles, reading progress, saved words, entitlements, activations,
 * and purchase records. Only their own rows; no other user's data.
 */
export async function downloadMyData(): Promise<DownloadDataResult> {
  const parentId = await getParentId();
  if (!parentId) {
    return { ok: false, error: "You must be signed in to download your data." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return { ok: false, error: "Could not identify your account." };
  }

  // 1. Fetch child profiles for this parent
  const { data: profiles, error: profilesError } = await supabase
    .from("child_profiles")
    .select("id, display_name, avatar_key, created_at")
    .eq("parent_id", parentId);

  if (profilesError) {
    return { ok: false, error: "Could not load child profiles." };
  }

  const childIds = (profiles ?? []).map((p) => p.id);

  // 2. Fetch book and page progress for this parent's children
  let bookProgress: Array<{
    child_id: string;
    book_slug: string;
    last_page: number;
    started_at: string;
    last_seen_at: string;
  }> = [];
  let pageProgress: Array<{
    child_id: string;
    book_slug: string;
    page_number: number;
    viewed_at: string;
    read_completed_at: string | null;
    practice_completed_at: string | null;
    best_correct: number | null;
    graded_total: number | null;
    updated_at: string;
  }> = [];

  if (childIds.length > 0) {
    const [bpRes, ppRes] = await Promise.all([
      supabase
        .from("book_progress")
        .select("child_id, book_slug, last_page, started_at, last_seen_at")
        .in("child_id", childIds),
      supabase
        .from("page_progress")
        .select(
          "child_id, book_slug, page_number, viewed_at, read_completed_at, practice_completed_at, best_correct, graded_total, updated_at",
        )
        .in("child_id", childIds),
    ]);
    bookProgress = bpRes.data ?? [];
    pageProgress = ppRes.data ?? [];
  }

  // 3. Fetch entitlements for this parent
  const { data: entitlements, error: entError } = await supabase
    .from("entitlements")
    .select("book_slug, source, starts_at, expires_at")
    .eq("parent_id", parentId);

  if (entError) {
    return { ok: false, error: "Could not load entitlements." };
  }

  // 4. Fetch activations for this parent
  const { data: activations, error: actError } = await supabase
    .from("activations")
    .select("id, order_number, status, note, book_slugs, created_at, reviewed_at")
    .eq("parent_id", parentId);

  if (actError) {
    return { ok: false, error: "Could not load activations." };
  }

  // 5. Fetch purchase records for this parent using service role client
  // (paddle_transactions has RLS restricting SELECT for authenticated users)
  const serviceRole = getServiceRoleClient();
  const { data: purchases, error: purError } = await serviceRole
    .from("paddle_transactions")
    .select("transaction_id, book_slug, kind, status, created_at")
    .eq("parent_id", parentId);

  if (purError) {
    return { ok: false, error: "Could not load purchase records." };
  }

  // 6. Parse vocabulary for saved words calculation
  const books = getAllBooks();
  const vocabByBook: Record<string, ReturnType<typeof parseVocabulary>> = {};
  for (const book of books) {
    try {
      vocabByBook[book.slug] = parseVocabulary(book.slug);
    } catch {
      vocabByBook[book.slug] = [];
    }
  }

  const exportData = buildAccountExport({
    email: user.email,
    profiles: profiles ?? [],
    bookProgress,
    pageProgress,
    vocabByBook,
    entitlements: entitlements ?? [],
    activations: activations ?? [],
    purchases: purchases ?? [],
  });

  const dateStr = new Date().toISOString().split("T")[0];
  return {
    ok: true,
    filename: `qasas-kids-data-${dateStr}.json`,
    json: JSON.stringify(exportData, null, 2),
  };
}

/**
 * "Delete my account" server action.
 * 1. Cancels active Paddle subscriptions via Paddle API (stopping if cancellation fails).
 * 2. Anonymises paddle_transactions rows (nulls customer_email & parent_id) via security definer RPC.
 * 3. Deletes auth user via service role client (cascading deletes wipe profiles, progress, entitlements & activations).
 * 4. Signs user out and redirects to plain confirmation.
 */
export async function deleteAccount(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parentId = await getParentId();
  if (!parentId) redirect("/account/sign-in");

  const confirm = formData.get("confirm");
  if (confirm !== "DELETE") {
    return { message: "Type DELETE in capital letters to confirm account deletion." };
  }

  const supabase = await createClient();

  // 1. Cancel any active Paddle subscription via Paddle API
  const { data: subs, error: subError } = await supabase
    .from("paddle_subscriptions")
    .select("subscription_id")
    .eq("parent_id", parentId);

  if (subError) {
    return { message: "Could not check your active subscriptions. Please try again." };
  }

  if (subs && subs.length > 0) {
    for (const sub of subs) {
      if (sub.subscription_id) {
        const cancelled = await cancelPaddleSubscription(sub.subscription_id);
        if (!cancelled) {
          return {
            message:
              "We could not cancel your active subscription with Paddle. Please use Manage subscription to cancel your subscription first before deleting your account.",
          };
        }
      }
    }
  }

  // 2. Anonymise purchase records for tax before user is deleted
  const serviceRole = getServiceRoleClient();
  const { error: rpcError } = await serviceRole.rpc(
    "anonymise_paddle_transactions_for_parent",
    { p_parent: parentId },
  );

  if (rpcError) {
    console.error("Failed to anonymise paddle transactions", rpcError);
    return { message: "We could not delete your account. Please try again." };
  }

  // 3. Delete the auth user using service role so cascading deletes remove
  // profiles, progress, entitlements and activations
  const { error: deleteError } = await serviceRole.auth.admin.deleteUser(parentId);
  if (deleteError) {
    console.error("Failed to delete auth user", deleteError);
    return { message: "We could not delete your account. Please try again." };
  }

  // 4. Sign user out and clear active child cookie
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_CHILD_COOKIE);

  redirect("/account/delete?confirmed=1");
}

