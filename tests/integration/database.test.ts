// @vitest-environment node
/**
 * Runs against a real PostgreSQL database named *_test. Skipped unless
 * TEST_DATABASE_URL is set. The database is migrated and its tables are
 * truncated, so never point this at data you care about.
 */
import "dotenv/config";

import { execFileSync } from "node:child_process";

import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";

import { upsertDestination } from "../../prisma/seed/destinations";
import { seedDatabase } from "../../prisma/seed/index";
import { SAMPLE_DESTINATIONS } from "../../prisma/seed/sample-destinations";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("database (integration)", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    const dbName = new URL(url!).pathname.slice(1);
    if (!dbName.endsWith("_test")) {
      throw new Error(`TEST_DATABASE_URL must point at a database ending in _test (got "${dbName}").`);
    }

    execFileSync("npx", ["prisma", "migrate", "deploy"], {
      env: { ...process.env, DATABASE_URL: url },
      stdio: "pipe",
    });

    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url! }) });
    await prisma.$executeRawUnsafe(
      'TRUNCATE "DestinationImage", "DestinationSeason", "DestinationCategory", "Destination", "Category", "Region", "User" CASCADE',
    );
  }, 60_000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  async function counts() {
    const [regions, categories, destinations, links, images, seasons] = await Promise.all([
      prisma.region.count(),
      prisma.category.count(),
      prisma.destination.count(),
      prisma.destinationCategory.count(),
      prisma.destinationImage.count(),
      prisma.destinationSeason.count(),
    ]);
    return { regions, categories, destinations, links, images, seasons };
  }

  it("seeds reference data and samples, and re-seeding changes nothing", async () => {
    await seedDatabase(prisma, { samples: true });
    const first = await counts();

    expect(first).toEqual({
      regions: 7,
      categories: 7,
      destinations: SAMPLE_DESTINATIONS.length,
      links: SAMPLE_DESTINATIONS.reduce((n, d) => n + d.categorySlugs.length, 0),
      images: SAMPLE_DESTINATIONS.reduce((n, d) => n + (d.images?.length ?? 0), 0),
      seasons: SAMPLE_DESTINATIONS.reduce((n, d) => n + (d.seasons?.length ?? 0), 0),
    });

    await seedDatabase(prisma, { samples: true });
    expect(await counts()).toEqual(first);
  });

  it("returns sample destinations through the app's query layer", async () => {
    process.env.DATABASE_URL = url;
    const { searchDestinations, getFeaturedDestinations } = await import(
      "@/features/destinations/queries"
    );

    const featured = await getFeaturedDestinations();
    expect(featured.status).toBe("ok");
    if (featured.status !== "ok") return;
    // Newest publishedAt first.
    expect(featured.destinations.map((d) => d.slug)).toEqual([
      "rara-lake",
      "tansen",
      "khaptad-national-park",
      "tsum-valley",
    ]);
    const rara = featured.destinations[0];
    expect(rara).toMatchObject({
      category: "lakes",
      region: { slug: "karnali", name: "Karnali" },
      isSample: true,
      practicalInfoStatus: "PLACEHOLDER",
      elevationM: null, // placeholder details are withheld
    });
    expect(rara.coverImage?.credit).toBe("Chandra Chakradhar");

    const treks = await searchDestinations({ category: "treks" });
    expect(treks.status === "ok" && treks.destinations.map((d) => d.slug).sort()).toEqual([
      "khaptad-national-park",
      "rara-lake",
      "tsum-valley",
    ]);

    const palpa = await searchDestinations({ q: "PALPA" });
    expect(palpa.status === "ok" && palpa.destinations.map((d) => d.slug)).toEqual(["tansen"]);

    const none = await searchDestinations({ region: "madhesh" });
    expect(none).toEqual({ status: "ok", destinations: [] });
  });

  it("enforces unique destination slugs", async () => {
    const region = await prisma.region.findUniqueOrThrow({ where: { slug: "karnali" } });
    await expect(
      prisma.destination.create({
        data: { slug: "rara-lake", name: "Duplicate", summary: "Duplicate slug", regionId: region.id },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("enforces CHECK constraints the schema cannot express", async () => {
    const region = await prisma.region.findUniqueOrThrow({ where: { slug: "karnali" } });
    const base = { name: "Bad", summary: "Constraint probe", regionId: region.id };

    await expect(
      prisma.destination.create({ data: { ...base, slug: "Bad Slug" } }),
    ).rejects.toThrow(/Destination_slug_format/);
    await expect(
      prisma.destination.create({
        data: { ...base, slug: "bad-cost", estimatedCostMin: 500, estimatedCostMax: 100 },
      }),
    ).rejects.toThrow(/Destination_cost_range/);
    await expect(
      prisma.destination.create({ data: { ...base, slug: "bad-coords", latitude: 28.2 } }),
    ).rejects.toThrow(/Destination_coordinates_valid/);
    await expect(
      prisma.destination.create({ data: { ...base, slug: "bad-published", status: "PUBLISHED" } }),
    ).rejects.toThrow(/Destination_published_has_timestamp/);
    await expect(
      prisma.user.create({ data: { email: "Traveller@Example.com" } }),
    ).rejects.toThrow(/User_email_lowercase/);
  });

  it("applies deliberate delete behaviour", async () => {
    // Restrict: provinces and categories in use cannot be deleted.
    await expect(prisma.region.delete({ where: { slug: "karnali" } })).rejects.toThrow();
    await expect(prisma.category.delete({ where: { slug: "lakes" } })).rejects.toThrow();

    // Cascade: deleting a destination removes its join rows and images.
    const { id } = await prisma.destination.findUniqueOrThrow({ where: { slug: "tansen" } });
    await prisma.destination.delete({ where: { id } });
    expect(await prisma.destinationImage.count({ where: { destinationId: id } })).toBe(0);
    expect(await prisma.destinationCategory.count({ where: { destinationId: id } })).toBe(0);
    expect(await prisma.destinationSeason.count({ where: { destinationId: id } })).toBe(0);

    // Restore for idempotence of the suite.
    await upsertDestination(prisma, SAMPLE_DESTINATIONS.find((d) => d.slug === "tansen")!);
  });
});
