import { z } from "zod";

import type { SubmissionStatus } from "@/generated/prisma/enums";

/**
 * Pure moderation rules: no database, no session, safe to import from client
 * components (the review form needs the labels and allowed intents).
 */

export const SUBMISSION_STATUSES: readonly SubmissionStatus[] = [
  "PENDING",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
  "SPAM",
];

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  PENDING: "Pending",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SPAM: "Spam",
};

export const REVIEW_INTENTS = ["approve", "reject", "request_changes", "reopen"] as const;
export type ReviewIntent = (typeof REVIEW_INTENTS)[number];

export const REVIEW_OUTCOMES: Record<
  ReviewIntent,
  { status: SubmissionStatus; auditAction: string; label: string; done: string }
> = {
  approve: {
    status: "APPROVED",
    auditAction: "submission.approved",
    label: "Approve",
    // Approval records a decision. It must never publish a place on its own:
    // the catalogue entry is researched and created separately.
    done: "Approved. Nothing was published.",
  },
  reject: {
    status: "REJECTED",
    auditAction: "submission.rejected",
    label: "Reject",
    done: "Rejected. The explanation was saved.",
  },
  request_changes: {
    status: "CHANGES_REQUESTED",
    auditAction: "submission.changes_requested",
    label: "Request changes",
    done: "Changes requested. The explanation was saved.",
  },
  reopen: {
    status: "PENDING",
    auditAction: "submission.reopened",
    label: "Reopen",
    done: "Reopened and returned to the pending queue.",
  },
};

/** Only these transitions make sense in the review workflow. */
const TRANSITIONS: Record<SubmissionStatus, readonly ReviewIntent[]> = {
  PENDING: ["approve", "reject", "request_changes"],
  CHANGES_REQUESTED: ["approve", "reject", "request_changes", "reopen"],
  REJECTED: ["approve", "request_changes", "reopen"],
  SPAM: ["approve", "reopen"],
  // A recorded approval is final. Publication is a separate editorial step.
  APPROVED: [],
};

export function availableReviewIntents(from: SubmissionStatus): readonly ReviewIntent[] {
  return TRANSITIONS[from];
}

export function isReviewAllowed(from: SubmissionStatus, intent: ReviewIntent): boolean {
  return TRANSITIONS[from].includes(intent);
}

/** Refusals and change requests must say why; approval and reopening need not. */
export const EXPLANATION_REQUIRED: readonly ReviewIntent[] = ["reject", "request_changes"];

export const REVIEW_NOTE_MAX = 1000;

export const reviewInputSchema = z
  .object({
    id: z.string().trim().min(1, "Missing suggestion id").max(64),
    intent: z.enum(REVIEW_INTENTS, { error: "Choose a review action" }),
    explanation: z
      .string()
      .trim()
      .max(REVIEW_NOTE_MAX, `Keep the explanation under ${REVIEW_NOTE_MAX} characters`)
      .optional()
      .transform((value) => (value === "" ? undefined : value)),
  })
  .superRefine((data, ctx) => {
    if (!EXPLANATION_REQUIRED.includes(data.intent) || data.explanation) return;
    ctx.addIssue({
      code: "custom",
      path: ["explanation"],
      message:
        data.intent === "reject"
          ? "Explain why this suggestion is being rejected."
          : "Explain what needs to change.",
    });
  });

export type ReviewInput = z.output<typeof reviewInputSchema>;

/** Never accepted from the browser: submissions always start pending. */
export const INITIAL_SUBMISSION_STATUS: SubmissionStatus = "PENDING";
