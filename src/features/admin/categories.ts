import "server-only";

import type { CurrentUser } from "@/features/auth/session";

import { categoryFormSchema, type CategoryFormData } from "./category-validation";
import { adminDb, adminRead, recordAudit } from "./data";

export type AdminCategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  destinationCount: number;
  publishedCount: number;
};

export function listAdminCategories() {
  return adminRead("category list", async (db) => {
    const rows = await db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        sortOrder: true,
        _count: { select: { destinations: true } },
      },
    });

    const published = await db.destinationCategory.groupBy({
      by: ["categoryId"],
      where: { destination: { status: "PUBLISHED" } },
      _count: { _all: true },
    });
    const publishedById = new Map(published.map((row) => [row.categoryId, row._count._all]));

    return {
      categories: rows.map(
        (row): AdminCategoryRow => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          description: row.description,
          sortOrder: row.sortOrder,
          destinationCount: row._count.destinations,
          publishedCount: publishedById.get(row.id) ?? 0,
        }),
      ),
    };
  });
}

export function getAdminCategory(id: string) {
  return adminRead("category", async (db) => {
    const category = await db.category.findUnique({
      where: { id },
      select: { id: true, slug: true, name: true, description: true, sortOrder: true },
    });
    return { category };
  });
}

export type SaveCategoryResult =
  | { status: "ok" }
  | { status: "not_found" }
  | { status: "invalid"; message: string; fieldErrors: Record<string, string> }
  | { status: "error" };

export async function updateCategory(
  actor: CurrentUser,
  id: string,
  data: CategoryFormData,
): Promise<SaveCategoryResult> {
  const parsed = categoryFormSchema.safeParse(data);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    }
    return { status: "invalid", message: "Check the highlighted fields.", fieldErrors };
  }

  const db = adminDb();
  const existing = await db.category.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!existing) return { status: "not_found" };

  try {
    await db.$transaction(async (tx) => {
      await tx.category.update({
        where: { id },
        data: {
          name: parsed.data.name,
          description: parsed.data.description,
          sortOrder: parsed.data.sortOrder,
        },
      });
      await recordAudit(tx, actor.id, "category.updated", "category", id, {
        previousName: existing.name,
        name: parsed.data.name,
      });
    });
    return { status: "ok" };
  } catch (error) {
    console.error("[admin] update category failed", error);
    return { status: "error" };
  }
}
