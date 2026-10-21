import "server-only";

import { adminRead } from "./data";

export function getAdminReferenceOptions() {
  return adminRead("reference options", async (db) => {
    const [regions, categories, activities] = await Promise.all([
      db.region.findMany({
        select: { slug: true, name: true },
        orderBy: { sortOrder: "asc" },
      }),
      db.category.findMany({
        select: { slug: true, name: true },
        orderBy: { sortOrder: "asc" },
      }),
      db.activity.findMany({
        select: { slug: true, name: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);
    return { regions, categories, activities };
  });
}
