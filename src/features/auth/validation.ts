import { z } from "zod";

/**
 * Shared by forms, Server Actions and the Auth.js `authorize` callback.
 * Schemas are `strict`-free on purpose: unknown keys such as `role` or
 * `userId` are dropped, never passed to the database.
 */

export const PASSWORD_MIN = 10;
/** Upper bound keeps hashing cost predictable (scrypt hashes any length). */
export const PASSWORD_MAX = 128;

const email = z
  .string({ error: "Enter your email address" })
  .trim()
  .min(1, "Enter your email address")
  .max(254, "Enter a valid email address")
  .pipe(z.email("Enter a valid email address"))
  .transform((v) => v.toLowerCase());

export const loginSchema = z.object({
  email,
  // Only presence and the upper bound are checked here: telling a visitor
  // their password is "too short" at sign-in leaks the policy for nothing.
  password: z
    .string({ error: "Enter your password" })
    .min(1, "Enter your password")
    .max(PASSWORD_MAX, "Incorrect email or password"),
});

export const registerSchema = z
  .object({
    name: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().trim().max(80, "Keep your name under 80 characters").optional(),
    ),
    email,
    password: z
      .string({ error: "Choose a password" })
      .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`)
      .max(PASSWORD_MAX, `Use at most ${PASSWORD_MAX} characters`),
    confirmPassword: z.string({ error: "Repeat your password" }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don’t match",
  });

export const profileSchema = z.object({
  name: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(80, "Keep your name under 80 characters").nullable(),
  ),
});

export type LoginField = keyof z.input<typeof loginSchema>;
export type RegisterField = keyof z.input<typeof registerSchema>;
export type ProfileField = keyof z.input<typeof profileSchema>;

/** Field → first message, for inline form errors. */
export function fieldErrors<F extends string>(error: z.ZodError): Partial<Record<F, string>> {
  const out: Partial<Record<F, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as F;
    out[field] ??= issue.message;
  }
  return out;
}

/**
 * Where to go after signing in. Only same-site paths are allowed, so
 * `?next=https://evil.example` or `//evil.example` cannot redirect off-site.
 */
export function safeNextPath(value: unknown, fallback = "/account"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  // Never bounce back into the auth pages themselves.
  if (/^\/(login|register)(\/|\?|$)/.test(value)) return fallback;
  return value.length > 512 ? fallback : value;
}
