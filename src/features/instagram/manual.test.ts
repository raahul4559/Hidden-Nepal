import { describe, expect, it } from "vitest";

import { manualPlaceToDestinationInput, parseManualDataset } from "./manual";

const VALID_PLACE = {
  slug: "test-lake",
  name: "Test Lake",
  summary: "A quiet lake used only by this test fixture.",
  province: "gandaki",
  district: "Kaski",
  latitude: 28.2,
  longitude: 83.9,
  categorySlugs: ["lakes"],
  sourceUrls: ["https://ntb.gov.np/"],
  geoSourceUrl: "https://www.openstreetmap.org/node/1",
  status: "DRAFT",
};

describe("parseManualDataset", () => {
  it("normalizes a valid manual post and forces MANUAL provenance", () => {
    const result = parseManualDataset({
      posts: [
        {
          destinationSlug: "phewa-lake",
          postUrl: "https://www.instagram.com/reel/Valid12345/?x=1",
          creatorUsername: "@creator.name",
          caption: "A caption supplied by the creator.",
          rightsStatus: "PERMITTED",
        },
      ],
    });

    expect(result.rejected).toEqual([]);
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]).toMatchObject({
      destinationSlug: "phewa-lake",
      shortcode: "Valid12345",
      url: "https://www.instagram.com/reel/Valid12345/",
      creatorUsername: "creator.name",
      sourceMethod: "MANUAL",
      rightsStatus: "PERMITTED",
    });
  });

  it("keeps good rows when another row is invalid", () => {
    const result = parseManualDataset({
      posts: [
        {
          destinationSlug: "phewa-lake",
          postUrl: "https://www.instagram.com/p/Good12345/",
          rightsStatus: "UNVERIFIED",
        },
        {
          destinationSlug: "phewa-lake",
          postUrl: "https://example.com/p/Bad12345/",
        },
      ],
    });

    expect(result.posts).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].reason).toMatch(/Instagram post URL/);
  });

  it("requires coordinates inside Nepal and a reliable geo source", () => {
    const outside = parseManualDataset({
      places: [{ ...VALID_PLACE, latitude: 40.7, longitude: -74 }],
    });
    expect(outside.places).toHaveLength(0);
    expect(outside.rejected[0].reason).toMatch(/within Nepal/);

    const unreliable = parseManualDataset({
      places: [{ ...VALID_PLACE, geoSourceUrl: "https://example.com/place" }],
    });
    expect(unreliable.places).toHaveLength(0);
    expect(unreliable.rejected[0].reason).toMatch(/geoSourceUrl/);
  });

  it("converts a manual place to an unverified destination input", () => {
    const result = parseManualDataset({ places: [VALID_PLACE] });
    const input = manualPlaceToDestinationInput(
      result.places[0],
      new Date("2026-10-21T00:00:00.000Z"),
    );

    expect(input).toMatchObject({
      slug: "test-lake",
      regionSlug: "gandaki",
      district: "Kaski",
      status: "DRAFT",
      practicalInfo: { status: "UNVERIFIED" },
      coordinates: { latitude: 28.2, longitude: 83.9 },
    });
    expect(input.images).toEqual([]);
    expect(input.sources?.[0].title).toMatch(/Geographic verification/);
  });
});
