import "server-only";

import { z } from "zod";

import { AuthorizationError, type CurrentUser, isAdmin } from "@/features/auth/session";
import { UserRole } from "@/generated/prisma/enums";
import { getDb } from "@/lib/db";

import { recordAudit } from "./data";

/**
 * Administrative user management. Each function re-checks that the actor is
 * an admin, even though callers already did: the check sits next to the
 * data so a future caller that forgets cannot skip it.
 */

export const roleChangeSchema = z.object({
  role: z.enum(UserRole, { error: "Choose a valid role" }),
});

export type RoleChangeResult =
  | { status: "ok" }
  | { status: "not_found" }
  | { status: "self_change" };

function db() {
  const client = getDb();
  if (!client) throw new Error("Database not configured");
  return client;
}

function assertActorIsAdmin(actor: CurrentUser) {
  if (!isAdmin(actor)) throw new AuthorizationError(403);
}

export async function listUsers(actor: CurrentUser) {
  assertActorIsAdmin(actor);
  return db().user.findMany({
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}

/**
 * Admins can't change their own role. That rules out self-demotion locking
 * the last admin out; demoting a colleague always leaves the actor an admin.
 */
export async function setUserRole(
  actor: CurrentUser,
  targetUserId: string,
  role: UserRole,
): Promise<RoleChangeResult> {
  assertActorIsAdmin(actor);
  if (actor.id === targetUserId) return { status: "self_change" };

  const client = db();
  const existing = await client.user.findUnique({
    where: { id: targetUserId },
    select: { role: true },
  });
  if (!existing) return { status: "not_found" };

  await client.$transaction(async (tx) => {
    await tx.user.update({ where: { id: targetUserId }, data: { role } });
    await recordAudit(tx, actor.id, "user.role_changed", "user", targetUserId, {
      previousRole: existing.role,
      role,
    });
  });
  return { status: "ok" };
}
