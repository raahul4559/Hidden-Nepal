import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { PublishStatus } from "@/generated/prisma/enums";
import { detailSelect, toDetail } from "@/features/destinations/queries";
import {
  type ValidDestinationInput,
  destinationInputSchema,
} from "@/features/destinations/validation";
import type { CurrentUser } from "@/features/auth/session";

import {
  type AdminDestinationForm,
  toDestinationInput,
} from "./destination-validation";
import { adminDb, adminRead, recordAudit } from "./data";
import type { AdminListFilters } from "./list-params";

const PAGE_SIZE = 20;

export type AdminDestinationRow = {
  id: string;
  slug: string;
  name: string;
  status: PublishStatus;
  region: string;
  updatedAt: Date;
  publishedAt: Date | null;
  imageCount: number;
  categoryCount: number;
};

export function listAdminDestinations(filters: AdminListFilters) {
  return adminRead("destination list", async (db) => {
    const where: Prisma.DestinationWhereInput = {
      ...(filters.status !== "ALL" && { status: filters.status }),
      ...(filters.q && {
        OR: [
          { name: { contains: filters.q, mode: "insensitive" } },
          { slug: { contains: filters.q, mode: "insensitive" } },
          { district: { contains: filters.q, mode: "insensitive" } },
          { region: { name: { contains: filters.q, mode: "insensitive" } } },
        ],
      }),
    };

    const [total, rows] = await db.$transaction([
      db.destination.count({ where }),
      db.destination.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        skip: (filters.page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
          updatedAt: true,
          publishedAt: true,
          region: { select: { name: true } },
          _count: { select: { images: true, categories: true } },
        },
      }),
    ]);

    return {
      destinations: rows.map(
        (row): AdminDestinationRow => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          status: row.status,
          region: row.region.name,
          updatedAt: row.updatedAt,
          publishedAt: row.publishedAt,
          imageCount: row._count.images,
          categoryCount: row._count.categories,
        }),
      ),
      total,
      page: filters.page,
      pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      pageSize: PAGE_SIZE,
    };
  });
}

export function getAdminDestinationForForm(id: string) {
  return adminRead("destination form", async (db) => {
    const row = await db.destination.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        name: true,
        summary: true,
        description: true,
        status: true,
        isFeatured: true,
        isHiddenGem: true,
        isSample: true,
        district: true,
        latitude: true,
        longitude: true,
        elevationM: true,
        estimatedCostMin: true,
        estimatedCostMax: true,
        currency: true,
        costNotes: true,
        difficulty: true,
        suggestedDays: true,
        bestSeasonNotes: true,
        accessInfo: true,
        safetyInfo: true,
        practicalInfoStatus: true,
        practicalInfoVerifiedAt: true,
        updatedAt: true,
        region: { select: { slug: true } },
        categories: { select: { category: { select: { slug: true } } }, orderBy: { position: "asc" } },
        seasons: { select: { season: true } },
        activities: { select: { activity: { select: { slug: true } } }, orderBy: { position: "asc" } },
        _count: { select: { images: true } },
      },
    });
    if (!row) return { destination: null };

    return {
      destination: {
        id: row.id,
        slug: row.slug,
        name: row.name,
        summary: row.summary,
        description: row.description,
        status: row.status,
        isFeatured: row.isFeatured,
        isHiddenGem: row.isHiddenGem,
        isSample: row.isSample,
        regionSlug: row.region.slug,
        district: row.district,
        categorySlugs: row.categories.map((item) => item.category.slug),
        activitySlugs: row.activities.map((item) => item.activity.slug),
        latitude: row.latitude?.toNumber() ?? null,
        longitude: row.longitude?.toNumber() ?? null,
        elevationM: row.elevationM,
        costMin: row.estimatedCostMin,
        costMax: row.estimatedCostMax,
        currency: row.currency,
        costNotes: row.costNotes,
        difficulty: row.difficulty,
        suggestedDays: row.suggestedDays,
        seasons: row.seasons.map((item) => item.season),
        bestSeasonNotes: row.bestSeasonNotes,
        accessInfo: row.accessInfo,
        safetyInfo: row.safetyInfo,
        practicalInfoStatus: row.practicalInfoStatus,
        practicalInfoVerifiedAt: row.practicalInfoVerifiedAt,
        imageCount: row._count.images,
        updatedAt: row.updatedAt,
      },
    };
  });
}

