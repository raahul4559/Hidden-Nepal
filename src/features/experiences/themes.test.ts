import { describe, expect, it } from "vitest";

import { CATEGORY_SLUGS } from "./categories";
import { getThemeForCategory, THEMES } from "./themes";

describe("THEMES", () => {
  it("are the five requested experiences", () => {
    expect(THEMES.map((t) => t.label)).toEqual(["Nature", "Culture", "Adventure", "Villages", "Food"]);
  });

  it("cover every category exactly once", () => {
    const covered = THEMES.flatMap((t) => [...t.categories]);
    expect(covered.sort()).toEqual([...CATEGORY_SLUGS].sort());
  });

  it("can look up a category's theme", () => {
    expect(getThemeForCategory("lakes")?.slug).toBe("nature");
    expect(getThemeForCategory("heritage")?.slug).toBe("culture");
  });
});
