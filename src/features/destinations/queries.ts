import "server-only";

import { cache } from "react";

import type { Prisma } from "@/generated/prisma/client";
import { type CategorySlug, getCategory } from "@/features/experiences/categories";
import { getTheme } from "@/features/experiences/themes";
import type { ProvinceSlug } from "@/features/regions/provinces";
import { getSeason } from "@/features/seasons/seasons";
import { getDb } from "@/lib/db";

import type { DestinationSearch } from "./schemas";
import type {
  DestinationDetail,
  DestinationListResult,
  DestinationSummary,
  LoadResult,
  SpotlightListResult,
} from "./types";

const imageSelect = {
  url: true,
  alt: true,
  caption: true,
  credit: true,
  license: true,
  sourceUrl: true,
} satisfies Prisma.DestinationImageSelect;

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
  images: { select: imageSelect, orderBy: { position: "asc" }, take: 1 },
} satisfies Prisma.DestinationSelect;

type SummaryRow = Prisma.DestinationGetPayload<{ select: typeof summarySelect }>;

const PUBLISHED = { status: "PUBLISHED" } as const;
const NEWEST_FIRST = [{ publishedAt: "desc" }, { name: "asc" }] satisfies Prisma.DestinationOrderByWithRelationInput[];

/** Keep only category slugs the UI knows about. */
function knownCategory(slug: string | undefined): CategorySlug | null {
  return slug && getCategory(slug) ? (slug as CategorySlug) : null;
}

export function toSummary(row: SummaryRow): DestinationSummary {
  return {
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    category: knownCategory(row.categories[0]?.category.slug),
    region: { slug: row.region.slug as ProvinceSlug, name: row.region.name },
    district: row.district,
    // Unverified practical details are never shown as fact.
    elevationM: row.practicalInfoStatus === "VERIFIED" ? row.elevationM : null,
    coverImage: row.images[0] ?? null,
    isSample: row.isSample,
    practicalInfoStatus: row.practicalInfoStatus,
  };
}

export function buildDestinationWhere(
  search: DestinationSearch,
): Prisma.DestinationWhereInput {
  const theme = search.theme ? getTheme(search.theme) : undefined;
  const season = search.season ? getSeason(search.season) : undefined;
  const and: Prisma.DestinationWhereInput[] = [];

  if (theme) {
    and.push({
      categories: { some: { category: { slug: { in: [...theme.categories] } } } },
    });
  }
  if (search.category) {
    and.push({ categories: { some: { category: { slug: search.category } } } });
  }
  if (search.region) and.push({ region: { slug: search.region } });
  if (season) and.push({ seasons: { some: { season: season.value } } });
  if (search.q) {
    and.push({
      OR: [
        { name: { contains: search.q, mode: "insensitive" } },
        { summary: { contains: search.q, mode: "insensitive" } },
        { district: { contains: search.q, mode: "insensitive" } },
      ],
    });
  }

  return and.length ? { ...PUBLISHED, AND: and } : { ...PUBLISHED };
}

/** Runs a query with the shared "no database / failed" handling. */
async function load<T>(label: string, run: (db: NonNullable<ReturnType<typeof getDb>>) => Promise<T>): Promise<LoadResult<T>> {
  const db = getDb();
  if (!db) return { status: "unconfigured" };
  try {
    return { status: "ok", ...(await run(db)) };
  } catch (error) {
    console.error(`[destinations] ${label} failed`, error);
    return { status: "error" };
  }
}

function listDestinations(
  label: string,
  where: Prisma.DestinationWhereInput,
  take: number,
): Promise<DestinationListResult> {
  return load(label, async (db) => {
    const rows = await db.destination.findMany({ where, take, select: summarySelect, orderBy: NEWEST_FIRST });
    return { destinations: rows.map(toSummary) };
  });
}

export function getFeaturedDestinations(limit = 6) {
  return listDestinations("featured", { ...PUBLISHED, isFeatured: true }, limit);
}

export function searchDestinations(search: DestinationSearch, limit = 24) {
  return listDestinations("search", buildDestinationWhere(search), limit);
}

