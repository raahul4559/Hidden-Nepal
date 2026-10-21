import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LinkButton } from "@/components/ui/link-button";
import { DestinationDetail } from "@/features/destinations/components/destination-detail";
import { getAdminDestinationForForm, getAdminDestinationPreview } from "@/features/admin/destinations";

export const metadata: Metadata = { title: "Preview destination", robots: { index: false } };

export default async function PreviewDestinationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [preview, form] = await Promise.all([
    getAdminDestinationPreview(id),
    getAdminDestinationForForm(id),
  ]);

  if (preview.status === "unconfigured" || form.status === "unconfigured") {
    return (
      <p className="rounded-md border border-gold/50 bg-gold/10 p-4 text-sm">
        Connect a database to preview destinations.
      </p>
    );
  }
  if (preview.status === "error" || form.status === "error") {
    throw new Error("Could not load destination preview");
  }
  if (!preview.destination || !form.destination) notFound();

  const status = form.destination.status;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-gold/50 bg-gold/10 px-4 py-3 text-sm">
        <span className="font-semibold text-navy">
          {status === "PUBLISHED" ? "Published preview" : `${status.toLowerCase()} preview`}
        </span>
        <span className="text-ink-muted">
          {status === "PUBLISHED"
            ? "This is the live public view."
            : "Only administrators can see this version. It is not indexed or linked publicly."}
        </span>
        <Link
          href={`/admin/destinations/${id}/edit`}
          className="ml-auto font-medium text-himalaya underline-offset-4 hover:underline"
        >
          Back to editor
        </Link>
      </div>
      <div className="overflow-hidden rounded-md border border-border">
        <DestinationDetail destination={preview.destination} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <LinkButton href={`/admin/destinations/${id}/edit`} variant="outline">
          Edit content
        </LinkButton>
        <LinkButton href={`/admin/destinations/${id}/images`} variant="outline">
          Manage gallery
        </LinkButton>
      </div>
    </>
  );
}
