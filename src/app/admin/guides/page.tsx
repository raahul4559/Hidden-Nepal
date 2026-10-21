import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { setGuideStatusAction } from "@/features/admin/actions/guides";
import { AdminHeading } from "@/features/admin/components/admin-heading";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { EmptyState } from "@/features/admin/components/empty-state";
import { StatusActionForm } from "@/features/admin/components/status-action-form";
import { StatusBadge } from "@/features/admin/components/status-badge";
import { listAdminGuides } from "@/features/admin/guides";
import { adminListHref, parseAdminListFilters } from "@/features/admin/list-params";
import { formatDate } from "@/features/destinations/format";

export const metadata: Metadata = { title: "Travel guides" };

const TABS = [
  { value: "ALL", label: "All" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Drafts" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export default async function AdminGuidesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseAdminListFilters(await searchParams);
  const result = await listAdminGuides(filters);

  if (result.status === "unconfigured") {
    return (
      <>
        <AdminHeading eyebrow="Editorial" title="Travel guides" />
        <p className="rounded-md border border-gold/50 bg-gold/10 p-4 text-sm">
          Connect a database to manage guides.
        </p>
      </>
    );
  }
  if (result.status === "error") throw new Error("Could not load guides");

  return (
    <>
      <AdminHeading
        eyebrow="Editorial"
        title="Travel guides"
        intro="Long-form guides that support the destination catalogue. Plain text, deliberately simple."
        actions={
          <LinkButton href="/admin/guides/new" variant="accent" size="sm">
            New guide
          </LinkButton>
        }
      />

      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Filter guides by status" className="flex flex-wrap gap-1">
          {TABS.map((tab) => {
            const active = filters.status === tab.value;
            return (
              <Link
                key={tab.value}
                href={adminListHref("/admin/guides", filters, { status: tab.value, page: 1 })}
                aria-current={active ? "page" : undefined}
                className={
                  "rounded-md px-3 py-1.5 text-sm font-medium " +
                  (active
                    ? "bg-navy text-ivory"
                    : "text-ink-muted hover:bg-ivory-deep hover:text-navy")
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <form action="/admin/guides" method="get" className="flex items-center gap-2">
          {filters.status !== "ALL" ? (
            <input type="hidden" name="status" value={filters.status} />
          ) : null}
          <label htmlFor="guide-search" className="sr-only">
            Search guides
          </label>
          <input
            id="guide-search"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Title, slug or excerpt…"
            className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm sm:w-64"
          />
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>
      </div>

      <div className="mt-4">
        {result.guides.length === 0 ? (
          <EmptyState title={filters.q ? "No guides match that search" : "No guides yet"}>
            {filters.q ? (
              <Link href="/admin/guides" className="font-medium text-himalaya hover:underline">
                Clear the search
              </Link>
            ) : (
              <Link href="/admin/guides/new" className="font-medium text-himalaya hover:underline">
                Write the first guide
              </Link>
            )}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-ivory">
                <tr>
                  <th scope="col" className="p-3 font-semibold">Guide</th>
                  <th scope="col" className="p-3 font-semibold">Status</th>
                  <th scope="col" className="p-3 font-semibold">Author</th>
                  <th scope="col" className="p-3 font-semibold">Updated</th>
                  <th scope="col" className="p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.guides.map((guide) => (
                  <tr key={guide.id} className="align-top">
                    <td className="p-3">
                      <p className="font-semibold text-navy">{guide.title}</p>
                      <p className="font-mono text-xs text-ink-muted">{guide.slug}</p>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={guide.status} />
                    </td>
                    <td className="p-3 text-xs text-ink-muted">
                      {guide.author?.name || guide.author?.email || "—"}
                    </td>
                    <td className="p-3 text-xs text-ink-muted">{formatDate(guide.updatedAt)}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/guides/${guide.id}/edit`}
                          className="text-sm font-medium text-himalaya underline-offset-4 hover:underline"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/guides/${guide.id}/preview`}
                          className="text-sm font-medium text-ink-muted underline-offset-4 hover:underline"
                        >
                          Preview
                        </Link>
                        {guide.status === "PUBLISHED" ? (
                          <>
                            <StatusActionForm
                              id={guide.id}
                              intent="unpublish"
                              label="Unpublish"
                              action={setGuideStatusAction}
                              showMessage={false}
                            />
                            <StatusActionForm
                              id={guide.id}
                              intent="archive"
                              label="Archive"
                              action={setGuideStatusAction}
                              confirmMessage={`Archive ${guide.title}? It will be hidden from the public site.`}
                              variant="destructive"
                              showMessage={false}
                            />
                          </>
                        ) : guide.status === "ARCHIVED" ? (
                          <StatusActionForm
                            id={guide.id}
                            intent="restore"
                            label="Restore"
                            action={setGuideStatusAction}
                            showMessage={false}
                          />
                        ) : (
                          <>
                            <StatusActionForm
                              id={guide.id}
                              intent="publish"
                              label="Publish"
                              action={setGuideStatusAction}
                              variant="accent"
                              showMessage={false}
                            />
                            <StatusActionForm
                              id={guide.id}
                              intent="archive"
                              label="Archive"
                              action={setGuideStatusAction}
                              confirmMessage={`Archive ${guide.title}?`}
                              variant="destructive"
                              showMessage={false}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminPagination
        base="/admin/guides"
        filters={filters}
        total={result.total}
        page={result.page}
        pageCount={result.pageCount}
        pageSize={result.pageSize}
      />
    </>
  );
}
