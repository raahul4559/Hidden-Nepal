import "server-only";

import type {
  ExperienceCategory,
  Prisma,
} from "@/generated/prisma/client";
import type { CategorySlug } from "@/features/experiences/categories";
import type { ProvinceSlug } from "@/features/regions/provinces";
import { getDb } from "@/lib/db";

import type { DestinationSearch } from "./schemas";
import type { DestinationListResult, DestinationSummary } from "./types";

const CATEGORY_TO_DB = {
  waterfalls: "WATERFALL",
  villages: "VILLAGE",
  lakes: "LAKE",
  treks: "TREK",
  heritage: "HERITAGE",
  food: "FOOD",
  culture: "CULTURE",
} as const satisfies Record<CategorySlug, ExperienceCategory>;

const CATEGORY_FROM_DB = Object.fromEntries(
  Object.entries(CATEGORY_TO_DB).map(([slug, value]) => [value, slug]),
) as Record<ExperienceCategory, CategorySlug>;

const summarySelect = {
  slug: true,
  name: true,
  summary: true,
  category: true,
  district: true,
  elevationM: true,
  coverImageUrl: true,
  coverImageAlt: true,
  coverImageCredit: true,
  coverImageLicense: true,
  coverImageSourceUrl: true,
  region: { select: { slug: true, name: true } },
} satisfies Prisma.DestinationSelect;

type SummaryRow = Prisma.DestinationGetPayload<{
  select: typeof summarySelect;
}>;

function toSummary(row: SummaryRow): DestinationSummary {
  return {
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    category: CATEGORY_FROM_DB[row.category],
    region: { slug: row.region.slug as ProvinceSlug, name: row.region.name },
    district: row.district,
    elevationM: row.elevationM,
    coverImage: row.coverImageUrl
      ? {
          url: row.coverImageUrl,
          alt: row.coverImageAlt ?? "",
          credit: row.coverImageCredit,
          license: row.coverImageLicense,
          sourceUrl: row.coverImageSourceUrl,
        }
      : null,
  };
}

export function buildDestinationWhere(
  search: DestinationSearch,
): Prisma.DestinationWhereInput {
  return {
    status: "PUBLISHED",
    ...(search.category && { category: CATEGORY_TO_DB[search.category] }),
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
