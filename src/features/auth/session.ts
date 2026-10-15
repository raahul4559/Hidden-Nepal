import "server-only";

import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { auth } from "@/auth";
import type { UserRole } from "@/generated/prisma/enums";
import { getDb } from "@/lib/db";

/**
 * Data Access Layer for identity. Every page, Server Action and Route Handler
 * gets the current user from here, never from the request body, the URL or a
 * hidden field.
 */

/** The narrow user object handed to the rest of the app. */
export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

/** 401: not signed in. 403: signed in without permission. */
export class AuthorizationError extends Error {
  constructor(readonly status: 401 | 403) {
    super(status === 401 ? "Sign in required" : "You don’t have permission to do that");
    this.name = "AuthorizationError";
  }
}

/**
 * Resolves the signed-in user from the session cookie, re-reading role and
 * session version from the database. Returns null when signed out, when the
 * account no longer exists, or when its sessions have been revoked.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Always request-time: Auth.js re-encrypts the rolling session token (random
  // IV), which Cache Components forbids during prerendering and prefetching.
  await connection();
  const session = await auth();
  const id = session?.user?.id;
  const version = session?.sessionVersion;
  if (!id || typeof version !== "number") return null;

  const db = getDb();
  if (!db) return null;

  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, sessionVersion: true },
  });
  if (!user || user.sessionVersion !== version) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
});

export function isAdmin(user: Pick<CurrentUser, "role"> | null): boolean {
  return user?.role === "ADMIN";
}

export function loginHref(next: string) {
  return `/login?${new URLSearchParams({ next })}`;
}

// ─── Pages: redirect or 404 ─────────────────────────────────────────────────

/** For protected pages. Signed-out visitors are sent to sign in. */
export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(loginHref(returnTo));
  return user;
}

/** For admin pages. Non-admins get a 404 so the area isn't advertised. */
export async function requireAdminPage(returnTo: string): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  if (!isAdmin(user)) notFound();
  return user;
}

// ─── Server Actions and Route Handlers: throw AuthorizationError ────────────

export async function assertUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError(401);
  return user;
}

export async function assertAdmin(): Promise<CurrentUser> {
  const user = await assertUser();
  if (!isAdmin(user)) throw new AuthorizationError(403);
  return user;
}
