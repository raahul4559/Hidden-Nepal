import { ChevronRight, CloudOff, Compass } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { cn } from "cn";

import { SectionHeading } from "@/components/editorial/section-heading";
import { PhotoCredit } from "@/components/media/photo-credit";
import { RemoteImage } from "@/components/media/remote-image";
import { getCategory } from "@/features/experiences/categories";

import { getHiddenGems } from "../queries";
import { destinationHref } from "../schemas";
import type { DestinationSpotlight } from "../types";
import { StatePanel } from "./destination-results";
import { SampleBadge } from "./sample-badge";

/** Editorial "Off the map" feature: destinations flagged as hidden gems. */
export function HiddenGems() {
  return (
    <section id="off-the-map" aria-labelledby="off-the-map-title" className="py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading
          id="off-the-map-title"
          eyebrow="Off the map"
          title="Lesser-known places, told properly"
          intro="Long reads on places that rarely make the itinerary: why they matter, and what makes them different."
        />
        <div className="mt-14">
          <Suspense fallback={<SpotlightSkeleton />}>
            <SpotlightList />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

async function SpotlightList() {
  await connection();
  const result = await getHiddenGems();

  if (result.status === "error") {
    return (
      <StatePanel
        role="alert"
        icon={<CloudOff aria-hidden className="size-6" />}
        title="These stories couldn’t be loaded"
        body="Something went wrong on our side. Please try again in a moment."
      />
    );
  }
  if (result.status !== "ok" || result.destinations.length === 0) {
    return (
      <StatePanel
        icon={<Compass aria-hidden className="size-6" />}
        title="Stories in progress"
        body="Our first long reads on lesser-known places are being researched."
      />
    );
  }

  return (
    <ol className="space-y-16 sm:space-y-24">
      {result.destinations.map((destination, index) => (
        <SpotlightItem key={destination.slug} destination={destination} index={index} />
      ))}
    </ol>
  );
}

function SpotlightItem({ destination, index }: { destination: DestinationSpotlight; index: number }) {
  const cover = destination.coverImage;
  const category = destination.category ? getCategory(destination.category) : undefined;
  const reversed = index % 2 === 1;
  const place = [destination.district, destination.region.name].filter(Boolean).join(", ");
  // Lead with the first paragraph of the long description when there is one.
  const excerpt = destination.description?.split(/\n\s*\n/)[0] ?? destination.summary;

  return (
    <li className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
      <figure
        className={cn(
          "lg:col-span-7",
          reversed && "lg:order-2",
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-navy-800 lg:aspect-[5/4]">
          <RemoteImage
            src={cover?.url}
            alt={cover?.alt ?? ""}
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-cover"
          />
        </div>
        {destination.isSample || cover?.credit ? (
          <figcaption className="mt-2 space-y-2">
            {destination.isSample ? <SampleBadge /> : null}
            {cover?.credit ? (
              <PhotoCredit
                author={cover.credit}
                license={cover.license}
                sourceUrl={cover.sourceUrl}
              />
            ) : null}
          </figcaption>
        ) : null}
      </figure>

      <div className={cn("lg:col-span-5", reversed && "lg:order-1")}>
        <div className="flex flex-wrap items-center gap-3">
          <span aria-hidden className="font-serif text-sm text-gold tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="eyebrow text-muted-foreground">
            {[category?.shortLabel, place].filter(Boolean).join(" · ")}
          </p>
        </div>
        <h3 className="mt-4 font-serif text-3xl leading-[1.1] text-balance sm:text-4xl lg:text-5xl">
          {destination.name}
        </h3>
        <p className="mt-5 text-lg leading-relaxed text-pretty text-muted-foreground">{excerpt}</p>
        <Link
          href={destinationHref(destination.slug)}
          className="group mt-7 inline-flex items-center gap-2 rounded-sm font-semibold text-himalaya"
        >
          Read about {destination.name}
          <ChevronRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </li>
  );
}

function SpotlightSkeleton() {
  return (
    <div role="status" aria-live="polite" className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
      <span className="sr-only">Loading stories…</span>
      <div aria-hidden className="aspect-[4/3] animate-pulse rounded-md bg-ivory-deep lg:col-span-7 lg:aspect-[5/4]" />
      <div aria-hidden className="space-y-4 lg:col-span-5">
        <div className="h-3 w-32 animate-pulse rounded-sm bg-ivory-deep" />
        <div className="h-10 w-3/4 animate-pulse rounded-sm bg-ivory-deep" />
        <div className="h-24 animate-pulse rounded-sm bg-ivory-deep" />
      </div>
    </div>
  );
}
