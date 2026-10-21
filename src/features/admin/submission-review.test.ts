import { describe, expect, it } from "vitest";

import type { SubmissionStatus } from "@/generated/prisma/enums";

import {
  availableReviewIntents,
  INITIAL_SUBMISSION_STATUS,
  isReviewAllowed,
  REVIEW_INTENTS,
  reviewInputSchema,
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_STATUSES,
} from "./submission-review";

describe("submission review rules", () => {
  it("lists every status with a label", () => {
    expect(SUBMISSION_STATUSES).toEqual([
      "PENDING",
      "CHANGES_REQUESTED",
      "APPROVED",
      "REJECTED",
      "SPAM",
    ]);
    for (const status of SUBMISSION_STATUSES) {
      expect(SUBMISSION_STATUS_LABELS[status]).toBeTruthy();
    }
    expect(INITIAL_SUBMISSION_STATUS).toBe("PENDING");
  });

  it("allows only the documented transitions", () => {
    const expected: Record<SubmissionStatus, readonly string[]> = {
      PENDING: ["approve", "reject", "request_changes"],
      CHANGES_REQUESTED: ["approve", "reject", "request_changes", "reopen"],
      REJECTED: ["approve", "request_changes", "reopen"],
      SPAM: ["approve", "reopen"],
      // Approval is final: publishing is a separate editorial step.
      APPROVED: [],
    };

    for (const status of SUBMISSION_STATUSES) {
      expect(availableReviewIntents(status)).toEqual(expected[status]);
      for (const intent of REVIEW_INTENTS) {
        expect(isReviewAllowed(status, intent)).toBe(expected[status].includes(intent));
      }
    }
  });

  it("requires an explanation to reject or request changes", () => {
    for (const intent of ["reject", "request_changes"] as const) {
      const missing = reviewInputSchema.safeParse({ id: "sub-1", intent });
      expect(missing.success).toBe(false);
      if (!missing.success) {
        expect(missing.error.issues[0]?.path).toEqual(["explanation"]);
      }

      const blank = reviewInputSchema.safeParse({ id: "sub-1", intent, explanation: "   " });
      expect(blank.success).toBe(false);

      const provided = reviewInputSchema.safeParse({
        id: "sub-1",
        intent,
        explanation: "  Please add the district.  ",
      });
      expect(provided.success).toBe(true);
      if (provided.success) expect(provided.data.explanation).toBe("Please add the district.");
    }
  });

  it("does not require an explanation to approve or reopen", () => {
    for (const intent of ["approve", "reopen"] as const) {
      expect(reviewInputSchema.safeParse({ id: "sub-1", intent }).success).toBe(true);
    }
    const blank = reviewInputSchema.parse({ id: "sub-1", intent: "approve", explanation: "  " });
    expect(blank.explanation).toBeUndefined();
  });

  it("rejects unknown intents and empty ids", () => {
    expect(reviewInputSchema.safeParse({ id: "sub-1", intent: "publish" }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ id: "", intent: "approve" }).success).toBe(false);
  });
});
