import Link from "next/link";
import { cn } from "cn";

import { siteConfig } from "@/lib/site";

/** Three-ridge mark with a gold sun; drawn inline so it inherits colour. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-8 shrink-0", className)}
      fill="none"
    >
      <circle cx="22.5" cy="9" r="3" fill="var(--gold)" />
      <path
        d="M2 26 11 12l5 7 4-5 10 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m8.5 16 2.5 1.5L13.5 15"
        stroke="var(--teal)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-sm text-current",
        className,
      )}
    >
      <LogoMark />
      <span className="font-serif text-xl leading-none font-medium tracking-tight">
        {siteConfig.name}
      </span>
    </Link>
  );
}
