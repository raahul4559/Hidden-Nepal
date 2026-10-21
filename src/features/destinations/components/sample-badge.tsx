import { ShieldQuestion } from "lucide-react";
import { cn } from "cn";

/** Keeps unverified placeholder details clearly marked for visitors. */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-white/40 bg-[#071827]/95 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-black/25",
        className,
      )}
      title="Travel details are placeholders and have not been verified"
    >
      <ShieldQuestion aria-hidden className="size-3" />
      Unverified details
    </span>
  );
}
