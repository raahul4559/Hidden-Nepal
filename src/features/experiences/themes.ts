import type { PhotoKey } from "@/content/photos";

import type { CategorySlug } from "./categories";

/**
 * The five headline experiences shown on the homepage. Each groups one or
 * more fine-grained categories, so the database keeps its detail (waterfalls
 * vs lakes) while visitors browse by broad interest.
 */
export const THEMES = [
  {
    slug: "nature",
    label: "Nature",
    description: "Hidden waterfalls and Himalayan lakes, far from the usual viewpoints.",
    categories: ["waterfalls", "lakes"],
    photo: "waterfalls",
  },
  {
    slug: "culture",
    label: "Culture",
    description: "Durbar squares, monasteries and festivals that still belong to their communities.",
    categories: ["heritage", "culture"],
    photo: "culture",
  },
  {
    slug: "adventure",
    label: "Adventure",
    description: "Ridge walks, quiet valleys and high trails.",
    categories: ["treks"],
    photo: "treks",
  },
  {
    slug: "villages",
    label: "Villages",
    description: "Hill settlements where you’re a guest, not a tourist.",
    categories: ["villages"],
    photo: "villages",
  },
  {
    slug: "food",
    label: "Food",
    description: "Regional kitchens, from Newari feasts to mountain staples.",
    categories: ["food"],
    photo: "food",
  },
] as const satisfies ReadonlyArray<{
  slug: string;
  label: string;
  description: string;
  categories: readonly CategorySlug[];
  photo: PhotoKey;
}>;

export type Theme = (typeof THEMES)[number];
export type ThemeSlug = Theme["slug"];

export const THEME_SLUGS = THEMES.map((t) => t.slug) as [ThemeSlug, ...ThemeSlug[]];

export function getTheme(slug: string): Theme | undefined {
  return THEMES.find((t) => t.slug === slug);
}

export function getThemeForCategory(category: CategorySlug): Theme | undefined {
  return THEMES.find((t) => (t.categories as readonly CategorySlug[]).includes(category));
}
