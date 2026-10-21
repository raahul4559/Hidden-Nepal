import type { Metadata } from "next";
import Link from "next/link";

import { LinkButton } from "@/components/ui/link-button";
import { AdminHeading } from "@/features/admin/components/admin-heading";
import { EmptyState } from "@/features/admin/components/empty-state";
import { getAdminDashboard } from "@/features/admin/dashboard";
import { formatDate } from "@/features/destinations/format";

export const metadata: Metadata = { title: "Dashboard" };

const ACTION_LABELS: Record<string, string> = {
  "destination.created": "created a destination",
  "destination.updated": "updated a destination",
  "destination.published": "published a destination",
  "destination.unpublished": "unpublished a destination",
  "destination.archived": "archived a destination",
  "destination.restored": "restored a destination",
  "guide.created": "created a guide",
  "guide.updated": "updated a guide",
  "guide.published": "published a guide",
  "guide.unpublished": "unpublished a guide",
  "guide.archived": "archived a guide",
  "guide.restored": "restored a guide",
  "category.updated": "updated a category",
  "image.uploaded": "uploaded an image",
  "image.url_added": "added an image URL",
  "image.updated": "edited image details",
  "image.deleted": "removed an image",
  "image.reordered": "reordered a gallery",
  "user.role_changed": "changed a user role",
};

const ACTIVITY_DATE = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kathmandu",
});

export default async function AdminDashboardPage() {
  const result = await getAdminDashboard();

  if (result.status === "unconfigured") {
    return (
      <AdminHeading
        eyebrow="Overview"
        title="Dashboard"
        intro="The content studio is ready, but this environment has no database connection."
      >
        <p className="rounded-md border border-gold/50 bg-gold/10 p-4 text-sm">
          Set <code className="font-mono">DATABASE_URL</code> and run{" "}
          <code className="font-mono">npm run db:migrate</code> to start managing content.
        </p>
      </AdminHeading>
    );
  }
  if (result.status === "error") {
    throw new Error("Could not load dashboard counts");
  }

  const data = result;
  const pending = data.submissions.PENDING;

  const cards = [
    {
      label: "Published destinations",
      value: data.destinations.PUBLISHED,
      href: "/admin/destinations?status=PUBLISHED",
      note: "Visible on the public site",
    },
    {
      label: "Draft destinations",
      value: data.destinations.DRAFT,
      href: "/admin/destinations?status=DRAFT",
      note: "Previewable, not indexed",
    },
    {
      label: "Archived destinations",
      value: data.destinations.ARCHIVED,
      href: "/admin/destinations?status=ARCHIVED",
      note: "Hidden from public routes",
    },
    {
      label: "Pending submissions",
      value: pending,
      note: pending ? "Moderation arrives in the next chunk" : "Nothing waiting",
    },
    {
      label: "Published guides",
      value: data.guides.PUBLISHED,
      href: "/admin/guides?status=PUBLISHED",
      note: "Long-form editorial",
    },
    {
      label: "Draft guides",
      value: data.guides.DRAFT,
      href: "/admin/guides?status=DRAFT",
      note: "Work in progress",
    },
    {
      label: "Categories",
      value: data.categories,
      href: "/admin/categories",
      note: "Experience taxonomy",
    },
    {
      label: "All destinations",
      value: data.destinations.total,
      href: "/admin/destinations",
      note: "Every status",
    },
  ];

  return (
    <>
      <AdminHeading
        eyebrow="Overview"
        title="Dashboard"
        intro="Real counts from PostgreSQL, and the latest changes made by the editorial team."
        actions={
          <>
            <LinkButton href="/admin/destinations/new" variant="accent" size="sm">
              New destination
            </LinkButton>
            <LinkButton href="/admin/guides/new" variant="outline" size="sm">
              New guide
            </LinkButton>
          </>
        }
      />

      <section aria-labelledby="counts-heading">
        <h3 id="counts-heading" className="sr-only">
          Content counts
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const body = (
              <>
                <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  {card.label}
                </p>
                <p className="mt-3 font-serif text-4xl leading-none text-navy">{card.value}</p>
                <p className="mt-3 text-xs text-ink-muted">{card.note}</p>
              </>
            );
            return card.href ? (
              <Link
                key={card.label}
                href={card.href}
                className="rounded-md border border-border bg-white p-5 transition-colors hover:border-navy/30 hover:bg-ivory/60"
              >
                {body}
              </Link>
            ) : (
              <div key={card.label} className="rounded-md border border-border bg-white p-5">
                {body}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="activity-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 id="activity-heading" className="font-serif text-2xl text-navy">
              Recent activity
            </h3>
            <p className="mt-1 text-sm text-ink-muted">The last ten recorded administrative changes.</p>
          </div>
        </div>

        <div className="mt-4">
          {data.recentActivity.length === 0 ? (
            <EmptyState title="No activity yet">
              Create or publish a destination and it will appear here.
            </EmptyState>
          ) : (
            <ol className="divide-y divide-border overflow-hidden rounded-md border border-border bg-white">
              {data.recentActivity.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-start gap-3 p-4 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-navy">
                      <span className="font-semibold">
                        {entry.actor?.name || entry.actor?.email || "Deleted account"}
                      </span>{" "}
                      {ACTION_LABELS[entry.action] ?? entry.action}
                      {entry.entityId ? (
                        <span className="text-ink-muted"> · {entry.entityType}</span>
                      ) : null}
                    </p>
                    {entry.entityId ? (
                      <p className="mt-1 truncate font-mono text-xs text-ink-muted">{entry.entityId}</p>
                    ) : null}
                  </div>
                  <time dateTime={entry.createdAt.toISOString()} className="text-xs text-ink-muted">
                    {ACTIVITY_DATE.format(entry.createdAt)}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="today-heading">
        <h3 id="today-heading" className="font-serif text-2xl text-navy">
          Editorial notes
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-border bg-white p-5 text-sm">
            <p className="font-semibold text-navy">Publishing is immediate</p>
            <p className="mt-1 text-ink-muted">
              Publishing writes to PostgreSQL and refreshes the public destination pages. Drafts
              and archives are never shown by public queries.
            </p>
          </div>
          <div className="rounded-md border border-border bg-white p-5 text-sm">
            <p className="font-semibold text-navy">Audit trail</p>
            <p className="mt-1 text-ink-muted">
              {data.recentActivity.length
                ? `Latest change recorded ${formatDate(data.recentActivity[0]!.createdAt)}.`
                : "The audit log starts with the first content change."}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
