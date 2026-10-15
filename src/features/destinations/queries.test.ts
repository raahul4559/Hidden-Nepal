import { describe, expect, it } from "vitest";

import { buildDestinationWhere, toDetail, toSummary } from "./queries";

describe("buildDestinationWhere", () => {
  it("only ever returns published destinations", () => {
    expect(buildDestinationWhere({})).toEqual({ status: "PUBLISHED" });
  });

  it("filters by category through the join table and by province slug", () => {
    expect(
      buildDestinationWhere({ category: "waterfalls", region: "bagmati" }),
    ).toEqual({
      status: "PUBLISHED",
      AND: [
        { categories: { some: { category: { slug: "waterfalls" } } } },
        { region: { slug: "bagmati" } },
      ],
    });
  });

  it("expands a theme to its categories", () => {
    expect(buildDestinationWhere({ theme: "nature" }).AND).toEqual([
      { categories: { some: { category: { slug: { in: ["waterfalls", "lakes"] } } } } },
    ]);
  });

  it("maps season slugs to the database enum", () => {
    expect(buildDestinationWhere({ season: "autumn" }).AND).toEqual([
      { seasons: { some: { season: "AUTUMN" } } },
    ]);
  });

  it("searches name, summary and district case-insensitively", () => {
    const [clause] = buildDestinationWhere({ q: "rara" }).AND as { OR: unknown[] }[];
    expect(clause.OR).toHaveLength(3);
    expect(clause.OR[0]).toEqual({ name: { contains: "rara", mode: "insensitive" } });
  });
});

describe("toSummary", () => {
  const row = {
    slug: "rara-lake",
    name: "Rara Lake",
    summary: "Summary",
    district: "Mugu",
    elevationM: 2990,
    isSample: true,
    practicalInfoStatus: "PLACEHOLDER" as const,
    region: { slug: "karnali", name: "Karnali" },
    categories: [{ category: { slug: "lakes" } }],
    images: [
      { url: "https://upload.wikimedia.org/x.jpg", alt: "Lake", caption: null, credit: "A", license: "CC BY 4.0", sourceUrl: null },
    ],
  };

  it("uses the first category and first image", () => {
    const s = toSummary(row);
    expect(s.category).toBe("lakes");
    expect(s.coverImage?.url).toBe("https://upload.wikimedia.org/x.jpg");
  });

  it("hides unverified practical details", () => {
    expect(toSummary(row).elevationM).toBeNull();
    expect(
      toSummary({ ...row, practicalInfoStatus: "VERIFIED" }).elevationM,
    ).toBe(2990);
  });

  it("tolerates missing or unknown categories and images", () => {
    const s = toSummary({ ...row, categories: [{ category: { slug: "nightlife" } }], images: [] });
    expect(s.category).toBeNull();
    expect(s.coverImage).toBeNull();
  });
});

describe("toDetail", () => {
  const { Decimal } = { Decimal: class { constructor(private v: number) {} toNumber() { return this.v; } } };
  const row = {
    slug: "rara-lake",
    name: "Rara Lake",
    summary: "Summary",
    description: "Para one.\n\nPara two.",
    district: "Mugu",
    isSample: false,
    publishedAt: new Date("2026-01-04"),
    updatedAt: new Date("2026-02-01"),
    region: { slug: "karnali", name: "Karnali" },
    categories: [{ category: { slug: "lakes" } }, { category: { slug: "treks" } }],
    images: [],
    seasons: [{ season: "AUTUMN" as const }, { season: "SPRING" as const }],
    practicalInfoStatus: "VERIFIED" as const,
    practicalInfoVerifiedAt: new Date("2026-02-01"),
    elevationM: 2990,
    difficulty: "MODERATE" as const,
    suggestedDays: 6,
    estimatedCostMin: 100,
    estimatedCostMax: 200,
    currency: "NPR" as const,
    costNotes: null,
    bestSeasonNotes: null,
    latitude: new Decimal(29.53),
    longitude: new Decimal(82.08),
  } as unknown as Parameters<typeof toDetail>[0];

  it("exposes verified practical info with seasons in calendar order", () => {
    const detail = toDetail(row);
    expect(detail.categories).toEqual(["lakes", "treks"]);
    expect(detail.practicalInfo).toMatchObject({
      elevationM: 2990,
      seasons: ["SPRING", "AUTUMN"],
      cost: { min: 100, max: 200, currency: "NPR" },
      coordinates: { latitude: 29.53, longitude: 82.08 },
    });
  });

  it.each(["PLACEHOLDER", "UNVERIFIED"] as const)("withholds %s practical info entirely", (status) => {
    expect(toDetail({ ...row, practicalInfoStatus: status }).practicalInfo).toBeNull();
  });
});
