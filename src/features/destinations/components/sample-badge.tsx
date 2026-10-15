import { FlaskConical } from "lucide-react";
import { cn } from "cn";

/** Marks development sample content so it is never mistaken for verified. */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative z-10 inline-flex items-center gap-1 rounded-sm border border-gold/70 bg-gold/15 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-navy",
        className,
      )}
      title="Development sample: details are placeholders, not verified travel advice"
    >
      <FlaskConical aria-hidden className="size-3" />
      Sample content
    </span>
  );
}
