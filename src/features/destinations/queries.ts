import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { getCategory, type CategorySlug } from "@/features/experiences/categories";
import type { ProvinceSlug } from "@/features/regions/provinces";
import { getDb } from "@/lib/db";

import type { DestinationSearch } from "./schemas";
import type { DestinationListResult, DestinationSummary } from "./types";

const summarySelect = {
  slug: true,
  name: true,
  summary: true,
  district: true,
  elevationM: true,
  isSample: true,
  practicalInfoStatus: true,
  region: { select: { slug: true, name: true } },
  categories: {
    select: { category: { select: { slug: true } } },
    orderBy: { position: "asc" },
    take: 1,
  },
  images: {
    select: { url: true, alt: true, credit: true, license: true, sourceUrl: true },
    orderBy: { position: "asc" },
    take: 1,
  },
} satisfies Prisma.DestinationSelect;

type SummaryRow = Prisma.DestinationGetPayload<{ select: typeof summarySelect }>;

export function toSummary(row: SummaryRow): DestinationSummary {
  const primary = row.categories[0]?.category.slug;
  const cover = row.images[0];
  return {
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    // Ignore categories the UI doesn't know rather than crash.
    category: primary && getCategory(primary) ? (primary as CategorySlug) : null,
    region: { slug: row.region.slug as ProvinceSlug, name: row.region.name },
    district: row.district,
    // Unverified practical details are never shown as fact.
    elevationM: row.practicalInfoStatus === "VERIFIED" ? row.elevationM : null,
    coverImage: cover
      ? {
          url: cover.url,
          alt: cover.alt,
          credit: cover.credit,
          license: cover.license,
          sourceUrl: cover.sourceUrl,
        }
      : null,
    isSample: row.isSample,
    practicalInfoStatus: row.practicalInfoStatus,
  };
}

export function buildDestinationWhere(
  search: DestinationSearch,
): Prisma.DestinationWhereInput {
  return {
    status: "PUBLISHED",
    ...(search.category && {
      categories: { some: { category: { slug: search.category } } },
    }),
    ...(search.region && { region: { slug: search.region } }),
    ...(search.q && {
      OR: [
        { name: { contains: search.q, mode: "insensitive" } },
        { summary: { contains: search.q, mode: "insensitive" } },
        { district: { contains: search.q, mode: "insensitive" } },
      ],
    }),
  };
}

async function listDestinations(
  args: Pick<Prisma.DestinationFindManyArgs, "where" | "take">,
): Promise<DestinationListResult> {
  const db = getDb();
  if (!db) return { status: "unconfigured" };

  try {
    const rows = await db.destination.findMany({
      ...args,
      select: summarySelect,
      orderBy: [{ publishedAt: "desc" }, { name: "asc" }],
    });
    return { status: "ok", destinations: rows.map(toSummary) };
  } catch (error) {
    console.error("[destinations] query failed", error);
    return { status: "error" };
  }
}

export function getFeaturedDestinations(limit = 6) {
  return listDestinations({
    where: { status: "PUBLISHED", isFeatured: true },
    take: limit,
  });
}

export function searchDestinations(search: DestinationSearch, limit = 24) {
  return listDestinations({ where: buildDestinationWhere(search), take: limit });
}
