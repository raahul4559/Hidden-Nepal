import type { PhotoKey } from "@/content/photos";

/**
 * Experience categories as they appear in URLs and UI. The database stores
 * these as the `ExperienceCategory` enum; the mapping lives server-side in
 * src/features/destinations/queries.ts.
 */
export const CATEGORIES = [
  {
    slug: "waterfalls",
    label: "Hidden waterfalls",
    shortLabel: "Waterfalls",
    description: "Cascades tucked into river gorges and forested hillsides.",
    photo: "waterfalls",
  },
  {
    slug: "villages",
    label: "Remote villages",
    shortLabel: "Villages",
    description: "Settlements where daily life still follows the seasons.",
    photo: "villages",
  },
  {
    slug: "lakes",
    label: "Himalayan lakes",
    shortLabel: "Lakes",
    description: "Glacial and high-altitude lakes beneath the peaks.",
    photo: "lakes",
  },
  {
    slug: "treks",
    label: "Trekking routes",
    shortLabel: "Treks",
    description: "Trails from gentle ridge walks to high mountain passes.",
    photo: "treks",
  },
  {
    slug: "heritage",
    label: "Cultural heritage",
    shortLabel: "Heritage",
    description: "Temples, durbar squares and living craft traditions.",
    photo: "heritage",
  },
  {
    slug: "food",
    label: "Regional food",
    shortLabel: "Food",
    description: "Kitchens and recipes that change from valley to valley.",
    photo: "food",
  },
  {
    slug: "culture",
    label: "Local experiences",
    shortLabel: "Experiences",
    description: "Festivals, homestays and time spent with local hosts.",
    photo: "culture",
  },
] as const satisfies ReadonlyArray<{
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  photo: PhotoKey;
}>;

export type Category = (typeof CATEGORIES)[number];
export type CategorySlug = Category["slug"];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [
  CategorySlug,
  ...CategorySlug[],
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
