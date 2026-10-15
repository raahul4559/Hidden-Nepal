import "server-only";

import { getDb } from "@/lib/db";

import { needsRehash, hashPassword, verifyAgainstDummy, verifyPassword } from "./password";
import { clientIp, consumeRateLimit, RATE_LIMITS, resetRateLimit } from "./rate-limit";
import { loginSchema } from "./validation";

/** What a successful sign-in puts in the session token. Nothing else. */
export type SignedInUser = { id: string; sessionVersion: number };

export type CredentialsResult =
  | { status: "ok"; user: SignedInUser }
  | { status: "invalid" }
  | { status: "rate_limited"; retryAfterSeconds: number }
  | { status: "unavailable" };

/**
 * Checks an email/password pair. Used by the Auth.js Credentials provider, so
 * it guards both the login form and direct POSTs to /api/auth/callback.
 *
 * Unknown email and wrong password return the same result in similar time.
 */
export async function checkCredentials(raw: unknown, headers: Headers): Promise<CredentialsResult> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid" };
  const { email, password } = parsed.data;

  const db = getDb();
  if (!db) return { status: "unavailable" };

  try {
    const [byEmail, byIp] = await Promise.all([
      consumeRateLimit(db, RATE_LIMITS.loginPerEmail, email),
      consumeRateLimit(db, RATE_LIMITS.loginPerIp, clientIp(headers)),
    ]);
    if (!byEmail.ok || !byIp.ok) {
      const retry = Math.max(
        byEmail.ok ? 0 : byEmail.retryAfterSeconds,
        byIp.ok ? 0 : byIp.retryAfterSeconds,
      );
      return { status: "rate_limited", retryAfterSeconds: retry };
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, sessionVersion: true },
    });
    const valid = user?.passwordHash
      ? await verifyPassword(password, user.passwordHash)
      : await verifyAgainstDummy(password);
    if (!user || !valid) return { status: "invalid" };

    await resetRateLimit(db, RATE_LIMITS.loginPerEmail, email);
    if (needsRehash(user.passwordHash!)) {
      await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
    }
    return { status: "ok", user: { id: user.id, sessionVersion: user.sessionVersion } };
  } catch (error) {
    // Log the failure, never the submitted credentials.
    console.error("[auth] credential check failed", error instanceof Error ? error.message : error);
    return { status: "unavailable" };
  }
}
