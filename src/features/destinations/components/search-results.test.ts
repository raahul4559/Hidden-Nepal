import { describe, expect, it } from "vitest";

import { activeFilters } from "./search-results";

describe("activeFilters", () => {
  it("labels active filters in a stable order", () => {
    expect(
      activeFilters({ budget: "low", q: "lake", region: "karnali", district: "Mugu", sort: "name", page: 2 }),
    ).toEqual([
      ["q", "“lake”"],
      ["region", "Karnali"],
      ["district", "Mugu"],
      ["budget", "Under NPR 15,000"],
    ]);
  });

  it("can omit filters fixed by the page", () => {
    expect(activeFilters({ region: "karnali", theme: "nature" }, ["region"])).toEqual([["theme", "Nature"]]);
  });
});
