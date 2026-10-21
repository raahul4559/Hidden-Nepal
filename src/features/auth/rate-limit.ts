import "server-only";

import { createHash } from "node:crypto";

import type { PrismaClient } from "@/generated/prisma/client";

/**
 * Fixed-window rate limiting stored in PostgreSQL, so limits hold across
 * serverless instances (an in-memory counter would reset per instance).
 * One atomic upsert per check; keys are hashed so no email or IP is stored.
 */

export type RateLimitRule = { name: string; limit: number; windowMs: number };

export const RATE_LIMITS = {
  /** Guessing one account's password, from anywhere. */
  loginPerEmail: { name: "login:email", limit: 5, windowMs: 15 * 60_000 },
  /** One client trying many accounts. */
  loginPerIp: { name: "login:ip", limit: 30, windowMs: 15 * 60_000 },
  registerPerIp: { name: "register:ip", limit: 5, windowMs: 60 * 60_000 },
  /** One client sending place suggestions to /contribute. */
  submissionPerIp: { name: "submission:ip", limit: 5, windowMs: 60 * 60_000 },
  /** A signed-in account sending place suggestions. */
  submissionPerUser: { name: "submission:user", limit: 10, windowMs: 60 * 60_000 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export function rateLimitKey(rule: RateLimitRule, subject: string) {
  return createHash("sha256").update(`${rule.name}:${subject}`).digest("hex");
}

export async function consumeRateLimit(
  db: PrismaClient,
  rule: RateLimitRule,
  subject: string,
  now = new Date(),
): Promise<RateLimitResult> {
  const key = rateLimitKey(rule, subject);
  const resetAt = new Date(now.getTime() + rule.windowMs);

  // Times are passed in rather than using now(): the column is a timestamp
  // without time zone, and Prisma writes it as UTC.
  const [row] = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"`;

  // Opportunistic cleanup keeps the table small without a cron job.
  if (Math.random() < 0.01) {
    await db.rateLimit.deleteMany({ where: { resetAt: { lt: now } } }).catch(() => {});
  }

  if (row.count <= rule.limit) return { ok: true };
  return {
    ok: false,
    retryAfterSeconds: Math.max(1, Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000)),
  };
}

/** Clears a counter, e.g. the per-email login limit after a successful sign-in. */
export async function resetRateLimit(db: PrismaClient, rule: RateLimitRule, subject: string) {
  await db.rateLimit.deleteMany({ where: { key: rateLimitKey(rule, subject) } });
}

/**
 * Best-effort client address. Correct only behind a proxy that overwrites
 * X-Forwarded-For (Vercel, most load balancers). Elsewhere it can be spoofed,
 * which is why sign-in is also limited per email address.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

export function formatRetryAfter(seconds: number) {
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1 ? "a minute" : `${minutes} minutes`;
}
