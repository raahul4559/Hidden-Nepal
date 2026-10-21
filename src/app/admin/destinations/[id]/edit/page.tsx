import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { LinkButton } from "@/components/ui/link-button";
import { setDestinationStatusAction } from "@/features/admin/actions/destinations";
import { AdminHeading } from "@/features/admin/components/admin-heading";
import {
  DestinationForm,
  type DestinationFormValues,
} from "@/features/admin/components/destination-form";
import { StatusActionForm } from "@/features/admin/components/status-action-form";
import { getAdminDestinationForForm } from "@/features/admin/destinations";
import { getAdminReferenceOptions } from "@/features/admin/reference";

export const metadata: Metadata = { title: "Edit destination" };

export default async function EditDestinationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const [destinationResult, referenceResult] = await Promise.all([
    getAdminDestinationForForm(id),
    getAdminReferenceOptions(),
  ]);

  if (destinationResult.status === "unconfigured" || referenceResult.status === "unconfigured") {
    return (
      <>
        <AdminHeading eyebrow="Content" title="Edit destination" />
        <p className="rounded-md border border-gold/50 bg-gold/10 p-4 text-sm">
          Connect a database to edit destinations.
        </p>
      </>
    );
  }
  if (destinationResult.status === "error" || referenceResult.status === "error") {
    throw new Error("Could not load destination");
  }
  if (!destinationResult.destination) notFound();

  const destination = destinationResult.destination;
  const values: DestinationFormValues = {
    id: destination.id,
    slug: destination.slug,
    name: destination.name,
    summary: destination.summary,
    description: destination.description,
    status: destination.status,
    isFeatured: destination.isFeatured,
    isHiddenGem: destination.isHiddenGem,
    isSample: destination.isSample,
    regionSlug: destination.regionSlug,
    district: destination.district,
    categorySlugs: destination.categorySlugs,
    activitySlugs: destination.activitySlugs,
    latitude: destination.latitude,
    longitude: destination.longitude,
    elevationM: destination.elevationM,
    costMin: destination.costMin,
    costMax: destination.costMax,
    currency: destination.currency,
    costNotes: destination.costNotes,
    difficulty: destination.difficulty,
    suggestedDays: destination.suggestedDays,
    seasons: destination.seasons,
    bestSeasonNotes: destination.bestSeasonNotes,
    accessInfo: destination.accessInfo,
    safetyInfo: destination.safetyInfo,
    practicalInfoStatus: destination.practicalInfoStatus,
    practicalInfoVerifiedAt: destination.practicalInfoVerifiedAt,
    imageCount: destination.imageCount,
  };

  const flash =
    query.created === "1"
      ? "Destination created. It is saved in PostgreSQL."
      : query.saved === "1"
        ? "Changes saved."
        : null;

  return (
    <>
      <AdminHeading
        eyebrow="Content"
        title={destination.name}
        intro={
          <>
            <span className="font-mono text-xs">{destination.slug}</span>
            {destination.isSample ? " · sample record" : ""}
          </>
        }
        actions={
          <>
            <LinkButton href={`/admin/destinations/${id}/preview`} variant="outline" size="sm">
              Preview
            </LinkButton>
            <LinkButton href={`/admin/destinations/${id}/images`} variant="outline" size="sm">
              Images ({destination.imageCount})
            </LinkButton>
            {destination.status === "PUBLISHED" ? (
              <LinkButton href={`/destinations/${destination.slug}`} variant="outline" size="sm">
                View public page
              </LinkButton>
            ) : null}
          </>
        }
      />

      {flash ? (
        <p role="status" className="mb-4 rounded-md border border-teal/40 bg-teal/10 px-4 py-3 text-sm text-teal-button">
          {flash}
        </p>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-md border border-border bg-white px-4 py-3">
        <span className="text-sm font-medium text-navy">Publication</span>
        {destination.status === "PUBLISHED" ? (
          <>
            <StatusActionForm
              id={id}
              intent="unpublish"
              label="Unpublish"
              action={setDestinationStatusAction}
            />
            <StatusActionForm
              id={id}
              intent="archive"
              label="Archive"
              action={setDestinationStatusAction}
              confirmMessage={`Archive ${destination.name}? It will disappear from the public site.`}
              variant="destructive"
            />
          </>
        ) : destination.status === "ARCHIVED" ? (
          <StatusActionForm
            id={id}
            intent="restore"
            label="Restore to draft"
            action={setDestinationStatusAction}
          />
        ) : (
          <>
            <StatusActionForm
              id={id}
              intent="publish"
              label="Publish"
              action={setDestinationStatusAction}
              variant="accent"
            />
            <StatusActionForm
              id={id}
              intent="archive"
              label="Archive"
              action={setDestinationStatusAction}
              confirmMessage={`Archive ${destination.name}?`}
              variant="destructive"
            />
          </>
        )}
        <Link
          href="/admin/destinations"
          className="ml-auto text-sm font-medium text-himalaya underline-offset-4 hover:underline"
        >
          Back to all destinations
        </Link>
      </div>

      <DestinationForm
        mode="edit"
        values={values}
        regions={referenceResult.regions}
        categories={referenceResult.categories}
        activities={referenceResult.activities}
      />
    </>
  );
}
