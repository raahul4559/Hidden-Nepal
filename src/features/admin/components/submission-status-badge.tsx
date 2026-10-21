import type { SubmissionStatus } from "@/generated/prisma/enums";

import { SUBMISSION_STATUS_LABELS } from "../submission-review";

const STYLES: Record<SubmissionStatus, string> = {
  PENDING: "border-gold/50 bg-gold/15 text-navy",
  CHANGES_REQUESTED: "border-himalaya/40 bg-himalaya/10 text-himalaya",
  APPROVED: "border-teal/40 bg-teal/10 text-teal-button",
  REJECTED: "border-destructive/40 bg-destructive/10 text-destructive",
  SPAM: "border-border bg-ivory-deep text-ink-muted",
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold " +
        STYLES[status]
      }
    >
      {SUBMISSION_STATUS_LABELS[status]}
    </span>
  );
}
