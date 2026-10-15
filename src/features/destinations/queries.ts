import "server-only";

import { cache } from "react";

import type { Prisma } from "@/generated/prisma/client";
import { type CategorySlug, getCategory } from "@/features/experiences/categories";
import { getTheme } from "@/features/experiences/themes";
import type { ProvinceSlug } from "@/features/regions/provinces";
import { getSeason } from "@/features/seasons/seasons";
import { getDb } from "@/lib/db";

import { getBudget, getDifficulty, PAGE_SIZE } from "./filters";
import type { DestinationSearch } from "./schemas";
import type {
  DestinationDetail,
  DestinationListResult,
  DestinationSummary,
  LoadResult,
  SearchPage,
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

/** True when the search uses filters that require verified practical info. */
export function usesPracticalFilters(search: DestinationSearch): boolean {
  return Boolean(search.season || search.difficulty || search.budget);
}

export function buildDestinationWhere(
  search: DestinationSearch,
): Prisma.DestinationWhereInput {
  const theme = search.theme ? getTheme(search.theme) : undefined;
  const season = search.season ? getSeason(search.season) : undefined;
  const difficulty = search.difficulty ? getDifficulty(search.difficulty) : undefined;
  const budget = search.budget ? getBudget(search.budget) : undefined;
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
  if (search.district) {
    and.push({ district: { equals: search.district, mode: "insensitive" } });
  }

  // Practical filters never match placeholder or unverified figures.
  if (usesPracticalFilters(search)) and.push({ practicalInfoStatus: "VERIFIED" });
  if (season) and.push({ seasons: { some: { season: season.value } } });
  if (difficulty) and.push({ difficulty: difficulty.value });
  if (budget) {
    and.push({
      currency: "NPR",
      estimatedCostMin: { gte: budget.min, ...(budget.max !== null && { lte: budget.max }) },
    });
  }

  if (search.q) {
    const contains = { contains: search.q, mode: "insensitive" } as const;
    and.push({
      OR: [
        { name: contains },
        { summary: contains },
        { description: contains },
        { district: contains },
        { region: { name: contains } },
      ],
    });
  }

  return and.length ? { ...PUBLISHED, AND: and } : { ...PUBLISHED };
}

/** Stable ordering: a unique final key keeps pages from overlapping. */
export function buildDestinationOrder(
  sort: DestinationSearch["sort"],
): Prisma.DestinationOrderByWithRelationInput[] {
  return sort === "name"
    ? [{ name: "asc" }, { slug: "asc" }]
    : [{ isFeatured: "desc" }, { publishedAt: "desc" }, { name: "asc" }, { slug: "asc" }];
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

/** Paginated search for /explore and province pages. Never unbounded. */
export function searchDestinations(
  search: DestinationSearch,
  pageSize = PAGE_SIZE,
): Promise<LoadResult<SearchPage>> {
  return load("search", async (db) => {
    const where = buildDestinationWhere(search);
    const requested = search.page ?? 1;
    const [total, rows] = await db.$transaction([
      db.destination.count({ where }),
      db.destination.findMany({
        where,
        select: summarySelect,
        orderBy: buildDestinationOrder(search.sort),
        skip: (requested - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      destinations: rows.map(toSummary),
      total,
      page: requested,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      pageSize,
    };
  });
}

/** Districts that have published destinations, optionally within a province. */
export function getDistricts(region?: ProvinceSlug): Promise<LoadResult<{ districts: string[] }>> {
  return load("districts", async (db) => {
    const rows = await db.destination.findMany({
      where: { ...PUBLISHED, district: { not: null }, ...(region && { region: { slug: region } }) },
      select: { district: true },
      distinct: ["district"],
      orderBy: { district: "asc" },
      take: 100,
    });
    return { districts: rows.map((r) => r.district!).filter(Boolean) };
  });
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
  accessInfo: true,
  safetyInfo: true,
  latitude: true,
  longitude: true,
  activities: {
    select: { activity: { select: { slug: true, name: true } } },
    orderBy: { position: "asc" },
  },
  sources: {
    select: { title: true, url: true, publisher: true, accessedAt: true },
    orderBy: { position: "asc" },
  },
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
    sources: row.sources,
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
          accessInfo: row.accessInfo,
          safetyInfo: row.safetyInfo,
          activities: row.activities.map((a) => a.activity.name),
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

/** Indexable destinations for the sitemap: published and not sample content. */
export function getSitemapDestinations(): Promise<LoadResult<{ destinations: { slug: string; updatedAt: Date }[] }>> {
  return load("sitemap", async (db) => ({
    destinations: await db.destination.findMany({
      where: { ...PUBLISHED, isSample: false },
      select: { slug: true, updatedAt: true },
      orderBy: { slug: "asc" },
      take: 5000,
    }),
  }));
}
