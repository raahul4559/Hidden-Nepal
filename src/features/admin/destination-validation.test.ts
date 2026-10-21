import { describe, expect, it } from "vitest";

import { InfoStatus, PublishStatus, Season } from "@/generated/prisma/enums";
import { destinationInputSchema } from "@/features/destinations/validation";

import {
  adminDestinationFormSchema,
  formDataToAdminDestination,
  toDestinationInput,
} from "./destination-validation";

function form(overrides: Record<string, string | string[]> = {}) {
  const data = new FormData();
  const entries: Record<string, string | string[]> = {
    slug: "test-place",
    name: "Test Place",
    summary: "A quiet test place with enough detail to pass validation.",
    status: "DRAFT",
    regionSlug: "bagmati",
    categorySlugs: ["treks"],
    seasons: ["AUTUMN"],
    practicalInfoStatus: "UNVERIFIED",
    currency: "NPR",
    ...overrides,
  };

  for (const [key, value] of Object.entries(entries)) {
    if (Array.isArray(value)) {
      for (const item of value) data.append(key, item);
    } else if (value !== "") {
      data.set(key, value);
    }
  }
  return data;
}

function parse(overrides: Record<string, string | string[]> = {}) {
  return adminDestinationFormSchema.safeParse(formDataToAdminDestination(form(overrides)));
}

describe("admin destination form", () => {
  it("accepts a minimal draft and creates a canonical input", () => {
    const parsed = parse();
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const input = toDestinationInput(parsed.data);
    expect(input.status).toBe(PublishStatus.DRAFT);
    expect(input.seasons).toEqual([Season.AUTUMN]);
    expect(destinationInputSchema.safeParse(input).success).toBe(true);
  });

  it("sets a publication date automatically when publishing", () => {
    const parsed = parse({ status: "PUBLISHED" });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const input = toDestinationInput(parsed.data);
    expect(input.publishedAt).toBeInstanceOf(Date);
    expect(destinationInputSchema.safeParse(input).success).toBe(true);
  });

  it("rejects a slug with uppercase letters or underscores", () => {
    const parsed = parse({ slug: "Not_A_Slug" });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues.some((issue) => issue.path[0] === "slug")).toBe(true);
  });

  it("rejects a lone coordinate", () => {
    const parsed = parse({ latitude: "27.7" });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues.some((issue) => issue.path[0] === "latitude")).toBe(true);
  });

  it("rejects a lone cost value", () => {
    const parsed = parse({ costMin: "1000" });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues.some((issue) => issue.path[0] === "costMin")).toBe(true);
  });

  it("rejects a cost range that runs backwards", () => {
    const parsed = parse({ costMin: "5000", costMax: "1000" });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues.some((issue) => issue.path[0] === "costMax")).toBe(true);
  });

  it("requires a date for verified practical information", () => {
    const parsed = parse({ practicalInfoStatus: "VERIFIED" });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues.some((issue) => issue.path[0] === "practicalInfoVerifiedAt")).toBe(
      true,
    );
  });

  it("accepts verified practical information with a date", () => {
    const parsed = parse({
      practicalInfoStatus: "VERIFIED",
      practicalInfoVerifiedAt: "2026-10-21",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.practicalInfoVerifiedAt?.toISOString().slice(0, 10)).toBe("2026-10-21");
    expect(toDestinationInput(parsed.data).practicalInfo.status).toBe(InfoStatus.VERIFIED);
  });

  it("rejects categories outside the public taxonomy", () => {
    const parsed = parse({ categorySlugs: ["not-a-category"] });
    expect(parsed.success).toBe(false);
  });

  it("forces sample records to keep placeholder practical information", () => {
    const parsed = parse({ practicalInfoStatus: "VERIFIED", practicalInfoVerifiedAt: "2026-10-21" });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const input = toDestinationInput(parsed.data, { publishedAt: null, isSample: true });
    expect(input.practicalInfo.status).toBe(InfoStatus.PLACEHOLDER);
    expect(destinationInputSchema.safeParse(input).success).toBe(true);
  });

  it("rejects coordinates outside Nepal at the canonical validation layer", () => {
    const parsed = parse({ latitude: "51.5", longitude: "-0.1" });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(destinationInputSchema.safeParse(toDestinationInput(parsed.data)).success).toBe(false);
  });
});
