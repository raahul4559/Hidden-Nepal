import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { destinationInputSchema } from "@/features/destinations/validation";

import { resolveSeedOptions } from "./index";
import { RESEARCHED_DESTINATIONS } from "./researched-destinations";
import { SAMPLE_DESTINATIONS } from "./sample-destinations";

describe("sample destinations", () => {
  it("includes the four planned samples", () => {
    expect(SAMPLE_DESTINATIONS.map((d) => d.slug).sort()).toEqual([
      "khaptad-national-park",
      "rara-lake",
      "tansen",
      "tsum-valley",
    ]);
  });

  it("all pass validation", () => {
    for (const d of SAMPLE_DESTINATIONS) {
      const result = destinationInputSchema.safeParse(d);
      expect(result.error?.issues ?? [], d.slug).toEqual([]);
    }
  });

  it("have unique slugs", () => {
    const slugs = SAMPLE_DESTINATIONS.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("are flagged as samples with placeholder practical info", () => {
    for (const d of SAMPLE_DESTINATIONS) {
      expect(d.isSample, d.slug).toBe(true);
      expect(d.practicalInfo.status, d.slug).toBe("PLACEHOLDER");
      if (d.cost) expect(d.costNotes, d.slug).toMatch(/placeholder/i);
      if (d.seasons?.length) expect(d.bestSeasonNotes, d.slug).toMatch(/placeholder/i);
    }
  });

  it("credit every image", () => {
    for (const image of SAMPLE_DESTINATIONS.flatMap((d) => d.images ?? [])) {
      expect(image.url).toMatch(/^\/images\/destinations\/.+\.jpg$/);
      expect(image.credit).toBeTruthy();
      expect(image.license).toMatch(/^CC BY/);
      expect(image.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    }
  });
});

describe("resolveSeedOptions", () => {
  it("seeds samples by default in development", () => {
    expect(resolveSeedOptions({ NODE_ENV: "development" })).toEqual({
      samples: true,
      researched: true,
      instagram: true,
    });
  });

  it("can opt out of samples", () => {
    expect(resolveSeedOptions({ SEED_SAMPLE_DATA: "false" })).toEqual({
      samples: false,
      researched: true,
      instagram: true,
    });
    expect(
      resolveSeedOptions({ NODE_ENV: "production", SEED_SAMPLE_DATA: "false" }),
    ).toEqual({ samples: false, researched: true, instagram: true });
  });

  it("refuses samples in production", () => {
    expect(() => resolveSeedOptions({ NODE_ENV: "production" })).toThrow(/production/);
  });

  it("can opt out of researched destination imports", () => {
    expect(resolveSeedOptions({ SEED_RESEARCHED_DATA: "false" })).toEqual({
      samples: true,
      researched: false,
      instagram: true,
    });
  });

  it("can opt out of Instagram reference imports", () => {
    expect(resolveSeedOptions({ SEED_INSTAGRAM_DATA: "false" })).toEqual({
      samples: true,
      researched: true,
      instagram: false,
    });
  });
});

describe("researched destinations", () => {
  it("imports the complete unique dataset and validates every record", () => {
    expect(RESEARCHED_DESTINATIONS).toHaveLength(59);
    expect(new Set(RESEARCHED_DESTINATIONS.map((destination) => destination.slug)).size).toBe(59);
    // Sample destinations keep their own bundled photos when seeded, so the
    // researched set is only expected to carry images for the rest.
    const sampleSlugs = new Set(SAMPLE_DESTINATIONS.map((destination) => destination.slug));
    const missingImages = RESEARCHED_DESTINATIONS.filter(
      (destination) => !sampleSlugs.has(destination.slug) && !destination.images?.length,
    ).map((destination) => destination.slug);
    expect(missingImages).toEqual([]);

    for (const destination of RESEARCHED_DESTINATIONS) {
      const result = destinationInputSchema.safeParse(destination);
      expect(result.error?.issues ?? [], destination.slug).toEqual([]);
    }
  });

  it("includes locally bundled images for five additional verified destinations", () => {
    for (const slug of [
      "gokyo-lakes",
      "ilam",
      "pathibhara-devi-temple",
      "halesi-mahadev-temple",
      "patan-durbar-square",
    ]) {
      const destination = RESEARCHED_DESTINATIONS.find((item) => item.slug === slug);
      expect(destination?.images?.length, slug).toBeGreaterThan(0);
      for (const image of destination?.images ?? []) {
        expect(existsSync(join(process.cwd(), "public", image.url.slice(1))), slug).toBe(true);
      }
    }
  });

  it("publishes the full sourced inventory while keeping practical details unverified", () => {
    expect(RESEARCHED_DESTINATIONS.filter((destination) => destination.status === "PUBLISHED")).toHaveLength(59);
    expect(RESEARCHED_DESTINATIONS.filter((destination) => destination.status === "DRAFT")).toHaveLength(0);

    expect(RESEARCHED_DESTINATIONS.find((destination) => destination.slug === "kathmandu-valley")?.images?.[0])
      .toMatchObject({
        url: "/images/destinations/kathmandu-valley.jpg",
        credit: "Megaurab09",
        license: "CC BY-SA 4.0",
        sourceUrl:
          "https://commons.wikimedia.org/wiki/File:Swayambhunath_Stupa_Above_Kathmandu_Valley.jpg",
      });

    for (const destination of RESEARCHED_DESTINATIONS) {
      expect(destination.status, destination.slug).toBe("PUBLISHED");
      expect(destination.isSample, destination.slug).toBe(false);
      expect(destination.practicalInfo.status, destination.slug).toBe("UNVERIFIED");
      expect(destination.sources?.length, destination.slug).toBeGreaterThan(0);
      for (const image of destination.images ?? []) {
        expect(image.url).toMatch(/^\/images\/destinations\/.+\.jpg$/);
        expect(image.credit, destination.slug).toBeTruthy();
        expect(image.license, destination.slug).toMatch(/^CC BY/);
        expect(image.sourceUrl, destination.slug).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
        expect(existsSync(join(process.cwd(), "public", image.url.slice(1))), destination.slug).toBe(true);
      }
    }
  });

  it("features a curated cross-province set on the homepage", () => {
    expect(
      RESEARCHED_DESTINATIONS.filter((destination) => destination.isFeatured)
        .map((destination) => destination.slug)
        .sort(),
    ).toEqual([
      "chitwan-national-park",
      "janakpur",
      "kathmandu-valley",
      "lumbini",
      "pokhara",
      "sagarmatha-national-park",
    ]);
  });

  it("does not assign coordinates outside the website's Nepal bounds", () => {
    for (const destination of RESEARCHED_DESTINATIONS) {
      if (!destination.coordinates) continue;
      expect(destination.coordinates.latitude, destination.slug).toBeGreaterThanOrEqual(26.3);
      expect(destination.coordinates.latitude, destination.slug).toBeLessThanOrEqual(30.5);
      expect(destination.coordinates.longitude, destination.slug).toBeGreaterThanOrEqual(80);
      expect(destination.coordinates.longitude, destination.slug).toBeLessThanOrEqual(88.3);
    }
  });
});
