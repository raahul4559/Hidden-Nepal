import { describe, expect, it } from "vitest";

import { formDataToSubmission, placeSubmissionSchema } from "./validation";

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [k, v] of Object.entries(entries)) data.set(k, v);
  return formDataToSubmission(data);
};

const valid = {
  placeName: "A quiet waterfall",
  description: "A small waterfall above the village, reached by a forest path.",
  consentToShare: "on",
};

const fieldsWithErrors = (input: unknown) => {
  const r = placeSubmissionSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => i.path[0]);
};

describe("placeSubmissionSchema", () => {
  it("accepts a minimal submission and treats blanks as absent", () => {
    const parsed = placeSubmissionSchema.parse(
      form({ ...valid, region: "", category: "", submitterEmail: "", submitterName: "  " }),
    );
    expect(parsed).toMatchObject({ placeName: "A quiet waterfall", consentToShare: true });
    expect(parsed.region).toBeUndefined();
    expect(parsed.submitterEmail).toBeUndefined();
    expect(parsed.submitterName).toBeUndefined();
  });

  it("lowercases email and accepts known slugs", () => {
    const parsed = placeSubmissionSchema.parse(
      form({ ...valid, submitterEmail: "Guide@Example.COM", region: "karnali", category: "waterfalls" }),
    );
    expect(parsed).toMatchObject({ submitterEmail: "guide@example.com", region: "karnali", category: "waterfalls" });
  });

  it("requires consent, a name and a real description", () => {
    expect(fieldsWithErrors(form({ placeName: "X", description: "Too short" }))).toEqual([
      "placeName",
      "description",
      "consentToShare",
    ]);
  });

  it("rejects unknown provinces, categories and bad emails", () => {
    expect(
      fieldsWithErrors(form({ ...valid, region: "atlantis", category: "nightlife", submitterEmail: "nope" })),
    ).toEqual(["region", "category", "submitterEmail"]);
  });
});
