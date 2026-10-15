import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";

/**
 * Page numbers to show: always the first and last, plus a window around the
 * current page, with `null` marking a gap. e.g. 1 … 4 5 6 … 12
 */
export function pageWindow(page: number, pageCount: number, radius = 1): (number | null)[] {
  const pages = new Set([1, pageCount]);
  for (let p = page - radius; p <= page + radius; p++) {
    if (p >= 1 && p <= pageCount) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}

const item =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors";

export function Pagination({
  page,
  pageCount,
  hrefFor,
  label = "Pagination",
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
  label?: string;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label={label} className="flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={cn(item, "border-input/50 bg-white hover:border-navy")}>
          <ChevronLeft aria-hidden className="size-4" />
          <span>Previous</span>
        </Link>
      ) : null}

      <ul className="flex flex-wrap items-center gap-2">
        {pageWindow(page, pageCount).map((p, i) =>
          p === null ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-muted-foreground">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={hrefFor(p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Page ${p}`}
                className={cn(
                  item,
                  p === page
                    ? "border-navy bg-navy text-ivory"
                    : "border-input/50 bg-white hover:border-navy",
                )}
              >
                {p}
              </Link>
            </li>
          ),
        )}
      </ul>

      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} rel="next" className={cn(item, "border-input/50 bg-white hover:border-navy")}>
          <span>Next</span>
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
