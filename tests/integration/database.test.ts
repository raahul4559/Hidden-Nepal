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
import type { DestinationInput } from "@/features/destinations/validation";

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
      'TRUNCATE "PlaceSubmission", "DestinationSource", "DestinationActivity", "Activity", "DestinationImage", "DestinationSeason", "DestinationCategory", "Destination", "Category", "Region", "User" CASCADE',
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
    const q = await import("@/features/destinations/queries");

    const featured = await q.getFeaturedDestinations();
    expect(featured.status === "ok" && featured.destinations.map((d) => d.slug)).toEqual([
      "rara-lake",
      "tansen",
    ]);
    if (featured.status !== "ok") return;
    expect(featured.destinations[0]).toMatchObject({
      category: "lakes",
      region: { slug: "karnali", name: "Karnali" },
      isSample: true,
      practicalInfoStatus: "PLACEHOLDER",
      elevationM: null, // placeholder details are withheld
    });
    expect(featured.destinations[0].coverImage?.credit).toBe("Chandra Chakradhar");

    const gems = await q.getHiddenGems();
    expect(gems.status === "ok" && gems.destinations.map((d) => d.slug)).toEqual([
      "khaptad-national-park",
      "tsum-valley",
    ]);
    expect(gems.status === "ok" && gems.destinations[0].description).toMatch(/Khaptad Baba/);

    const slugs = async (search: Parameters<typeof q.searchDestinations>[0]) => {
      const r = await q.searchDestinations(search);
      return r.status === "ok" ? r.destinations.map((d) => d.slug).sort() : r.status;
    };
    expect(await slugs({ category: "treks" })).toEqual(["khaptad-national-park", "rara-lake", "tsum-valley"]);
    expect(await slugs({ theme: "nature" })).toEqual(["rara-lake"]);
    expect(await slugs({ theme: "culture", region: "gandaki" })).toEqual(["tsum-valley"]);
    // Tansen's WINTER season is a placeholder, so season filters must skip it.
    expect(await slugs({ season: "winter" })).toEqual([]);
    expect(await slugs({ q: "PALPA" })).toEqual(["tansen"]);
    expect(await slugs({ region: "madhesh" })).toEqual([]);

    const counts = await q.getProvinceCounts();
    expect(counts.status === "ok" && counts.counts).toEqual({
      koshi: 0,
      madhesh: 0,
      bagmati: 0,
      gandaki: 1,
      lumbini: 1,
      karnali: 1,
      sudurpashchim: 1,
    });

    const detail = await q.getDestinationBySlug("tansen");
    expect(detail.status === "ok" && detail.destination).toMatchObject({
      name: "Tansen",
      categories: ["heritage", "culture", "food"],
      practicalInfo: null, // placeholder → withheld
    });
    expect(detail.status === "ok" && detail.destination?.images).toHaveLength(2);

    const related = await q.getRelatedDestinations("tansen", "lumbini");
    expect(related).toEqual({ status: "ok", destinations: [] });

    expect(await q.getDestinationBySlug("does-not-exist")).toEqual({ status: "ok", destination: null });
  });

  it("never returns unpublished destinations", async () => {
    await prisma.destination.update({ where: { slug: "tansen" }, data: { status: "DRAFT", publishedAt: null } });
    const q = await import("@/features/destinations/queries");
    expect(await q.getDestinationBySlug("tansen")).toEqual({ status: "ok", destination: null });
    await upsertDestination(prisma, SAMPLE_DESTINATIONS.find((d) => d.slug === "tansen")!);
  });

  it("stores place submissions with constraints", async () => {
    const karnali = await prisma.region.findUniqueOrThrow({ where: { slug: "karnali" } });
    const created = await prisma.placeSubmission.create({
      data: {
        placeName: "Test waterfall",
        description: "An integration-test submission that is long enough.",
        consentToShare: true,
        regionId: karnali.id,
      },
    });
    expect(created.status).toBe("PENDING");

    const base = { placeName: "Test", description: "Long enough description for the check.", consentToShare: true };
    await expect(prisma.placeSubmission.create({ data: { ...base, consentToShare: false } })).rejects.toThrow(
      /PlaceSubmission_consent_required/,
    );
    await expect(
      prisma.placeSubmission.create({ data: { ...base, submitterEmail: "Upper@Case.com" } }),
    ).rejects.toThrow(/PlaceSubmission_email_lowercase/);
    await expect(prisma.placeSubmission.create({ data: { ...base, status: "APPROVED" } })).rejects.toThrow(
      /PlaceSubmission_reviewed_has_timestamp/,
    );
  });

  it("submits through the server action", async () => {
    const { submitPlace } = await import("@/features/submissions/actions");
    const data = new FormData();
    data.set("placeName", "Action test place");
    data.set("region", "koshi");
    data.set("category", "waterfalls");
    data.set("description", "Submitted through the real server action in a test.");
    data.set("submitterEmail", "Tester@Example.com");
    data.set("consentToShare", "on");

    expect(await submitPlace({ status: "idle" }, data)).toEqual({ status: "success" });
    const saved = await prisma.placeSubmission.findFirstOrThrow({
      where: { placeName: "Action test place" },
      include: { region: true, category: true },
    });
    expect(saved).toMatchObject({ submitterEmail: "tester@example.com", status: "PENDING" });
    expect(saved.region?.slug).toBe("koshi");
    expect(saved.category?.slug).toBe("waterfalls");

    // Honeypot: reports success, writes nothing.
    data.set("placeName", "Bot place");
    data.set("website", "http://spam.example");
    expect(await submitPlace({ status: "idle" }, data)).toEqual({ status: "success" });
    expect(await prisma.placeSubmission.count({ where: { placeName: "Bot place" } })).toBe(0);
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

  describe("discovery", () => {
    const VERIFIED_AT = new Date("2026-03-01T00:00:00Z");
    // 14 verified, non-sample test destinations in Koshi, plus unpublished rows.
    const fixtures: DestinationInput[] = Array.from({ length: 14 }, (_, i) => {
      const n = String(i + 1).padStart(2, "0");
      return {
        slug: `qa-place-${n}`,
        name: `QA Place ${String.fromCharCode(90 - i)}`, // reverse-alphabetical vs slug order
        summary: "Integration-test destination with verified practical details.",
        status: "PUBLISHED",
        publishedAt: new Date(Date.UTC(2026, 1, i + 1)),
        isFeatured: i % 5 === 0,
        regionSlug: "koshi",
        district: i % 2 ? "Taplejung" : "Ilam",
        categorySlugs: [i % 2 ? "treks" : "villages"],
        difficulty: i % 3 === 0 ? "EASY" : "MODERATE",
        cost: { min: 5000 * (i + 1), max: 5000 * (i + 2), currency: "NPR" },
        seasons: i % 2 ? ["AUTUMN"] : ["SPRING", "AUTUMN"],
        practicalInfo: { status: "VERIFIED", verifiedAt: VERIFIED_AT },
        accessInfo: "Test access notes.",
        activitySlugs: ["hiking"],
        sources: [{ title: "Test source", url: `https://example.org/${n}` }],
      };
    });

    beforeAll(async () => {
      for (const f of fixtures) await upsertDestination(prisma, f);
      await upsertDestination(prisma, { ...fixtures[0], slug: "qa-draft", name: "QA Draft", status: "DRAFT", publishedAt: undefined });
      await upsertDestination(prisma, { ...fixtures[0], slug: "qa-archived", name: "QA Archived", status: "ARCHIVED" });
    });

    const q = () => import("@/features/destinations/queries");
    const slugs = (r: { status: string; destinations?: { slug: string }[] }) =>
      r.status === "ok" ? r.destinations!.map((d) => d.slug) : r.status;

    it("paginates server-side without overlap", async () => {
      const { searchDestinations } = await q();
      const p1 = await searchDestinations({ region: "koshi", sort: "name" });
      const p2 = await searchDestinations({ region: "koshi", sort: "name", page: 2 });
      expect(p1).toMatchObject({ status: "ok", total: 14, page: 1, pageCount: 2, pageSize: 12 });
      expect(slugs(p1)).toHaveLength(12);
      expect(slugs(p2)).toHaveLength(2);
      expect(new Set([...(slugs(p1) as string[]), ...(slugs(p2) as string[])]).size).toBe(14);

      const beyond = await searchDestinations({ region: "koshi", page: 3 });
      expect(beyond).toMatchObject({ status: "ok", total: 14, page: 3, pageCount: 2, destinations: [] });
    });

    it("sorts alphabetically or featured-first", async () => {
      const { searchDestinations } = await q();
      const byName = await searchDestinations({ region: "koshi", sort: "name" }, 50);
      const names = byName.status === "ok" ? byName.destinations.map((d) => d.name) : [];
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));

      const featured = await searchDestinations({ region: "koshi" }, 50);
      expect(slugs(featured).slice(0, 3)).toEqual(["qa-place-11", "qa-place-06", "qa-place-01"]);
    });

    it("filters by district case-insensitively", async () => {
      const { searchDestinations, getDistricts } = await q();
      const r = await searchDestinations({ district: "TAPLEJUNG" }, 50);
      expect(r.status === "ok" && r.total).toBe(7);
      expect(await getDistricts("koshi")).toEqual({ status: "ok", districts: ["Ilam", "Taplejung"] });
    });

    it("applies practical filters to verified destinations only", async () => {
      const { searchDestinations } = await q();
      // Samples carry placeholder seasons (e.g. Tansen: WINTER) and must never match.
      expect(await searchDestinations({ season: "winter" })).toMatchObject({ total: 0 });
      const spring = await searchDestinations({ season: "spring" }, 50);
      expect(slugs(spring)).not.toContain("rara-lake");
      expect(spring.status === "ok" && spring.total).toBe(7);

      const easy = await searchDestinations({ difficulty: "easy" }, 50);
      expect(easy.status === "ok" && easy.total).toBe(5); // i = 0, 3, 6, 9, 12

      // Starting cost 5,000 × (i+1): low < 15,000 → i = 0, 1
      expect(await searchDestinations({ budget: "low" })).toMatchObject({ total: 2 });
      expect(await searchDestinations({ budget: "mid" })).toMatchObject({ total: 8 });
      expect(await searchDestinations({ budget: "high" })).toMatchObject({ total: 4 });
    });

    it("never exposes draft or archived destinations", async () => {
      const { searchDestinations, getDestinationBySlug, getSitemapDestinations } = await q();
      const all = await searchDestinations({}, 100);
      expect(slugs(all)).not.toContain("qa-draft");
      expect(slugs(all)).not.toContain("qa-archived");
      expect(await getDestinationBySlug("qa-draft")).toEqual({ status: "ok", destination: null });
      expect(await getDestinationBySlug("qa-archived")).toEqual({ status: "ok", destination: null });

      const sitemap = await getSitemapDestinations();
      const sitemapSlugs = sitemap.status === "ok" ? sitemap.destinations.map((d) => d.slug) : [];
      expect(sitemapSlugs).toHaveLength(14); // fixtures only: samples and unpublished excluded
      expect(sitemapSlugs).not.toContain("rara-lake");
    });

    it("returns verified details, activities and sources on the detail page", async () => {
      const { getDestinationBySlug } = await q();
      const r = await getDestinationBySlug("qa-place-02");
      expect(r.status === "ok" && r.destination).toMatchObject({
        practicalInfo: {
          verifiedAt: VERIFIED_AT,
          difficulty: "MODERATE",
          accessInfo: "Test access notes.",
          activities: ["Hiking"],
          seasons: ["AUTUMN"],
          cost: { min: 10000, max: 15000, currency: "NPR" },
        },
        sources: [{ title: "Test source", url: "https://example.org/02" }],
      });
    });

    it("returns an empty page, not an error, when nothing matches", async () => {
      const { searchDestinations } = await q();
      expect(await searchDestinations({ q: "zzz-no-such-place" })).toMatchObject({
        status: "ok",
        total: 0,
        pageCount: 1,
        destinations: [],
      });
    });
  });
});
