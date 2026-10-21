import "server-only";

import { AuthorizationError, type CurrentUser, isAdmin } from "@/features/auth/session";
import { getDb } from "@/lib/db";

/**
 * Admin-only data for the Instagram reference screen. The page guard and every
 * server action check authorization independently; this repeats the check next
 * to the query so a future caller cannot skip it.
 */
export async function listInstagramAdminData(actor: CurrentUser) {
  if (!isAdmin(actor)) throw new AuthorizationError(403);

  const db = getDb();
  if (!db) return { destinations: [], posts: [] };

  const [destinations, posts] = await Promise.all([
    db.destination.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, name: true, region: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    db.destinationInstagramPost.findMany({
      select: {
        id: true,
        url: true,
        creatorUsername: true,
        rightsStatus: true,
        sourceMethod: true,
        collectedAt: true,
        destination: { select: { slug: true, name: true } },
      },
      orderBy: { collectedAt: "desc" },
      take: 100,
    }),
  ]);

  return { destinations, posts };
}
