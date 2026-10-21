import { describe, expect, it } from "vitest";

import { coordinatesInNepal, isReliableGeoSource } from "./geo";

describe("isReliableGeoSource", () => {
  it("accepts the documented geographic sources", () => {
    expect(isReliableGeoSource("https://www.openstreetmap.org/node/1")).toBe(true);
    expect(isReliableGeoSource("https://nominatim.openstreetmap.org/search?q=Kaski")).toBe(true);
    expect(isReliableGeoSource("https://www.wikidata.org/wiki/Q123")).toBe(true);
    expect(isReliableGeoSource("https://ntb.gov.np/places-to-go")).toBe(true);
    expect(isReliableGeoSource("https://whc.unesco.org/en/list/121/")).toBe(true);
    expect(isReliableGeoSource("https://moctca.gov.np/")).toBe(true);
  });

  it("rejects insecure, generic or social sources", () => {
    expect(isReliableGeoSource("http://www.openstreetmap.org/node/1")).toBe(false);
    expect(isReliableGeoSource("https://example.com/place")).toBe(false);
    expect(isReliableGeoSource("https://instagram.com/p/Short12345/")).toBe(false);
    expect(isReliableGeoSource(null)).toBe(false);
  });
});

describe("coordinatesInNepal", () => {
  it("accepts points inside Nepal and rejects outliers", () => {
    expect(coordinatesInNepal(28.2096, 83.9856)).toBe(true);
    expect(coordinatesInNepal(40.7128, -74.006)).toBe(false);
    expect(coordinatesInNepal(26.0, 83.9856)).toBe(false);
  });
});
