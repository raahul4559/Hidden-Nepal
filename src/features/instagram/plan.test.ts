import { describe, expect, it } from "vitest";

import { planInstagramImport } from "./plan";
import type { InstagramCandidate } from "./types";

const DESTINATIONS = [
  { slug: "phewa-lake", name: "Phewa Lake", regionSlug: "gandaki" },
  { slug: "rara-lake", name: "Rara Lake", regionSlug: "karnali" },
];

function candidate(overrides: Partial<InstagramCandidate> = {}): InstagramCandidate {
  return {
    destinationSlug: "phewa-lake",
    shortcode: "Short12345",
    url: "https://www.instagram.com/p/Short12345/",
    sourceMethod: "MANUAL",
    rightsStatus: "PERMITTED",
    collectedAt: new Date("2026-10-21T00:00:00.000Z"),
    ...overrides,
  };
}

describe("planInstagramImport", () => {
  it("accepts known destinations and marks existing rows as updates", () => {
    const plan = planInstagramImport(
      [candidate()],
      DESTINATIONS,
      new Set(["Short12345"]),
    );

    expect(plan.rejected).toEqual([]);
    expect(plan.accepted).toHaveLength(1);
    expect(plan.accepted[0].isUpdate).toBe(true);
  });

  it("rejects unknown destinations", () => {
    const plan = planInstagramImport(
      [candidate({ destinationSlug: "missing-place" })],
      DESTINATIONS,
    );

    expect(plan.accepted).toHaveLength(0);
    expect(plan.rejected[0].reason).toMatch(/Unknown destination slug/);
  });

  it("keeps the first duplicate shortcode and reports the rest", () => {
    const plan = planInstagramImport(
      [
        candidate({ creatorUsername: "first" }),
        candidate({ destinationSlug: "rara-lake", creatorUsername: "second" }),
      ],
      DESTINATIONS,
    );

    expect(plan.accepted).toHaveLength(1);
    expect(plan.accepted[0].creatorUsername).toBe("first");
    expect(plan.duplicates).toHaveLength(1);
    expect(plan.duplicates[0].destinationSlug).toBe("rara-lake");
  });

  it("rejects a URL whose shortcode does not match the record", () => {
    const plan = planInstagramImport(
      [candidate({ url: "https://www.instagram.com/p/Other12345/" })],
      DESTINATIONS,
    );

    expect(plan.accepted).toHaveLength(0);
    expect(plan.rejected[0].reason).toMatch(/do not match/);
  });
});
