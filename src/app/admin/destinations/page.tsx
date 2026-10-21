import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { setDestinationStatusAction } from "@/features/admin/actions/destinations";
import { AdminHeading } from "@/features/admin/components/admin-heading";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { EmptyState } from "@/features/admin/components/empty-state";
import { StatusActionForm } from "@/features/admin/components/status-action-form";
import { StatusBadge } from "@/features/admin/components/status-badge";
import { listAdminDestinations } from "@/features/admin/destinations";
import { adminListHref, parseAdminListFilters } from "@/features/admin/list-params";
import { formatDate } from "@/features/destinations/format";

export const metadata: Metadata = { title: "Destinations" };

const STATUS_TABS = [
  { value: "ALL", label: "All" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Drafts" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export default async function AdminDestinationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseAdminListFilters(await searchParams);
  const result = await listAdminDestinations(filters);

  if (result.status === "unconfigured") {
    return (
      <>
        <AdminHeading title="Destinations" eyebrow="Content" />
        <p className="rounded-md border border-gold/50 bg-gold/10 p-4 text-sm">
          Connect a database to manage destinations.
        </p>
      </>
    );
  }
  if (result.status === "error") {
    throw new Error("Could not load destinations");
  }

  const { destinations, total, page, pageCount, pageSize } = result;

  return (
    <>
      <AdminHeading
        eyebrow="Content"
        title="Destinations"
        intro="Search, edit, preview and publish the public destination catalogue."
        actions={
          <LinkButton href="/admin/destinations/new" variant="accent" size="sm">
            New destination
          </LinkButton>
        }
      />

      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Filter by status" className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => {
            const active = filters.status === tab.value;
            return (
              <Link
                key={tab.value}
                href={adminListHref("/admin/destinations", filters, {
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
              </Link>
            );
          })}
        </nav>

        <form action="/admin/destinations" method="get" className="flex items-center gap-2">
          {filters.status !== "ALL" ? (
            <input type="hidden" name="status" value={filters.status} />
          ) : null}
          <label htmlFor="destination-search" className="sr-only">
            Search destinations
          </label>
          <input
            id="destination-search"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Name, slug, district…"
            className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm sm:w-64"
          />
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>
      </div>

      <div className="mt-4">
        {destinations.length === 0 ? (
          <EmptyState
            title={filters.q ? "No destinations match that search" : "No destinations here yet"}
          >
            {filters.q ? (
              <Link href="/admin/destinations" className="font-medium text-himalaya hover:underline">
                Clear the search
              </Link>
            ) : (
              <Link
                href="/admin/destinations/new"
                className="font-medium text-himalaya hover:underline"
              >
                Create the first destination
              </Link>
            )}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border bg-white">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border bg-ivory">
                <tr>
                  <th scope="col" className="p-3 font-semibold">Destination</th>
                  <th scope="col" className="p-3 font-semibold">Status</th>
                  <th scope="col" className="p-3 font-semibold">Region</th>
                  <th scope="col" className="p-3 font-semibold">Gallery</th>
                  <th scope="col" className="p-3 font-semibold">Updated</th>
                  <th scope="col" className="p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {destinations.map((destination) => (
                  <tr key={destination.id} className="align-top">
                    <td className="p-3">
                      <p className="font-semibold text-navy">{destination.name}</p>
                      <p className="font-mono text-xs text-ink-muted">{destination.slug}</p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {destination.categoryCount} categor
                        {destination.categoryCount === 1 ? "y" : "ies"}
                      </p>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={destination.status} />
                    </td>
                    <td className="p-3 text-ink-muted">{destination.region}</td>
                    <td className="p-3 text-ink-muted">{destination.imageCount}</td>
                    <td className="p-3 text-xs text-ink-muted">
                      {formatDate(destination.updatedAt)}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/destinations/${destination.id}/edit`}
                          className="text-sm font-medium text-himalaya underline-offset-4 hover:underline"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/destinations/${destination.id}/preview`}
                          className="text-sm font-medium text-ink-muted underline-offset-4 hover:underline"
                        >
                          Preview
                        </Link>
                        <Link
                          href={`/admin/destinations/${destination.id}/images`}
                          className="text-sm font-medium text-ink-muted underline-offset-4 hover:underline"
                        >
                          Images
                        </Link>
                        {destination.status === "PUBLISHED" ? (
                          <>
                            <StatusActionForm
                              id={destination.id}
                              intent="unpublish"
                              label="Unpublish"
                              action={setDestinationStatusAction}
                              showMessage={false}
                            />
                            <StatusActionForm
                              id={destination.id}
                              intent="archive"
                              label="Archive"
                              action={setDestinationStatusAction}
                              confirmMessage={`Archive ${destination.name}? It will disappear from the public site.`}
                              variant="destructive"
                              showMessage={false}
                            />
                          </>
                        ) : destination.status === "ARCHIVED" ? (
                          <StatusActionForm
                            id={destination.id}
                            intent="restore"
                            label="Restore"
                            action={setDestinationStatusAction}
                            showMessage={false}
                          />
                        ) : (
                          <>
                            <StatusActionForm
                              id={destination.id}
                              intent="publish"
                              label="Publish"
                              action={setDestinationStatusAction}
                              variant="accent"
                              showMessage={false}
                            />
                            <StatusActionForm
                              id={destination.id}
                              intent="archive"
                              label="Archive"
                              action={setDestinationStatusAction}
                              confirmMessage={`Archive ${destination.name}?`}
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
        base="/admin/destinations"
        filters={filters}
        total={total}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
      />
    </>
  );
}