export function getHiddenGems(limit = 3): Promise<SpotlightListResult> {
  return load("hidden gems", async (db) => {
    const rows = await db.destination.findMany({
      where: { ...PUBLISHED, isHiddenGem: true },
      take: limit,
      select: { ...summarySelect, description: true },
      orderBy: NEWEST_FIRST,
    });
    return {
      destinations: rows.map((row) => ({ ...toSummary(row), description: row.description })),
    };
  });
}

/** Published destinations per province, keyed by province slug. */
export function getProvinceCounts(): Promise<LoadResult<{ counts: Partial<Record<ProvinceSlug, number>> }>> {
  return load("province counts", async (db) => {
    const regions = await db.region.findMany({
      select: { slug: true, _count: { select: { destinations: { where: PUBLISHED } } } },
    });
    return {
      counts: Object.fromEntries(regions.map((r) => [r.slug, r._count.destinations])),
    };
  });
}

const detailSelect = {
  slug: true,
  name: true,
  summary: true,
  description: true,
  district: true,
  isSample: true,
  publishedAt: true,
  updatedAt: true,
  region: { select: { slug: true, name: true } },
  categories: { select: { category: { select: { slug: true } } }, orderBy: { position: "asc" } },
  images: { select: imageSelect, orderBy: { position: "asc" } },
  seasons: { select: { season: true } },
  practicalInfoStatus: true,
  practicalInfoVerifiedAt: true,
  elevationM: true,
  difficulty: true,
  suggestedDays: true,
  estimatedCostMin: true,
  estimatedCostMax: true,
  currency: true,
  costNotes: true,
  bestSeasonNotes: true,
  latitude: true,
  longitude: true,
} satisfies Prisma.DestinationSelect;

type DetailRow = Prisma.DestinationGetPayload<{ select: typeof detailSelect }>;

const SEASON_ORDER = ["SPRING", "MONSOON", "AUTUMN", "WINTER"] as const;

export function toDetail(row: DetailRow): DestinationDetail {
  const categories = row.categories
    .map((c) => knownCategory(c.category.slug))
    .filter((c): c is CategorySlug => c !== null);
  const verified = row.practicalInfoStatus === "VERIFIED" && row.practicalInfoVerifiedAt;

  return {
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    description: row.description,
    category: categories[0] ?? null,
    categories,
    region: { slug: row.region.slug as ProvinceSlug, name: row.region.name },
    district: row.district,
    images: row.images,
    isSample: row.isSample,
    practicalInfoStatus: row.practicalInfoStatus,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    practicalInfo: verified
      ? {
          verifiedAt: row.practicalInfoVerifiedAt!,
          elevationM: row.elevationM,
          difficulty: row.difficulty,
          suggestedDays: row.suggestedDays,
          cost:
            row.estimatedCostMin !== null && row.estimatedCostMax !== null
              ? {
                  min: row.estimatedCostMin,
                  max: row.estimatedCostMax,
                  currency: row.currency,
                  notes: row.costNotes,
                }
              : null,
          seasons: SEASON_ORDER.filter((s) => row.seasons.some((r) => r.season === s)),
          bestSeasonNotes: row.bestSeasonNotes,
          coordinates:
            row.latitude && row.longitude
              ? { latitude: row.latitude.toNumber(), longitude: row.longitude.toNumber() }
              : null,
        }
      : null,
  };
}

/**
 * A single published destination. Wrapped in React `cache` so metadata and
 * the page share one query per request.
 */
export const getDestinationBySlug = cache(
  (slug: string): Promise<LoadResult<{ destination: DestinationDetail | null }>> =>
    load("detail", async (db) => {
      const row = await db.destination.findFirst({
        where: { ...PUBLISHED, slug },
        select: detailSelect,
      });
      return { destination: row ? toDetail(row) : null };
    }),
);

export function getRelatedDestinations(slug: string, region: ProvinceSlug, limit = 3) {
  return listDestinations(
    "related",
    { ...PUBLISHED, slug: { not: slug }, region: { slug: region } },
    limit,
  );
}
