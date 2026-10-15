import { MapPin } from "lucide-react";

import { PhotoCredit } from "@/components/media/photo-credit";
import { RemoteImage } from "@/components/media/remote-image";
import { getCategory } from "@/features/experiences/categories";

import type { DestinationSummary } from "../types";

/**
 * Card for a published destination. Not linked yet: destination detail
 * pages arrive in a later phase, and we don't ship links to missing routes.
 */
export function DestinationCard({ destination }: { destination: DestinationSummary }) {
  const category = getCategory(destination.category);
  const cover = destination.coverImage;
  const place = [destination.district, destination.region.name]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="group flex flex-col overflow-hidden rounded-md border border-border bg-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-navy-800">
        <RemoteImage
          src={cover?.url}
          alt={cover?.alt ?? ""}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out-soft motion-safe:group-hover:scale-[1.03]"
        />
        {cover?.credit ? (
          <PhotoCredit
            author={cover.credit}
            license={cover.license}
            sourceUrl={cover.sourceUrl}
            className="absolute right-2 bottom-2"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {category ? (
          <p className="eyebrow text-himalaya">{category.shortLabel}</p>
        ) : null}
        <h3 className="mt-2 font-serif text-2xl leading-tight">{destination.name}</h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin aria-hidden className="size-3.5" />
          {place}
          {destination.elevationM ? (
            <span>· {destination.elevationM.toLocaleString("en-US")} m</span>
          ) : null}
        </p>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {destination.summary}
        </p>
      </div>
    </article>
  );
}

export function DestinationCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card" aria-hidden>
      <div className="aspect-[4/3] animate-pulse bg-ivory-deep" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-20 animate-pulse rounded-sm bg-ivory-deep" />
        <div className="h-6 w-3/4 animate-pulse rounded-sm bg-ivory-deep" />
        <div className="h-3 w-1/2 animate-pulse rounded-sm bg-ivory-deep" />
      </div>
    </div>
  );
}
