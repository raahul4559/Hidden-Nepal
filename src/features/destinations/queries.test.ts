import { describe, expect, it } from "vitest";

import { buildDestinationWhere, toSummary } from "./queries";

describe("buildDestinationWhere", () => {
  it("only ever returns published destinations", () => {
    expect(buildDestinationWhere({})).toEqual({ status: "PUBLISHED" });
  });

  it("filters by category through the join table and by province slug", () => {
    expect(
      buildDestinationWhere({ category: "waterfalls", region: "bagmati" }),
    ).toEqual({
      status: "PUBLISHED",
      categories: { some: { category: { slug: "waterfalls" } } },
      region: { slug: "bagmati" },
    });
  });

  it("searches name, summary and district case-insensitively", () => {
    const where = buildDestinationWhere({ q: "rara" });
    expect(where.OR).toHaveLength(3);
    expect(where.OR?.[0]).toEqual({
      name: { contains: "rara", mode: "insensitive" },
    });
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
      { url: "https://upload.wikimedia.org/x.jpg", alt: "Lake", credit: "A", license: "CC BY 4.0", sourceUrl: null },
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
