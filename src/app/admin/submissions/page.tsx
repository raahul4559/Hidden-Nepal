import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminHeading } from "@/features/admin/components/admin-heading";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { EmptyState } from "@/features/admin/components/empty-state";
import { SubmissionStatusBadge } from "@/features/admin/components/submission-status-badge";
import { adminListHref, parseAdminListFilters } from "@/features/admin/list-params";
import {
  type AdminSubmissionFilters,
  listAdminSubmissions,
} from "@/features/admin/submissions";
import {
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_STATUSES,
} from "@/features/admin/submission-review";
import { formatDate } from "@/features/destinations/format";

export const metadata: Metadata = { title: "Submissions" };

const TABS: readonly { value: AdminSubmissionFilters["status"]; label: string }[] = [
  ...SUBMISSION_STATUSES.map((status) => ({
    value: status,
    label: SUBMISSION_STATUS_LABELS[status],
  })),
  { value: "ALL", label: "All" },
];

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseAdminListFilters(await searchParams, SUBMISSION_STATUSES, "PENDING");
  const result = await listAdminSubmissions(filters);

  if (result.status === "unconfigured") {
    return (
      <>
        <AdminHeading title="Submissions" eyebrow="Community" />
        <p className="rounded-md border border-gold/50 bg-gold/10 p-4 text-sm">
          Connect a database to moderate community suggestions.
        </p>
      </>
    );
  }
  if (result.status === "error") {
    throw new Error("Could not load submissions");
  }

  const { submissions, total, page, pageCount, pageSize, counts } = result;

  return (
    <>
      <AdminHeading
        eyebrow="Community"
        title="Submissions"
        intro="Community suggestions wait here until an editor decides. Nothing is published from this queue: approval records the decision, and a researched destination is created separately."
      />

      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Filter by review status" className="flex flex-wrap gap-1">
          {TABS.map((tab) => {
            const active = filters.status === tab.value;
            const count = tab.value === "ALL" ? counts.total : counts[tab.value];
            return (
              <Link
                key={tab.value}
                href={adminListHref("/admin/submissions", filters, {
                  status: tab.value,
                  page: 1,
                })}
                aria-current={active ? "page" : undefined}
                className={
                  "rounded-md px-3 py-1.5 text-sm font-medium " +
                  (active
                    ? "bg-navy text-ivory"
                    : "text-ink-muted hover:bg-ivory-deep hover:text-navy")
                }
              >
                {tab.label}
                <span className={active ? "ml-1.5 text-ivory/70" : "ml-1.5 text-ink-muted/70"}>
                  {count}
                </span>
              </Link>
            );
          })}
        </nav>

        <form action="/admin/submissions" method="get" className="flex items-center gap-2">
          {filters.status !== "ALL" ? (
            <input type="hidden" name="status" value={filters.status} />
          ) : null}
          <label htmlFor="submission-search" className="sr-only">
            Search submissions
          </label>
          <input
            id="submission-search"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Place, district, submitter…"
            className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm sm:w-64"
          />
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>
      </div>

      <div className="mt-4">
        {submissions.length === 0 ? (
          <EmptyState
            title={
              filters.q
                ? "No submissions match that search"
                : filters.status === "PENDING"
                  ? "Nothing is waiting for review"
                  : "No submissions with this status"
            }
          >
            {filters.q ? (
              <Link href="/admin/submissions" className="font-medium text-himalaya hover:underline">
                Clear the search
              </Link>
            ) : filters.status === "PENDING" ? (
              <Link
                href="/admin/submissions?status=ALL"
                className="font-medium text-himalaya hover:underline"
              >
                See every submission
              </Link>
            ) : null}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border bg-white">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border bg-ivory">
                <tr>
                  <th scope="col" className="p-3 font-semibold">Place</th>
                  <th scope="col" className="p-3 font-semibold">Province / district</th>
                  <th scope="col" className="p-3 font-semibold">Category</th>
                  <th scope="col" className="p-3 font-semibold">Submitted by</th>
                  <th scope="col" className="p-3 font-semibold">Status</th>
                  <th scope="col" className="p-3 font-semibold">Received</th>
                  <th scope="col" className="p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="align-top">
                    <td className="p-3">
                      <Link
                        href={`/admin/submissions/${submission.id}`}
                        className="font-semibold text-navy underline-offset-4 hover:underline"
                      >
                        {submission.placeName}
                      </Link>
                      {submission.hasImage ? (
                        <p className="mt-1 text-xs text-ink-muted">Photo attached</p>
                      ) : null}
                    </td>
                    <td className="p-3 text-ink-muted">
                      {[submission.regionName, submission.district].filter(Boolean).join(" · ") ||
                        "—"}
                    </td>
                    <td className="p-3 text-ink-muted">{submission.categoryName ?? "—"}</td>
                    <td className="p-3 text-ink-muted">
                      {submission.submitterName ?? submission.submitterEmail ?? "Anonymous"}
                    </td>
                    <td className="p-3">
                      <SubmissionStatusBadge status={submission.status} />
                    </td>
                    <td className="p-3 text-xs text-ink-muted">
                      {formatDate(submission.createdAt)}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/admin/submissions/${submission.id}`}
                        className="text-sm font-medium text-himalaya underline-offset-4 hover:underline"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminPagination
        base="/admin/submissions"
        filters={filters}
        total={total}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
      />
    </>
  );
}
