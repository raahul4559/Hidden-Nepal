"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";
import { getDb } from "@/lib/db";

import { createAccount, revokeAllSessions, updateOwnProfile } from "./accounts";
import { clientIp, consumeRateLimit, formatRetryAfter, RATE_LIMITS } from "./rate-limit";
import { AuthorizationError, getCurrentUser } from "./session";
import {
  fieldErrors,
  type LoginField,
  loginSchema,
  type ProfileField,
  profileSchema,
  type RegisterField,
  registerSchema,
  safeNextPath,
} from "./validation";

/**
 * Server Actions are public POST endpoints: each one validates its input and
 * resolves the user from the session itself. Next.js rejects cross-origin
 * calls (Origin vs Host), which is the CSRF protection for these forms.
 */

export type FormState<F extends string> =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      message: string;
      fieldErrors: Partial<Record<F, string>>;
      /** Echoed so the form keeps what was typed. Passwords are never echoed. */
      values: Partial<Record<F, string>>;
    };

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

function signInErrorMessage(error: AuthError): string {
  const code = error instanceof CredentialsSignin ? error.code : undefined;
  if (code === "rate_limited") return "Too many sign-in attempts. Please wait 15 minutes and try again.";
  if (code === "unavailable") return "Signing in isn’t available right now. Please try again later.";
  if (error instanceof CredentialsSignin) return "Incorrect email or password.";
  return "We couldn’t sign you in. Please try again.";
}

// ─── Sign in ────────────────────────────────────────────────────────────────

export async function login(_previous: FormState<LoginField>, formData: FormData): Promise<FormState<LoginField>> {
  const values = { email: str(formData.get("email")) };
  const next = safeNextPath(formData.get("next"));

  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values };
  }

  try {
    // Rate limits and password checks run in the Credentials provider, so
    // they also cover direct POSTs to /api/auth/callback/credentials.
    await signIn("credentials", { ...parsed.data, redirectTo: next });
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: "error", message: signInErrorMessage(error), fieldErrors: {}, values };
    }
    throw error; // NEXT_REDIRECT on success
  }
  return { status: "idle" };
}

// ─── Register ───────────────────────────────────────────────────────────────

export async function register(
  _previous: FormState<RegisterField>,
  formData: FormData,
): Promise<FormState<RegisterField>> {
  const values = { name: str(formData.get("name")), email: str(formData.get("email")) };
  const next = safeNextPath(formData.get("next"));

  // Only these four fields are read. A submitted `role` is never looked at.
  const parsed = registerSchema.safeParse({
    name: formData.get("name") ?? undefined,
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values };
  }

  const db = getDb();
  const unavailable = {
    status: "error",
    message: "Registration isn’t available right now. Please try again later.",
    fieldErrors: {},
    values,
  } as const;
  if (!db) return unavailable;

  const limit = await consumeRateLimit(db, RATE_LIMITS.registerPerIp, clientIp(await headers())).catch(() => null);
  if (!limit) return unavailable;
  if (!limit.ok) {
    return {
      status: "error",
      message: `Too many accounts created from this connection. Try again in ${formatRetryAfter(limit.retryAfterSeconds)}.`,
      fieldErrors: {},
      values,
    };
  }

  const result = await createAccount(parsed.data).catch((error: unknown) => {
    console.error("[auth] registration failed", error instanceof Error ? error.message : error);
    return { status: "unavailable" } as const;
  });
  if (result.status === "unavailable") return unavailable;
  if (result.status === "email_taken") {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: { email: "An account with this email already exists. Sign in instead." },
      values,
    };
  }

  try {
    await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirectTo: next });
  } catch (error) {
    if (error instanceof AuthError) redirect(`/login?${new URLSearchParams({ next, registered: "1" })}`);
    throw error;
  }
  return { status: "idle" };
}

// ─── Sign out ───────────────────────────────────────────────────────────────

export async function logout() {
  await signOut({ redirectTo: "/" });
}

/** Revokes every session for this account, including the current one. */
export async function logoutEverywhere() {
  const user = await getCurrentUser();
  if (user) await revokeAllSessions(user);
  await signOut({ redirectTo: "/login?signedOut=all" });
}

// ─── Profile ────────────────────────────────────────────────────────────────

export async function updateProfile(
  _previous: FormState<ProfileField>,
  formData: FormData,
): Promise<FormState<ProfileField>> {
  const values = { name: str(formData.get("name")) };
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: new AuthorizationError(401).message, fieldErrors: {}, values };
  }

  // Only `name` is read: email, role and id in the form data are ignored.
  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values };
  }

  try {
    await updateOwnProfile(user, parsed.data);
  } catch (error) {
    console.error("[auth] profile update failed", error instanceof Error ? error.message : error);
    return { status: "error", message: "We couldn’t save your profile. Please try again.", fieldErrors: {}, values };
  }
  return { status: "success", message: "Profile saved." };
}
