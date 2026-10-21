import { describe, expect, it } from "vitest";

import {
  addTripStopSchema,
  reorderTripStopsSchema,
  stopOrderSchema,
  tripDetailsSchema,
  tripDaySchema,
  updateTripStopSchema,
} from "./validation";

const details = { id: "trip-1", title: "Kathmandu Valley", notes: "" };

describe("trip validation", () => {
  it("trims the title and treats blank notes as absent", () => {
    const parsed = tripDetailsSchema.parse({ ...details, title: "  Kathmandu Valley  ", notes: "   " });
    expect(parsed).toEqual({ id: "trip-1", title: "Kathmandu Valley", notes: undefined });
  });

  it("requires a real name and caps the notes", () => {
    const short = tripDetailsSchema.safeParse({ ...details, title: "x" });
    expect(short.success).toBe(false);
    if (!short.success) expect(short.error.issues[0]?.path).toEqual(["title"]);

    const long = tripDetailsSchema.safeParse({ ...details, notes: "n".repeat(4001) });
    expect(long.success).toBe(false);
    if (!long.success) expect(long.error.issues[0]?.path).toEqual(["notes"]);
  });

  it("accepts an optional whole day between 1 and 60 only", () => {
    expect(tripDaySchema.parse("")).toBeUndefined();
    expect(tripDaySchema.parse(" 12 ")).toBe(12);
    for (const bad of ["0", "61", "2.5", "-1", "day two"]) {
      expect(tripDaySchema.safeParse(bad).success).toBe(false);
    }
  });

  it("validates stop ids and destination slugs", () => {
    expect(addTripStopSchema.safeParse({ tripId: "trip-1", slug: "rara-lake" }).success).toBe(true);
    expect(addTripStopSchema.safeParse({ tripId: "trip-1", slug: "Bad Slug" }).success).toBe(false);
    expect(addTripStopSchema.safeParse({ tripId: "", slug: "rara-lake" }).success).toBe(false);
  });

  it("caps a full stop order at the trip stop limit", () => {
    const ids = Array.from({ length: 50 }, (_, i) => `stop-${i}`);
    expect(stopOrderSchema.safeParse(ids).success).toBe(true);
    expect(stopOrderSchema.safeParse([...ids, "stop-50"]).success).toBe(false);
    expect(reorderTripStopsSchema.safeParse({ tripId: "trip-1", order: ids }).success).toBe(true);
  });

  it("allows blank stop notes and day, and rejects oversized notes", () => {
    const parsed = updateTripStopSchema.parse({
      tripId: "trip-1",
      stopId: "stop-1",
      notes: "  ",
      day: "",
    });
    expect(parsed).toMatchObject({ notes: undefined, day: undefined });
    expect(
      updateTripStopSchema.safeParse({
        tripId: "trip-1",
        stopId: "stop-1",
        notes: "n".repeat(2001),
      }).success,
    ).toBe(false);
  });
});
