import { z } from "zod";

import { CATEGORY_SLUGS } from "@/features/experiences/categories";
import { THEME_SLUGS } from "@/features/experiences/themes";
import { PROVINCE_SLUGS } from "@/features/regions/provinces";
import { SEASON_SLUGS } from "@/features/seasons/seasons";

import { BUDGET_SLUGS, DIFFICULTY_SLUGS, SORT_SLUGS } from "./filters";

type RawParam = string | string[] | undefined;

const firstValue = (v: unknown) => (Array.isArray(v) ? v[0] : v);

/** An optional enum param: unknown values are dropped, not rejected. */
const optionalSlug = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess(firstValue, z.enum(values).optional().catch(undefined));

/** Invalid values are dropped rather than rejected so a bad link still renders. */
export const destinationSearchSchema = z.object({
  q: z.preprocess(
    firstValue,
    z
      .string()
      .trim()
      .max(80)
      .transform((v) => v || undefined)
      .optional()
      .catch(undefined),
  ),
  theme: optionalSlug(THEME_SLUGS),
  category: optionalSlug(CATEGORY_SLUGS),
  region: optionalSlug(PROVINCE_SLUGS),
  season: optionalSlug(SEASON_SLUGS),
  /** Free text matched exactly (case-insensitive); format-checked only. */
  district: z.preprocess(
    firstValue,
    z
      .string()
      .trim()
      .max(60)
      .regex(/^[\p{L}][\p{L} .'-]*$/u)
      .optional()
      .catch(undefined),
  ),
  difficulty: optionalSlug(DIFFICULTY_SLUGS),
  budget: optionalSlug(BUDGET_SLUGS),
  sort: optionalSlug(SORT_SLUGS),
  /** 1-based; out-of-range or junk values fall back to page 1. */
  page: z.preprocess(
    firstValue,
    z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
  ),
});

export type DestinationSearch = z.infer<typeof destinationSearchSchema>;

export function parseDestinationSearch(
  params: Record<string, RawParam>,
): DestinationSearch {
  return destinationSearchSchema.parse(params);
}

const PARAM_ORDER = [
  "q",
  "theme",
  "category",
  "region",
  "district",
  "season",
  "difficulty",
  "budget",
  "sort",
  "page",
] as const;

/**
 * Query string for a search, omitting empty values and defaults (page 1,
 * featured sort) so equivalent searches share one canonical URL.
 */
export function searchQueryString(search: DestinationSearch = {}): string {
  const params = new URLSearchParams();
  for (const key of PARAM_ORDER) {
    const value = search[key];
    if (value === undefined || value === "") continue;
    if (key === "page" && value === 1) continue;
    if (key === "sort" && value === "featured") continue;
    params.set(key, String(value));
  }
  return params.toString();
}

/** Builds an /explore URL. */
export function exploreHref(search: DestinationSearch = {}): string {
  const qs = searchQueryString(search);
  return qs ? `/explore?${qs}` : "/explore";
}

/** Filters that are active (everything except sort and page). */
export function activeFilterCount(search: DestinationSearch): number {
  return Object.entries(search).filter(([key, value]) => key !== "sort" && key !== "page" && Boolean(value))
    .length;
}

export function destinationHref(slug: string): `/destinations/${string}` {
  return `/destinations/${encodeURIComponent(slug)}`;
}

export function provinceHref(slug: string): `/provinces/${string}` {
  return `/provinces/${encodeURIComponent(slug)}`;
}
