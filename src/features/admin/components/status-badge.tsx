import type { PublishStatus } from "@/generated/prisma/enums";

const STYLES: Record<PublishStatus, string> = {
  PUBLISHED: "border-teal/40 bg-teal/10 text-teal-button",
  DRAFT: "border-gold/50 bg-gold/15 text-navy",
  ARCHIVED: "border-border bg-ivory-deep text-ink-muted",
};

const LABELS: Record<PublishStatus, string> = {
  PUBLISHED: "Published",
  DRAFT: "Draft",
  ARCHIVED: "Archived",
};

export function StatusBadge({ status }: { status: PublishStatus }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold " +
        STYLES[status]
      }
    >
      {LABELS[status]}
    </span>
  );
}
