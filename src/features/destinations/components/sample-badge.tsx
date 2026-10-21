import { FlaskConical } from "lucide-react";
import { cn } from "cn";

/** Marks development sample content so it is never mistaken for verified. */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-white/40 bg-[#071827]/95 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-black/25",
        className,
      )}
      title="Development sample: details are placeholders, not verified travel advice"
    >
      <FlaskConical aria-hidden className="size-3" />
      Sample content
    </span>
  );
}
