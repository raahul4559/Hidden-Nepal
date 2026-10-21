import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { SectionHeading } from "@/components/editorial/section-heading";
import { LinkButton } from "@/components/ui/link-button";

import { getFeaturedDestinations } from "../queries";
import { DestinationCardSkeleton } from "./destination-card";
import { DestinationResults } from "./destination-results";

export function FeaturedDestinations() {
  return (
    <section
      id="featured"
      aria-labelledby="featured-title"
      className="border-t border-border bg-white py-20 sm:py-28"
    >
      <div className="container-page">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="featured-title"
            eyebrow="Featured destinations"
            title="Places worth the detour"
            intro="Published places our editors think deserve more visitors, and more thoughtful ones."
          />
          <Link
            href="/explore"
            className="group inline-flex items-center gap-1.5 self-start rounded-sm font-semibold text-himalaya lg:self-auto"
          >
            Browse all destinations
            <ChevronRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="mt-12">
          <Suspense fallback={<FeaturedSkeleton />}>
            <FeaturedDestinationList />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

function FeaturedSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading featured destinations…</span>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2">
          <DestinationCardSkeleton variant="feature" />
        </div>
        <DestinationCardSkeleton />
      </div>
    </div>
  );
}

async function FeaturedDestinationList() {
  // Read at request time so newly published destinations appear immediately.
  await connection();
  const result = await getFeaturedDestinations();

  return (
    <DestinationResults
      result={result}
      layout="featured"
      empty={{
        title: "The first destinations are on their way",
        body: "We’d rather publish a few places done properly than many done loosely. Until then, browse by experience or province.",
        action: (
          <LinkButton href="/#experiences" variant="outline" size="lg">
            Browse experiences
          </LinkButton>
        ),
      }}
    />
  );
}
