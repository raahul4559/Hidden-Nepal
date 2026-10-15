import { ACTIVITIES } from "@/features/destinations/activities";
import { CATEGORIES } from "@/features/experiences/categories";
import { PROVINCES } from "@/features/regions/provinces";
import type { PrismaClient } from "@/generated/prisma/client";

/** Provinces and categories: stable reference data, safe in every environment. */
export async function seedReferenceData(prisma: PrismaClient) {
  await prisma.$transaction([
    ...PROVINCES.map((province, index) =>
      prisma.region.upsert({
        where: { slug: province.slug },
        update: { name: province.name, sortOrder: index },
        create: { slug: province.slug, name: province.name, sortOrder: index },
      }),
    ),
    ...CATEGORIES.map((category, index) =>
      prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          name: category.label,
          description: category.description,
          sortOrder: index,
        },
        create: {
          slug: category.slug,
          name: category.label,
          description: category.description,
          sortOrder: index,
        },
      }),
    ),
    ...ACTIVITIES.map((activity, index) =>
      prisma.activity.upsert({
        where: { slug: activity.slug },
        update: { name: activity.name, sortOrder: index },
        create: { slug: activity.slug, name: activity.name, sortOrder: index },
      }),
    ),
  ]);

  return { regions: PROVINCES.length, categories: CATEGORIES.length, activities: ACTIVITIES.length };
}
