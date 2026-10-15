import { describe, expect, it } from "vitest";

import { buildDestinationWhere } from "./queries";

describe("buildDestinationWhere", () => {
  it("only ever returns published destinations", () => {
    expect(buildDestinationWhere({})).toEqual({ status: "PUBLISHED" });
  });

  it("maps URL slugs onto database filters", () => {
    expect(
      buildDestinationWhere({ category: "waterfalls", region: "bagmati" }),
    ).toEqual({
      status: "PUBLISHED",
      category: "WATERFALL",
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
