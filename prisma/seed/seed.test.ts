import { describe, expect, it } from "vitest";

import { destinationInputSchema } from "@/features/destinations/validation";

import { resolveSeedOptions } from "./index";
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
      expect(image.credit).toBeTruthy();
      expect(image.license).toMatch(/^CC BY/);
      expect(image.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    }
  });
});

describe("resolveSeedOptions", () => {
  it("seeds samples by default in development", () => {
    expect(resolveSeedOptions({ NODE_ENV: "development" })).toEqual({ samples: true });
  });

  it("can opt out of samples", () => {
    expect(resolveSeedOptions({ SEED_SAMPLE_DATA: "false" })).toEqual({ samples: false });
    expect(
      resolveSeedOptions({ NODE_ENV: "production", SEED_SAMPLE_DATA: "false" }),
    ).toEqual({ samples: false });
  });

  it("refuses samples in production", () => {
    expect(() => resolveSeedOptions({ NODE_ENV: "production" })).toThrow(/production/);
  });
});
