import type { CategorySlug } from "@/features/experiences/categories";
import type { ProvinceSlug } from "@/features/regions/provinces";
import type {
  Currency,
  Difficulty,
  InfoStatus,
  Season,
} from "@/generated/prisma/enums";

export type DestinationImageView = {
  url: string;
  alt: string;
  caption: string | null;
  credit: string | null;
  license: string | null;
  sourceUrl: string | null;
};

/** A permitted Instagram permalink shown as an outbound reference. */
export type DestinationInstagramReference = {
  url: string;
  creatorUsername: string | null;
  caption: string | null;
  locationTag: string | null;
  collectedAt: Date;
};

/** Card-level view of a published destination. */
export type DestinationSummary = {
  slug: string;
  name: string;
  summary: string;
  /** Primary category: the destination's lowest-position category. */
  category: CategorySlug | null;
  region: { slug: ProvinceSlug; name: string };
  district: string | null;
  /** Only populated when practical info is VERIFIED. */
  elevationM: number | null;
  coverImage: DestinationImageView | null;
  isSample: boolean;
  practicalInfoStatus: InfoStatus;
};

/** Summary plus the long description, for editorial layouts. */
export type DestinationSpotlight = DestinationSummary & {
  description: string | null;
};

/**
 * Practical details. `null` unless they are VERIFIED: unverified or
 * placeholder figures are never handed to the UI.
 */
export type VerifiedPracticalInfo = {
  verifiedAt: Date;
  elevationM: number | null;
  difficulty: Difficulty | null;
  suggestedDays: number | null;
  cost: { min: number; max: number; currency: Currency; notes: string | null } | null;
  seasons: Season[];
  bestSeasonNotes: string | null;
  accessInfo: string | null;
  safetyInfo: string | null;
  activities: string[];
  coordinates: { latitude: number; longitude: number } | null;
};

export type DestinationDetail = Omit<DestinationSummary, "elevationM" | "coverImage"> & {
  description: string | null;
  categories: CategorySlug[];
  images: DestinationImageView[];
  /** Only rightsStatus PERMITTED is selected. */
  instagramPosts: DestinationInstagramReference[];
  practicalInfo: VerifiedPracticalInfo | null;
  /** References for the published text, shown regardless of verification. */
  sources: { title: string; url: string; publisher: string | null; accessedAt: Date | null }[];
  publishedAt: Date | null;
  updatedAt: Date;
};

/**
 * Data loaders return a tagged result so pages can tell "nothing published"
 * apart from "no database" and "query failed".
 */
export type LoadResult<T> =
  | ({ status: "ok" } & T)
  | { status: "unconfigured" }
  | { status: "error" };

export type DestinationListResult = LoadResult<{ destinations: DestinationSummary[] }>;

export type SearchPage = {
  destinations: DestinationSummary[];
  total: number;
  /** The requested page; may exceed pageCount when the URL asks for too much. */
  page: number;
  pageCount: number;
  pageSize: number;
};
export type SpotlightListResult = LoadResult<{ destinations: DestinationSpotlight[] }>;
