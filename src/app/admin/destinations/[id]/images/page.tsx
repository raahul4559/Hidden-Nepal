import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LinkButton } from "@/components/ui/link-button";
import { AdminHeading } from "@/features/admin/components/admin-heading";
import { ImageManager } from "@/features/admin/components/image-manager";
import { getAdminDestinationImages } from "@/features/admin/destinations";
import { isStorageConfigured } from "@/features/uploads/provider";

export const metadata: Metadata = { title: "Gallery" };

export default async function DestinationImagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getAdminDestinationImages(id);

  if (result.status === "unconfigured") {
    return (
      <>
        <AdminHeading eyebrow="Content" title="Gallery" />
        <p className="rounded-md border border-gold/50 bg-gold/10 p-4 text-sm">
          Connect a database to manage images.
        </p>
      </>
    );
  }
  if (result.status === "error") throw new Error("Could not load gallery");
  if (!result.destination) notFound();

  const destination = result.destination;

  return (
    <>
      <AdminHeading
        eyebrow="Gallery"
        title={destination.name}
        intro={
          <>
            Manage alt text, attribution and display order. The first image is the cover.{" "}
            <Link href={`/admin/destinations/${id}/edit`} className="font-medium text-himalaya hover:underline">
              Back to content
            </Link>
          </>
        }
        actions={
          <>
            <LinkButton href={`/admin/destinations/${id}/preview`} variant="outline" size="sm">
              Preview
            </LinkButton>
            {destination.images.length ? (
              <LinkButton href={`/destinations/${destination.slug}`} variant="outline" size="sm">
                Public page
              </LinkButton>
            ) : null}
          </>
        }
      />
      <ImageManager destination={destination} storageConfigured={isStorageConfigured()} />
    </>
  );
}
