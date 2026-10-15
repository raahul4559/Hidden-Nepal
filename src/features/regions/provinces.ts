/**
 * Nepal's seven provinces, as established under the 2015 constitution.
 * `knownFor` lists only widely documented landmarks inside each province.
 * Kept free of server-only imports so it can seed the database and render
 * on the client alike.
 */
export const PROVINCES = [
  {
    slug: "koshi",
    name: "Koshi",
    knownFor: ["Everest region", "Kanchenjunga", "Ilam tea hills"],
  },
  {
    slug: "madhesh",
    name: "Madhesh",
    knownFor: ["Janakpur", "Mithila art", "Terai plains"],
  },
  {
    slug: "bagmati",
    name: "Bagmati",
    knownFor: ["Kathmandu Valley", "Langtang", "Chitwan"],
  },
  {
    slug: "gandaki",
    name: "Gandaki",
    knownFor: ["Annapurna", "Pokhara", "Mustang"],
  },
  {
    slug: "lumbini",
    name: "Lumbini",
    knownFor: ["Lumbini", "Bardiya", "Palpa"],
  },
  {
    slug: "karnali",
    name: "Karnali",
    knownFor: ["Rara Lake", "Shey Phoksundo", "Dolpa"],
  },
  {
    slug: "sudurpashchim",
    name: "Sudurpashchim",
    knownFor: ["Khaptad", "Api Nampa", "Shuklaphanta"],
  },
] as const;

export type Province = (typeof PROVINCES)[number];
export type ProvinceSlug = Province["slug"];

export const PROVINCE_SLUGS = PROVINCES.map((p) => p.slug) as [
  ProvinceSlug,
  ...ProvinceSlug[],
];

export function getProvince(slug: string): Province | undefined {
  return PROVINCES.find((p) => p.slug === slug);
}
