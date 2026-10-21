import type { Metadata } from "next";
import Link from "next/link";

import { AdminHeading } from "@/features/admin/components/admin-heading";
import { EmptyState } from "@/features/admin/components/empty-state";
import { requireAdminPage } from "@/features/auth/session";
import { listInstagramAdminData } from "@/features/instagram/admin";
import { InstagramReferenceForm } from "@/features/instagram/components/instagram-reference-form";
import { formatDate } from "@/features/destinations/format";

export const metadata: Metadata = { title: "Instagram references" };

const RIGHTS_LABEL: Record<string, string> = {
  PERMITTED: "Permitted — public",
  UNVERIFIED: "Unverified — hidden",
};

export default async function AdminInstagramPage() {
  const actor = await requireAdminPage("/admin/instagram");
  const { destinations, posts } = await listInstagramAdminData(actor);

  return (
    <>
      <AdminHeading
        eyebrow="References"
        title="Instagram references"
        intro="Store public Instagram links as outbound references. Nothing is scraped, and images are never rehosted. Only PERMITTED posts appear on a destination page."
      />

      {destinations.length === 0 ? (
        <EmptyState title="No published destinations">
          Publish a destination before attaching Instagram references.
        </EmptyState>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <section>
            <h3 className="mb-3 font-serif text-xl text-navy">Add a reference</h3>
            <InstagramReferenceForm destinations={destinations} />
            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
              Manual entry uses the same shortcode parser and idempotent importer as the CLI.
              Re-submitting an existing post updates it rather than creating a duplicate.
            </p>
          </section>

          <section>
            <h3 className="mb-3 font-serif text-xl text-navy">Existing references</h3>
            {posts.length === 0 ? (
              <EmptyState title="No references yet">
                Add a public post URL to start the collection.
              </EmptyState>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border bg-white">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-border bg-ivory">
                    <tr>
                      <th scope="col" className="p-3 font-semibold">Post</th>
                      <th scope="col" className="p-3 font-semibold">Destination</th>
                      <th scope="col" className="p-3 font-semibold">Rights</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {posts.map((post) => (
                      <tr key={post.id} className="align-top">
                        <td className="p-3">
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-himalaya underline-offset-4 hover:underline"
                          >
                            {post.creatorUsername ? `@${post.creatorUsername}` : "Instagram post"}
                            <span className="sr-only"> (opens in a new tab)</span>
                          </a>
                          <p className="mt-1 text-xs text-ink-muted">
                            {post.sourceMethod} · {formatDate(post.collectedAt)}
                          </p>
                        </td>
                        <td className="p-3">
                          <Link
                            href={`/admin/destinations?q=${encodeURIComponent(post.destination.name)}`}
                            className="text-navy underline-offset-4 hover:underline"
                          >
                            {post.destination.name}
                          </Link>
                          <p className="font-mono text-xs text-ink-muted">
                            {post.destination.slug}
                          </p>
                        </td>
                        <td className="p-3">
                          <span
                            className={
                              "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold " +
                              (post.rightsStatus === "PERMITTED"
                                ? "border-teal/40 bg-teal/10 text-teal-button"
                                : "border-gold/50 bg-gold/15 text-navy")
                            }
                          >
                            {RIGHTS_LABEL[post.rightsStatus] ?? post.rightsStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
