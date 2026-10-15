import "server-only";

import type { CurrentUser } from "@/features/auth/session";
import { getDb } from "@/lib/db";

/**
 * Saved destinations. Every function takes the verified user from the
 * session layer and scopes its query by that user's id, so one user can
 * never read or change another user's saves. Destinations are addressed by
 * slug; database ids never round-trip through the browser.
 */

export type SaveResult = { status: "ok"; saved: boolean } | { status: "not_found" };

function db() {
  const client = getDb();
  if (!client) throw new Error("Database not configured");
  return client;
}

/** Idempotent: saving twice keeps one row (composite primary key). */
export async function saveDestination(user: CurrentUser, slug: string): Promise<SaveResult> {
  const destination = await db().destination.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!destination) return { status: "not_found" };

  await db().savedDestination.createMany({
    data: [{ userId: user.id, destinationId: destination.id }],
    skipDuplicates: true,
  });
  return { status: "ok", saved: true };
}

/** Idempotent, and only ever touches the caller's own row. */
export async function removeSavedDestination(user: CurrentUser, slug: string): Promise<SaveResult> {
  await db().savedDestination.deleteMany({
    where: { userId: user.id, destination: { slug } },
  });
  return { status: "ok", saved: false };
}

export async function isDestinationSaved(user: CurrentUser, slug: string): Promise<boolean> {
  const count = await db().savedDestination.count({
    where: { userId: user.id, destination: { slug } },
  });
  return count > 0;
}

export type SavedDestinationItem = {
  slug: string;
  name: string;
  summary: string;
  regionName: string;
  savedAt: Date;
};

/** Newest first. Unpublished destinations are hidden but the save is kept. */
export async function listSavedDestinations(user: CurrentUser): Promise<SavedDestinationItem[]> {
  const rows = await db().savedDestination.findMany({
    where: { userId: user.id, destination: { status: "PUBLISHED" } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      createdAt: true,
      destination: { select: { slug: true, name: true, summary: true, region: { select: { name: true } } } },
    },
  });
  return rows.map((r) => ({
    slug: r.destination.slug,
    name: r.destination.name,
    summary: r.destination.summary,
    regionName: r.destination.region.name,
    savedAt: r.createdAt,
  }));
}