export function getAdminDestinationPreview(id: string) {
  return adminRead("destination preview", async (db) => {
    const row = await db.destination.findUnique({ where: { id }, select: detailSelect });
    return { destination: row ? toDetail(row) : null };
  });
}

export function getAdminDestinationImages(id: string) {
  return adminRead("destination images", async (db) => {
    const row = await db.destination.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        name: true,
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
            caption: true,
            credit: true,
            license: true,
            sourceUrl: true,
            position: true,
          },
          orderBy: { position: "asc" },
        },
      },
    });
    return { destination: row };
  });
}

function destinationFields(input: ValidDestinationInput) {
  return {
    name: input.name,
    summary: input.summary,
    description: input.description ?? null,
    status: input.status,
    publishedAt: input.publishedAt ?? null,
    isFeatured: input.isFeatured,
    isHiddenGem: input.isHiddenGem,
    isSample: input.isSample,
    district: input.district ?? null,
    latitude: input.coordinates?.latitude ?? null,
    longitude: input.coordinates?.longitude ?? null,
    elevationM: input.elevationM ?? null,
    estimatedCostMin: input.cost?.min ?? null,
    estimatedCostMax: input.cost?.max ?? null,
    currency: input.cost?.currency ?? "NPR",
    costNotes: input.costNotes ?? null,
    difficulty: input.difficulty ?? null,
    suggestedDays: input.suggestedDays ?? null,
    bestSeasonNotes: input.bestSeasonNotes ?? null,
    accessInfo: input.accessInfo ?? null,
    safetyInfo: input.safetyInfo ?? null,
    practicalInfoStatus: input.practicalInfo.status,
    practicalInfoVerifiedAt: input.practicalInfo.verifiedAt ?? null,
  };
}

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

async function checkReferences(
  input: ValidDestinationInput,
): Promise<
  | { error: Record<string, string> }
  | { region: { id: string }; categories: { id: string; slug: string }[] }
> {
  const db = adminDb();
  const [region, categories, activities] = await Promise.all([
    db.region.findUnique({ where: { slug: input.regionSlug }, select: { id: true } }),
    db.category.findMany({
      where: { slug: { in: input.categorySlugs } },
      select: { id: true, slug: true },
    }),
    db.activity.count({ where: { slug: { in: input.activitySlugs } } }),
  ]);

  if (!region) return { error: { regionSlug: "Choose an existing province" } };
  if (categories.length !== input.categorySlugs.length) {
    return { error: { categorySlugs: "One or more categories no longer exist" } };
  }
  if (activities !== input.activitySlugs.length) {
    return { error: { activitySlugs: "One or more activities no longer exist" } };
  }

  return { region, categories };
}

export type SaveDestinationResult =
  | { status: "ok"; id: string; slug: string; previousSlug?: string }
  | { status: "not_found" }
  | { status: "invalid"; message: string; fieldErrors: Record<string, string> }
  | { status: "error" };

export async function createDestination(
  actor: CurrentUser,
  data: AdminDestinationForm,
): Promise<SaveDestinationResult> {
  const input = destinationInputSchema.safeParse(toDestinationInput(data));
  if (!input.success) {
    return {
      status: "invalid",
      message: "Check the highlighted fields.",
      fieldErrors: fieldErrors(input.error.issues),
    };
  }

  const references = await checkReferences(input.data);
  if ("error" in references) {
    return {
      status: "invalid",
      message: "Check the province, categories and activities.",
      fieldErrors: references.error,
    };
  }

  try {
    const created = await adminDb().$transaction(async (tx) => {
      const destination = await tx.destination.create({
        data: {
          slug: input.data.slug,
          ...destinationFields(input.data),
          regionId: references.region!.id,
          categories: {
            create: input.data.categorySlugs.map((slug, position) => ({
              position,
              category: { connect: { slug } },
            })),
          },
          seasons: { create: input.data.seasons.map((season) => ({ season })) },
          activities: {
            create: input.data.activitySlugs.map((slug, position) => ({
              position,
              activity: { connect: { slug } },
            })),
          },
        },
        select: { id: true, slug: true },
      });

      await recordAudit(tx, actor.id, "destination.created", "destination", destination.id, {
        slug: destination.slug,
        status: input.data.status,
      });
      return destination;
    });

    return { status: "ok", ...created };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        status: "invalid",
        message: "That slug is already in use.",
        fieldErrors: { slug: "That slug is already in use" },
      };
    }
    console.error("[admin] create destination failed", error);
    return { status: "error" };
  }
}

