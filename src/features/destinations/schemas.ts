import { z } from "zod";

import { CATEGORY_SLUGS } from "@/features/experiences/categories";
import { THEME_SLUGS } from "@/features/experiences/themes";
import { PROVINCE_SLUGS } from "@/features/regions/provinces";
import { SEASON_SLUGS } from "@/features/seasons/seasons";

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
});

export type DestinationSearch = z.infer<typeof destinationSearchSchema>;

export function parseDestinationSearch(
  params: Record<string, RawParam>,
): DestinationSearch {
  return destinationSearchSchema.parse(params);
}

const PARAM_ORDER = ["q", "theme", "category", "region", "season"] as const;

/** Builds an /explore URL, omitting empty values. */
export function exploreHref(search: DestinationSearch = {}): string {
  const params = new URLSearchParams();
  for (const key of PARAM_ORDER) {
    const value = search[key];
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/explore?${qs}` : "/explore";
}

export function destinationHref(slug: string): `/destinations/${string}` {
  return `/destinations/${encodeURIComponent(slug)}`;
}
