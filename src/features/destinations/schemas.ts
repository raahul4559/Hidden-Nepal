import { z } from "zod";

import { CATEGORY_SLUGS } from "@/features/experiences/categories";
import { PROVINCE_SLUGS } from "@/features/regions/provinces";

type RawParam = string | string[] | undefined;

const firstValue = (v: unknown) => (Array.isArray(v) ? v[0] : v);

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
  category: z.preprocess(
    firstValue,
    z.enum(CATEGORY_SLUGS).optional().catch(undefined),
  ),
  region: z.preprocess(
    firstValue,
    z.enum(PROVINCE_SLUGS).optional().catch(undefined),
  ),
});

export type DestinationSearch = z.infer<typeof destinationSearchSchema>;

export function parseDestinationSearch(
  params: Record<string, RawParam>,
): DestinationSearch {
  return destinationSearchSchema.parse(params);
}

/** Builds an /explore URL, omitting empty values. */
export function exploreHref(search: DestinationSearch = {}): string {
  const params = new URLSearchParams();
  if (search.q) params.set("q", search.q);
  if (search.category) params.set("category", search.category);
  if (search.region) params.set("region", search.region);
  const qs = params.toString();
  return qs ? `/explore?${qs}` : "/explore";
}
