import { describe, expect, it } from "vitest";

import { formatCostRange, formatDate, formatDays, formatElevation, toParagraphs } from "./format";

describe("format helpers", () => {
  it("formats cost ranges", () => {
    expect(formatCostRange(8000, 20000, "NPR")).toBe("NPR 8,000–20,000");
    expect(formatCostRange(40, 40, "USD")).toBe("USD 40");
  });

  it("formats elevation and days", () => {
    expect(formatElevation(2990)).toBe("2,990 m");
    expect(formatDays(1)).toBe("1 day");
    expect(formatDays(6)).toBe("6 days");
  });

  it("formats dates in Nepal time", () => {
    // 20:00 UTC on 14 Oct is already 15 Oct in Kathmandu (UTC+5:45).
    expect(formatDate(new Date("2026-10-14T20:00:00Z"))).toBe("15 October 2026");
  });

  it("splits text on blank lines", () => {
    expect(toParagraphs("One.\n\n  Two.\n \nThree.")).toEqual(["One.", "Two.", "Three."]);
    expect(toParagraphs(null)).toEqual([]);
  });
});
