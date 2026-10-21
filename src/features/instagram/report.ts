import type { PrismaClient } from "@/generated/prisma/client";

export type ProvinceCoverage = {
  slug: string;
  name: string;
  destinations: number;
  withCoordinates: number;
  withDistrict: number;
  withPublicSources: number;
  withPermittedInstagram: number;
  missingCoordinates: string[];
  missingDistrict: string[];
};

export type CoverageReport = {
  generatedAt: string;
  provinces: ProvinceCoverage[];
  totals: {
    destinations: number;
    withCoordinates: number;
    withDistrict: number;
    withPublicSources: number;
    withPermittedInstagram: number;
  };
  instagram: {
    total: number;
    permitted: number;
    unverified: number;
    manual: number;
    graphApi: number;
  };
};

/**
 * Reads the live catalogue rather than the import file, so the report shows
 * what is actually in the database after an import.
 */
export async function buildCoverageReport(
  prisma: PrismaClient,
  now: Date = new Date(),
): Promise<CoverageReport> {
  const [regions, total, permitted, unverified, manual, graphApi] =
    await Promise.all([
      prisma.region.findMany({
        orderBy: { sortOrder: "asc" },
        select: {
          slug: true,
          name: true,
          destinations: {
            orderBy: { name: "asc" },
            select: {
              slug: true,
              name: true,
              district: true,
              latitude: true,
              longitude: true,
              _count: { select: { sources: true } },
              instagramPosts: {
                select: { rightsStatus: true },
              },
            },
          },
        },
      }),
      prisma.destinationInstagramPost.count(),
      prisma.destinationInstagramPost.count({ where: { rightsStatus: "PERMITTED" } }),
      prisma.destinationInstagramPost.count({ where: { rightsStatus: "UNVERIFIED" } }),
      prisma.destinationInstagramPost.count({ where: { sourceMethod: "MANUAL" } }),
      prisma.destinationInstagramPost.count({ where: { sourceMethod: "GRAPH_API" } }),
    ]);

  const provinces: ProvinceCoverage[] = regions.map((region) => {
    const destinations = region.destinations;
    return {
      slug: region.slug,
      name: region.name,
      destinations: destinations.length,
      withCoordinates: destinations.filter(
        (destination) => destination.latitude !== null && destination.longitude !== null,
      ).length,
      withDistrict: destinations.filter((destination) => Boolean(destination.district)).length,
      withPublicSources: destinations.filter(
        (destination) => destination._count.sources > 0,
      ).length,
      withPermittedInstagram: destinations.filter((destination) =>
        destination.instagramPosts.some((post) => post.rightsStatus === "PERMITTED"),
      ).length,
      missingCoordinates: destinations
        .filter(
          (destination) => destination.latitude === null || destination.longitude === null,
        )
        .map((destination) => destination.slug),
      missingDistrict: destinations
        .filter((destination) => !destination.district)
        .map((destination) => destination.slug),
    };
  });

  const sum = (key: keyof ProvinceCoverage) =>
    provinces.reduce((total, province) => total + (province[key] as number), 0);

  return {
    generatedAt: now.toISOString(),
    provinces,
    totals: {
      destinations: sum("destinations"),
      withCoordinates: sum("withCoordinates"),
      withDistrict: sum("withDistrict"),
      withPublicSources: sum("withPublicSources"),
      withPermittedInstagram: sum("withPermittedInstagram"),
    },
    instagram: { total, permitted, unverified, manual, graphApi },
  };
}
