import { describe, expect, it } from "vitest";

import { PublishStatus } from "@/generated/prisma/enums";

import { formDataToGuide, guideFormSchema } from "./guide-validation";

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const entries = {
    slug: "a-test-guide",
    title: "A test guide",
    excerpt: "A short excerpt.",
    body: "This guide body is deliberately longer than fifty characters so that it passes validation.",
    status: "DRAFT",
    ...overrides,
  };
  for (const [key, value] of Object.entries(entries)) {
    if (value !== "") data.set(key, value);
  }
  return data;
}

describe("guide form", () => {
  it("accepts a valid draft", () => {
    const parsed = guideFormSchema.safeParse(formDataToGuide(form()));
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.status).toBe(PublishStatus.DRAFT);
  });

  it("rejects an invalid slug", () => {
    const parsed = guideFormSchema.safeParse(formDataToGuide(form({ slug: "A Test Guide" })));
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.path[0] === "slug")).toBe(true);
    }
  });

  it("rejects a short body", () => {
    const parsed = guideFormSchema.safeParse(formDataToGuide(form({ body: "Too short" })));
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.path[0] === "body")).toBe(true);
    }
  });

  it("treats a blank excerpt as absent", () => {
    const parsed = guideFormSchema.safeParse(formDataToGuide(form({ excerpt: "" })));
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.excerpt).toBeUndefined();
  });
});
