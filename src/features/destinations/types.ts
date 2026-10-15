import type { CategorySlug } from "@/features/experiences/categories";
import type { ProvinceSlug } from "@/features/regions/provinces";

export type DestinationCoverImage = {
  url: string;
  alt: string;
  credit: string | null;
  license: string | null;
  sourceUrl: string | null;
};

/** Card-level view of a published destination. */
export type DestinationSummary = {
  slug: string;
  name: string;
  summary: string;
  category: CategorySlug;
  region: { slug: ProvinceSlug; name: string };
  district: string | null;
  elevationM: number | null;
  coverImage: DestinationCoverImage | null;
};

/**
 * Data loaders return a tagged result so pages can tell "nothing published"
 * apart from "no database" and "query failed".
 */
export type DestinationListResult =
  | { status: "ok"; destinations: DestinationSummary[] }
  | { status: "unconfigured" }
  | { status: "error" };
