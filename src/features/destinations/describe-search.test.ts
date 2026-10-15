import { describe, expect, it } from "vitest";

import { describeSearch } from "./describe-search";

describe("describeSearch", () => {
  it("is empty without filters", () => {
    expect(describeSearch({})).toBe("");
  });

  it("prefers the specific category over the theme", () => {
    expect(describeSearch({ theme: "nature", category: "lakes" })).toBe("Himalayan lakes");
    expect(describeSearch({ theme: "nature" })).toBe("Nature");
  });

  it("combines experience, province and season", () => {
    expect(describeSearch({ category: "lakes", region: "karnali", season: "autumn" })).toBe(
      "Himalayan lakes in Karnali for autumn",
    );
    expect(describeSearch({ region: "koshi" })).toBe("Destinations in Koshi");
    expect(describeSearch({ season: "winter" })).toBe("Destinations for winter");
  });
});
