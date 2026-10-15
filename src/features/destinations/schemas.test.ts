import { describe, expect, it } from "vitest";

import {
  activeFilterCount,
  destinationHref,
  exploreHref,
  parseDestinationSearch,
  provinceHref,
} from "./schemas";

describe("parseDestinationSearch", () => {
  it("accepts known category and province slugs", () => {
    expect(
      parseDestinationSearch({ q: "lake", category: "lakes", region: "karnali" }),
    ).toEqual({ q: "lake", category: "lakes", region: "karnali" });
  });

  it("drops unknown slugs instead of failing", () => {
    expect(
      parseDestinationSearch({ category: "beaches", region: "atlantis" }),
    ).toEqual({ q: undefined, category: undefined, region: undefined });
  });

  it("trims the query and treats blank as absent", () => {
    expect(parseDestinationSearch({ q: "  rara  " }).q).toBe("rara");
    expect(parseDestinationSearch({ q: "   " }).q).toBeUndefined();
  });

  it("drops over-long queries", () => {
    expect(parseDestinationSearch({ q: "x".repeat(81) }).q).toBeUndefined();
  });

  it("uses the first value of repeated params", () => {
    expect(parseDestinationSearch({ category: ["food", "lakes"] }).category).toBe(
      "food",
    );
  });
});

describe("exploreHref", () => {
  it("returns the bare route without filters", () => {
    expect(exploreHref()).toBe("/explore");
    expect(exploreHref({ q: undefined })).toBe("/explore");
  });

  it("encodes provided filters", () => {
    expect(exploreHref({ q: "tea hills", region: "koshi" })).toBe(
      "/explore?q=tea+hills&region=koshi",
    );
  });
});

describe("theme and season params", () => {
  it("accepts known values and drops unknown ones", () => {
    expect(parseDestinationSearch({ theme: "nature", season: "autumn" })).toMatchObject({
      theme: "nature",
      season: "autumn",
    });
    expect(parseDestinationSearch({ theme: "nightlife", season: "summer" })).toMatchObject({
      theme: undefined,
      season: undefined,
    });
  });

  it("orders params stably in URLs", () => {
    expect(exploreHref({ season: "winter", theme: "food", region: "bagmati" })).toBe(
      "/explore?theme=food&region=bagmati&season=winter",
    );
  });
});

describe("destinationHref", () => {
  it("builds detail URLs", () => {
    expect(destinationHref("rara-lake")).toBe("/destinations/rara-lake");
  });
});

describe("discovery params", () => {
  it("parses district, difficulty, budget, sort and page", () => {
    expect(
      parseDestinationSearch({ district: " Mugu ", difficulty: "moderate", budget: "mid", sort: "name", page: "3" }),
    ).toMatchObject({ district: "Mugu", difficulty: "moderate", budget: "mid", sort: "name", page: 3 });
  });

  it.each([
    ["page", "0"],
    ["page", "-2"],
    ["page", "2.5"],
    ["page", "abc"],
    ["page", "100000"],
    ["sort", "random"],
    ["difficulty", "extreme"],
    ["budget", "cheap"],
    ["district", "<script>"],
    ["district", "x".repeat(61)],
  ])("drops invalid %s=%s", (key, value) => {
    expect(parseDestinationSearch({ [key]: value })[key as "page"]).toBeUndefined();
  });

  it("omits defaults from canonical URLs", () => {
    expect(exploreHref({ sort: "featured", page: 1 })).toBe("/explore");
    expect(exploreHref({ sort: "name", page: 2, district: "Mugu" })).toBe("/explore?district=Mugu&sort=name&page=2");
  });

  it("counts active filters but not sort or page", () => {
    expect(activeFilterCount({ q: "lake", region: "karnali", sort: "name", page: 2 })).toBe(2);
  });

  it("builds province URLs", () => {
    expect(provinceHref("karnali")).toBe("/provinces/karnali");
  });
});
