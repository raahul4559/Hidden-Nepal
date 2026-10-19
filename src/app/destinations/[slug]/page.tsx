import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DestinationDetail } from "@/features/destinations/components/destination-detail";
import { getDestinationBySlug } from "@/features/destinations/queries";
import { destinationHref } from "@/features/destinations/schemas";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/site";

import { DestinationDetailSkeleton } from "./skeleton";

export async function generateMetadata({
  params,
}: PageProps<"/destinations/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getDestinationBySlug(slug);
  const destination = result.status === "ok" ? result.destination : null;
  if (!destination) return { title: "Destination not found", robots: { index: false } };

  const cover = destination.images[0];
  return {
    title: destination.name,
    description: destination.summary,
    alternates: { canonical: destinationHref(destination.slug) },
    // Sample content should never be indexed.
    robots: destination.isSample ? { index: false, follow: true } : undefined,
    openGraph: {
      title: destination.name,
      description: destination.summary,
      type: "article",
      url: destinationHref(destination.slug),
      images: cover
        ? [{ url: cover.url, alt: cover.alt }]
        : [DEFAULT_SOCIAL_IMAGE],
    },
  };
}

export default function DestinationPage({ params }: PageProps<"/destinations/[slug]">) {
  // Params are awaited inside Suspense so unknown slugs still get an instant shell.
  return (
    <Suspense fallback={<DestinationDetailSkeleton />}>
      <DestinationContent params={params} />
    </Suspense>
  );
}

async function DestinationContent({ params }: Pick<PageProps<"/destinations/[slug]">, "params">) {
  const { slug } = await params;
  const result = await getDestinationBySlug(slug);

  // Let the error boundary handle failures; a missing row is a real 404.
  if (result.status === "error") throw new Error("Destination could not be loaded");
  if (result.status !== "ok" || !result.destination) notFound();

  return <DestinationDetail destination={result.destination} />;
}
