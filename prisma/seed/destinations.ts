import {
  type DestinationInput,
  destinationInputSchema,
} from "@/features/destinations/validation";
import type { PrismaClient } from "@/generated/prisma/client";

/**
 * Validates and writes one destination, idempotently: the row is upserted by
 * slug and its categories, seasons and images are replaced, so running the
 * seed again converges on the same state instead of duplicating rows.
 */
export async function upsertDestination(prisma: PrismaClient, input: DestinationInput) {
  const d = destinationInputSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const [region, categories] = await Promise.all([
      tx.region.findUniqueOrThrow({ where: { slug: d.regionSlug }, select: { id: true } }),
      tx.category.findMany({
        where: { slug: { in: d.categorySlugs } },
        select: { id: true, slug: true },
      }),
    ]);
    const categoryId = new Map(categories.map((c) => [c.slug, c.id]));
    const missing = d.categorySlugs.filter((slug) => !categoryId.has(slug));
    if (missing.length) {
      throw new Error(`Unknown categories for ${d.slug}: ${missing.join(", ")}. Seed reference data first.`);
    }

    const fields = {
      name: d.name,
      summary: d.summary,
      description: d.description ?? null,
      status: d.status,
      publishedAt: d.publishedAt ?? null,
      isFeatured: d.isFeatured,
      isSample: d.isSample,
      region: { connect: { id: region.id } },
      district: d.district ?? null,
      latitude: d.coordinates?.latitude ?? null,
      longitude: d.coordinates?.longitude ?? null,
      elevationM: d.elevationM ?? null,
      estimatedCostMin: d.cost?.min ?? null,
      estimatedCostMax: d.cost?.max ?? null,
      currency: d.cost?.currency ?? "NPR",
      costNotes: d.costNotes ?? null,
      difficulty: d.difficulty ?? null,
      suggestedDays: d.suggestedDays ?? null,
      bestSeasonNotes: d.bestSeasonNotes ?? null,
      practicalInfoStatus: d.practicalInfo.status,
      practicalInfoVerifiedAt: d.practicalInfo.verifiedAt ?? null,
    };

    const destination = await tx.destination.upsert({
      where: { slug: d.slug },
      update: fields,
      create: { slug: d.slug, ...fields },
      select: { id: true },
    });
    const destinationId = destination.id;

    // Replace child rows so the result matches the input exactly.
    await tx.destinationCategory.deleteMany({ where: { destinationId } });
    await tx.destinationSeason.deleteMany({ where: { destinationId } });
    await tx.destinationImage.deleteMany({ where: { destinationId } });

    await tx.destinationCategory.createMany({
      data: d.categorySlugs.map((slug, position) => ({
        destinationId,
        categoryId: categoryId.get(slug)!,
        position,
      })),
    });
    if (d.seasons.length) {
      await tx.destinationSeason.createMany({
        data: d.seasons.map((season) => ({ destinationId, season })),
      });
    }
    if (d.images.length) {
      await tx.destinationImage.createMany({
        data: d.images.map((image, position) => ({ destinationId, position, ...image })),
      });
    }

    return destination;
  });
}
