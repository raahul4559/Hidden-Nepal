import { describe, expect, it } from "vitest";

import {
  type DestinationInput,
  destinationInputSchema,
  slugSchema,
} from "./validation";

const valid: DestinationInput = {
  slug: "test-lake",
  name: "Test Lake",
  summary: "A fixture destination used only in unit tests.",
  status: "DRAFT",
  regionSlug: "karnali",
  categorySlugs: ["lakes"],
  practicalInfo: { status: "UNVERIFIED" },
};

const issues = (input: unknown) => {
  const result = destinationInputSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
};

describe("slugSchema", () => {
  it.each(["rara-lake", "tsum-valley", "k2", "a1-b2-c3"])("accepts %s", (slug) => {
    expect(slugSchema.safeParse(slug).success).toBe(true);
  });

  it.each(["Rara-Lake", "rara_lake", "rara--lake", "-rara", "rara-", "rara lake", "r", "ráră"])(
    "rejects %s",
    (slug) => {
      expect(slugSchema.safeParse(slug).success).toBe(false);
    },
  );
});

describe("destinationInputSchema", () => {
  it("accepts a minimal draft and applies defaults", () => {
    const parsed = destinationInputSchema.parse(valid);
    expect(parsed).toMatchObject({ isFeatured: false, isSample: false, seasons: [], images: [] });
  });

  it("requires known province and category slugs", () => {
    expect(issues({ ...valid, regionSlug: "atlantis" })).toContain("regionSlug");
    expect(issues({ ...valid, categorySlugs: ["beaches"] })).toContain("categorySlugs.0");
    expect(issues({ ...valid, categorySlugs: [] })).toContain("categorySlugs");
  });

  it("rejects duplicate categories and seasons", () => {
    expect(issues({ ...valid, categorySlugs: ["lakes", "lakes"] })).toContain("categorySlugs");
    expect(issues({ ...valid, seasons: ["SPRING", "SPRING"] })).toContain("seasons");
  });

  it("keeps coordinates inside Nepal", () => {
    expect(issues({ ...valid, coordinates: { latitude: 28.2, longitude: 83.9 } })).toEqual([]);
    expect(issues({ ...valid, coordinates: { latitude: 51.5, longitude: -0.1 } })).toContain(
      "coordinates",
    );
  });

  it("rejects inverted cost ranges and unknown currencies", () => {
    expect(issues({ ...valid, cost: { min: 500, max: 100, currency: "NPR" } })).toContain("cost.max");
    expect(issues({ ...valid, cost: { min: 1, max: 2, currency: "EUR" } })).toContain(
      "cost.currency",
    );
  });

  it("bounds elevation to Nepal's range", () => {
    expect(issues({ ...valid, elevationM: 9000 })).toContain("elevationM");
  });

  it("requires a publication date for published destinations", () => {
    expect(issues({ ...valid, status: "PUBLISHED" })).toContain("publishedAt");
    expect(issues({ ...valid, status: "PUBLISHED", publishedAt: new Date() })).toEqual([]);
  });

  it("requires a verification date for verified practical info", () => {
    expect(issues({ ...valid, practicalInfo: { status: "VERIFIED" } })).toContain(
      "practicalInfo.verifiedAt",
    );
  });

  it("forces sample destinations to mark practical info as placeholder", () => {
    expect(issues({ ...valid, isSample: true })).toContain("practicalInfo.status");
    expect(
      issues({ ...valid, isSample: true, practicalInfo: { status: "PLACEHOLDER" } }),
    ).toEqual([]);
  });

  it("requires https image URLs with alt text", () => {
    expect(
      issues({ ...valid, images: [{ url: "http://example.com/a.jpg", alt: "A" }] }),
    ).toContain("images.0.url");
    expect(
      issues({ ...valid, images: [{ url: "https://example.com/a.jpg", alt: " " }] }),
    ).toContain("images.0.alt");
  });
});
