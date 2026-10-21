import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { LoadResult } from "@/features/destinations/types";
import { getDb } from "@/lib/db";

/** Runs an admin read with the same explicit failure states as public queries. */
export async function adminRead<T>(
  label: string,
  run: (db: NonNullable<ReturnType<typeof getDb>>) => Promise<T>,
): Promise<LoadResult<T>> {
  const db = getDb();
  if (!db) return { status: "unconfigured" };
  try {
    return { status: "ok", ...(await run(db)) };
  } catch (error) {
    console.error(`[admin] ${label} failed`, error);
    return { status: "error" };
  }
}

export function adminDb(): NonNullable<ReturnType<typeof getDb>> {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  return db;
}

export async function recordAudit(
  tx: Prisma.TransactionClient,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata?: Prisma.InputJsonValue,
) {
  await tx.auditLog.create({
    data: { actorId, action, entityType, entityId, ...(metadata !== undefined && { metadata }) },
  });
}
