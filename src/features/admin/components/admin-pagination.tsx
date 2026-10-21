import Link from "next/link";

import { adminListHref, type AdminListFilters } from "../list-params";

export function AdminPagination({
  base,
  filters,
  total,
  page,
  pageCount,
  pageSize,
}: {
  base: string;
  filters: AdminListFilters<string>;
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-ink-muted">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            className="rounded-md border border-border bg-white px-3 py-1.5 font-medium hover:bg-ivory-deep"
            href={adminListHref(base, filters, { page: page - 1 })}
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-md border border-border/60 px-3 py-1.5 text-ink-muted/50">
            Previous
          </span>
        )}
        <span className="px-2 text-ink-muted">
          Page {page} of {pageCount}
        </span>
        {page < pageCount ? (
          <Link
            className="rounded-md border border-border bg-white px-3 py-1.5 font-medium hover:bg-ivory-deep"
            href={adminListHref(base, filters, { page: page + 1 })}
          >
            Next
          </Link>
        ) : (
          <span className="rounded-md border border-border/60 px-3 py-1.5 text-ink-muted/50">
            Next
          </span>
        )}
      </div>
    </div>
  );
}
