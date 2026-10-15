import type { Season } from "@/generated/prisma/enums";

/**
 * Nepal's four broad travel seasons. Month ranges are approximate and vary
 * with altitude and year; copy describes general climate patterns only.
 */
export const SEASONS = [
  {
    slug: "spring",
    value: "SPRING",
    label: "Spring",
    months: "March – May",
    description:
      "Warming days and rhododendrons in bloom across the middle hills. Afternoon haze can soften mountain views.",
  },
  {
    slug: "monsoon",
    value: "MONSOON",
    label: "Monsoon",
    months: "June – August",
    description:
      "Heavy rain turns the hills intensely green. Roads and trails can be disrupted, while rain-shadow valleys north of the main range stay drier.",
  },
  {
    slug: "autumn",
    value: "AUTUMN",
    label: "Autumn",
    months: "September – November",
    description:
      "Clear skies after the rains and the main festival season, including Dashain and Tihar. The busiest time on popular trails.",
  },
  {
    slug: "winter",
    value: "WINTER",
    label: "Winter",
    months: "December – February",
    description:
      "Crisp, clear and cold at altitude, where some high passes close. A good time for the lower hills and the Terai.",
  },
] as const satisfies ReadonlyArray<{
  slug: string;
  value: Season;
  label: string;
  months: string;
  description: string;
}>;

export type SeasonInfo = (typeof SEASONS)[number];
export type SeasonSlug = SeasonInfo["slug"];

export const SEASON_SLUGS = SEASONS.map((s) => s.slug) as [SeasonSlug, ...SeasonSlug[]];

export function getSeason(slug: string): SeasonInfo | undefined {
  return SEASONS.find((s) => s.slug === slug);
}

export function getSeasonByValue(value: Season): SeasonInfo {
  return SEASONS.find((s) => s.value === value)!;
}
