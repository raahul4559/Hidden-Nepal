import { Mountain } from "lucide-react";
import { cn } from "cn";

/**
 * Shown when a photo is missing or fails to load: a quiet contour-line
 * pattern on navy rather than a broken-image icon.
 */
export function ImageFallback({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "relative flex size-full items-center justify-center overflow-hidden bg-navy-800 text-ivory/40",
        className,
      )}
    >
      <svg
        aria-hidden
        className="absolute inset-0 size-full opacity-30"
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
      >
        {Array.from({ length: 9 }, (_, i) => (
          <path
            key={i}
            d={`M-10 ${150 - i * 14} C 40 ${120 - i * 16}, 80 ${170 - i * 12}, 120 ${130 - i * 15} S 190 ${110 - i * 10}, 220 ${135 - i * 14}`}
          />
        ))}
      </svg>
      <Mountain aria-hidden className="relative size-8" strokeWidth={1.25} />
    </div>
  );
}