export async function updateDestination(
  actor: CurrentUser,
  id: string,
  data: AdminDestinationForm,
): Promise<SaveDestinationResult> {
  const db = adminDb();
  const existing = await db.destination.findUnique({
    where: { id },
    select: { id: true, slug: true, publishedAt: true, isSample: true },
  });
  if (!existing) return { status: "not_found" };

  const input = destinationInputSchema.safeParse(toDestinationInput(data, existing));
  if (!input.success) {
    return {
      status: "invalid",
      message: "Check the highlighted fields.",
      fieldErrors: fieldErrors(input.error.issues),
    };
  }

  const references = await checkReferences(input.data);
  if ("error" in references) {
    return {
      status: "invalid",
      message: "Check the province, categories and activities.",
      fieldErrors: references.error,
    };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.destination.update({
        where: { id },
        data: {
          slug: input.data.slug,
          ...destinationFields(input.data),
          regionId: references.region!.id,
        },
      });

      // Scalar save only: images, sources and Instagram links have their own
      // screens and must survive a content edit.
      await tx.destinationCategory.deleteMany({ where: { destinationId: id } });
      await tx.destinationCategory.createMany({
        data: input.data.categorySlugs.map((slug, position) => ({
          destinationId: id,
          categoryId: references.categories!.find((c) => c.slug === slug)!.id,
          position,
        })),
      });

      await tx.destinationSeason.deleteMany({ where: { destinationId: id } });
      if (input.data.seasons.length) {
        await tx.destinationSeason.createMany({
          data: input.data.seasons.map((season) => ({ destinationId: id, season })),
        });
      }

      await tx.destinationActivity.deleteMany({ where: { destinationId: id } });
      if (input.data.activitySlugs.length) {
        const activities = await tx.activity.findMany({
          where: { slug: { in: input.data.activitySlugs } },
          select: { id: true, slug: true },
        });
        await tx.destinationActivity.createMany({
          data: input.data.activitySlugs.map((slug, position) => ({
            destinationId: id,
            activityId: activities.find((activity) => activity.slug === slug)!.id,
            position,
          })),
        });
      }

      await recordAudit(tx, actor.id, "destination.updated", "destination", id, {
        previousSlug: existing.slug,
        slug: input.data.slug,
        status: input.data.status,
      });
    });

    return { status: "ok", id, slug: input.data.slug, previousSlug: existing.slug };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        status: "invalid",
        message: "That slug is already in use.",
        fieldErrors: { slug: "That slug is already in use" },
      };
    }
    console.error("[admin] update destination failed", error);
    return { status: "error" };
  }
}

export type DestinationStatusIntent = "publish" | "unpublish" | "archive" | "restore";

const STATUS_NEXT: Record<
  DestinationStatusIntent,
  { status: PublishStatus; audit: string }
> = {
  publish: { status: "PUBLISHED", audit: "destination.published" },
  unpublish: { status: "DRAFT", audit: "destination.unpublished" },
  archive: { status: "ARCHIVED", audit: "destination.archived" },
  restore: { status: "DRAFT", audit: "destination.restored" },
};

export async function setDestinationStatus(
  actor: CurrentUser,
  id: string,
  intent: DestinationStatusIntent,
) {
  const db = adminDb();
  const destination = await db.destination.findUnique({
    where: { id },
    select: { id: true, slug: true, status: true, publishedAt: true },
  });
  if (!destination) return { status: "not_found" as const };

  const next = STATUS_NEXT[intent];
  const publishedAt =
    next.status === "PUBLISHED" ? (destination.publishedAt ?? new Date()) : destination.publishedAt;

  await db.$transaction(async (tx) => {
    await tx.destination.update({
      where: { id },
      data: { status: next.status, publishedAt },
    });
    await recordAudit(tx, actor.id, next.audit, "destination", id, {
      slug: destination.slug,
      previousStatus: destination.status,
      status: next.status,
    });
  });

  return { status: "ok" as const, slug: destination.slug };
}
