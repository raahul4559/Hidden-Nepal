import { ArrowUpRight, MapPin } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";

import { PhotoCredit } from "@/components/media/photo-credit";
import { RemoteImage } from "@/components/media/remote-image";
import { getCategory } from "@/features/experiences/categories";

import { destinationHref } from "../schemas";
import type { DestinationSummary } from "../types";
import { SampleBadge } from "./sample-badge";

type DestinationCardProps = {
  destination: DestinationSummary;
  /** `feature` is the large lead card in editorial grids. */
  variant?: "default" | "feature";
  headingLevel?: "h2" | "h3";
};

/**
 * Whole card is clickable via a stretched link on the title; the photo
 * credit sits above it so its own link stays reachable.
 */
export function DestinationCard({
  destination,
  variant = "default",
  headingLevel: Heading = "h3",
}: DestinationCardProps) {
  const category = destination.category ? getCategory(destination.category) : undefined;
  const cover = destination.coverImage;
  const feature = variant === "feature";
  const place = [destination.district, destination.region.name].filter(Boolean).join(", ");

  return (
    <article
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-md border border-border bg-card transition-[border-color,box-shadow] duration-300 hover:border-navy/25 hover:shadow-lg hover:shadow-navy/5 focus-within:border-navy/25",
        feature && "lg:grid lg:grid-cols-[1.35fr_1fr]",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-navy-800",
          feature ? "aspect-[4/3] lg:aspect-auto lg:min-h-[26rem]" : "aspect-[4/3]",
        )}
      >
        <RemoteImage
          src={cover?.url}
          alt={cover?.alt ?? ""}
          sizes={
            feature
              ? "(min-width: 1024px) 45vw, 100vw"
              : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          }
          className="object-cover transition-transform duration-700 ease-out-soft motion-safe:group-hover:scale-[1.03]"
        />
        {cover?.credit ? (
          <PhotoCredit
            author={cover.credit}
            license={cover.license}
            sourceUrl={cover.sourceUrl}
            className="absolute right-2 bottom-2 z-10"
          />
        ) : null}
      </div>

      <div className={cn("flex flex-1 flex-col p-5", feature && "lg:justify-end lg:p-8")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {category ? <p className="eyebrow text-himalaya">{category.shortLabel}</p> : null}
          {destination.isSample ? <SampleBadge /> : null}
        </div>
        <Heading
          className={cn(
            "mt-2 font-serif leading-tight text-balance",
            feature ? "text-3xl lg:text-4xl" : "text-2xl",
          )}
        >
          <Link
            href={destinationHref(destination.slug)}
            className="rounded-sm after:absolute after:inset-0 after:content-['']"
          >
            {destination.name}
          </Link>
        </Heading>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin aria-hidden className="size-3.5 shrink-0" />
          {place}
          {destination.elevationM ? (
            <span>· {destination.elevationM.toLocaleString("en-US")} m</span>
          ) : null}
        </p>
        <p
          className={cn(
            "mt-3 leading-relaxed text-muted-foreground",
            feature ? "text-base lg:text-lg" : "line-clamp-3 text-sm",
          )}
        >
          {destination.summary}
        </p>
        <span
          aria-hidden
          className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-himalaya"
        >
          View destination
          <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </article>
  );
}

export function DestinationCardSkeleton({ variant = "default" }: { variant?: "default" | "feature" }) {
  return (
    <div
      aria-hidden
      className={cn(
        "overflow-hidden rounded-md border border-border bg-card",
        variant === "feature" && "lg:grid lg:grid-cols-[1.35fr_1fr]",
      )}
    >
      <div
        className={cn(
          "aspect-[4/3] animate-pulse bg-ivory-deep",
          variant === "feature" && "lg:aspect-auto lg:min-h-[26rem]",
        )}
      />
      <div className="space-y-3 p-5">
        <div className="h-3 w-20 animate-pulse rounded-sm bg-ivory-deep" />
        <div className="h-6 w-3/4 animate-pulse rounded-sm bg-ivory-deep" />
        <div className="h-3 w-1/2 animate-pulse rounded-sm bg-ivory-deep" />
      </div>
    </div>
  );
}
