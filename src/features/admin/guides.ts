import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { PublishStatus } from "@/generated/prisma/enums";
import type { CurrentUser } from "@/features/auth/session";

import { adminDb, adminRead, recordAudit } from "./data";
import type { GuideFormData } from "./guide-validation";
import type { AdminListFilters } from "./list-params";

const PAGE_SIZE = 20;

export type AdminGuideRow = {
  id: string;
  slug: string;
  title: string;
  status: PublishStatus;
  updatedAt: Date;
  publishedAt: Date | null;
  author: { name: string | null; email: string } | null;
};

export function listAdminGuides(filters: AdminListFilters) {
  return adminRead("guide list", async (db) => {
    const where: Prisma.TravelGuideWhereInput = {
      ...(filters.status !== "ALL" && { status: filters.status }),
      ...(filters.q && {
        OR: [
          { title: { contains: filters.q, mode: "insensitive" } },
          { slug: { contains: filters.q, mode: "insensitive" } },
          { excerpt: { contains: filters.q, mode: "insensitive" } },
        ],
      }),
    };

    const [total, rows] = await db.$transaction([
      db.travelGuide.count({ where }),
      db.travelGuide.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        skip: (filters.page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          updatedAt: true,
          publishedAt: true,
          author: { select: { name: true, email: true } },
        },
      }),
    ]);

    return {
      guides: rows,
      total,
      page: filters.page,
      pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      pageSize: PAGE_SIZE,
    };
  });
}

export function getAdminGuide(id: string) {
  return adminRead("guide form", async (db) => {
    const guide = await db.travelGuide.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        body: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        author: { select: { name: true, email: true } },
      },
    });
    return { guide };
  });
}

export function getAdminGuidePreview(id: string) {
  return adminRead("guide preview", async (db) => {
    const guide = await db.travelGuide.findUnique({
      where: { id },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        body: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        author: { select: { name: true, email: true } },
      },
    });
    return { guide };
  });
}

export type SaveGuideResult =
  | { status: "ok"; id: string; slug: string; previousSlug?: string }
  | { status: "not_found" }
  | { status: "invalid"; message: string; fieldErrors: Record<string, string> }
  | { status: "error" };

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

export async function createGuide(
  actor: CurrentUser,
  data: GuideFormData,
): Promise<SaveGuideResult> {
  try {
    const guide = await adminDb().$transaction(async (tx) => {
      const created = await tx.travelGuide.create({
        data: {
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt ?? null,
          body: data.body,
          status: data.status,
          publishedAt: data.status === "PUBLISHED" ? new Date() : null,
          authorId: actor.id,
        },
        select: { id: true, slug: true },
      });
      await recordAudit(tx, actor.id, "guide.created", "guide", created.id, {
        slug: created.slug,
        status: data.status,
      });
      return created;
    });
    return { status: "ok", ...guide };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        status: "invalid",
        message: "That slug is already in use.",
        fieldErrors: { slug: "That slug is already in use" },
      };
    }
    console.error("[admin] create guide failed", error);
    return { status: "error" };
  }
}

export async function updateGuide(
  actor: CurrentUser,
  id: string,
  data: GuideFormData,
): Promise<SaveGuideResult> {
  const db = adminDb();
  const existing = await db.travelGuide.findUnique({
    where: { id },
    select: { id: true, slug: true, publishedAt: true },
  });
  if (!existing) return { status: "not_found" };

  const publishedAt =
    data.status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt;

  try {
    await db.$transaction(async (tx) => {
      await tx.travelGuide.update({
        where: { id },
        data: {
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt ?? null,
          body: data.body,
          status: data.status,
          publishedAt,
        },
      });
      await recordAudit(tx, actor.id, "guide.updated", "guide", id, {
        previousSlug: existing.slug,
        slug: data.slug,
        status: data.status,
      });
    });
    return { status: "ok", id, slug: data.slug, previousSlug: existing.slug };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        status: "invalid",
        message: "That slug is already in use.",
        fieldErrors: { slug: "That slug is already in use" },
      };
    }
    console.error("[admin] update guide failed", error);
    return { status: "error" };
  }
}

export type GuideStatusIntent = "publish" | "unpublish" | "archive" | "restore";

const STATUS_NEXT: Record<GuideStatusIntent, { status: PublishStatus; audit: string }> = {
  publish: { status: "PUBLISHED", audit: "guide.published" },
  unpublish: { status: "DRAFT", audit: "guide.unpublished" },
  archive: { status: "ARCHIVED", audit: "guide.archived" },
  restore: { status: "DRAFT", audit: "guide.restored" },
};

export async function setGuideStatus(
  actor: CurrentUser,
  id: string,
  intent: GuideStatusIntent,
) {
  const db = adminDb();
  const guide = await db.travelGuide.findUnique({
    where: { id },
    select: { id: true, slug: true, status: true, publishedAt: true },
  });
  if (!guide) return { status: "not_found" as const };

  const next = STATUS_NEXT[intent];
  const publishedAt =
    next.status === "PUBLISHED" ? (guide.publishedAt ?? new Date()) : guide.publishedAt;

  await db.$transaction(async (tx) => {
    await tx.travelGuide.update({
      where: { id },
      data: { status: next.status, publishedAt },
    });
    await recordAudit(tx, actor.id, next.audit, "guide", id, {
      slug: guide.slug,
      previousStatus: guide.status,
      status: next.status,
    });
  });

  return { status: "ok" as const, slug: guide.slug };
}

/** Exposed for validation tests without touching the database. */
export function guideValidationFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  return fieldErrors(issues);
}
