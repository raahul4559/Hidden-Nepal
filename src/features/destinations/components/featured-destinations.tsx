import { connection } from "next/server";
import { Suspense } from "react";

import { SectionHeading } from "@/components/editorial/section-heading";
import { LinkButton } from "@/components/ui/link-button";

import { getFeaturedDestinations } from "../queries";
import { DestinationResults, DestinationResultsSkeleton } from "./destination-results";

export function FeaturedDestinations() {
  return (
    <section
      id="featured"
      aria-labelledby="featured-title"
      className="border-t border-border bg-white py-20 sm:py-28"
    >
      <div className="container-page">
        <SectionHeading
          id="featured-title"
          eyebrow="Featured destinations"
          title="Places worth the detour"
          intro="Every destination we publish is researched and checked with local sources before it appears here."
        />
        <div className="mt-12">
          <Suspense fallback={<DestinationResultsSkeleton />}>
            <FeaturedDestinationList />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

async function FeaturedDestinationList() {
  // Read at request time so newly published destinations appear immediately.
  await connection();
  const result = await getFeaturedDestinations();

  return (
    <DestinationResults
      result={result}
      empty={{
        title: "The first destinations are on their way",
        body: "We’d rather publish a few places done properly than many done loosely. Until then, browse by experience or region.",
        action: (
          <LinkButton href="/#experiences" variant="outline" size="lg">
            Browse experiences
          </LinkButton>
        ),
      }}
    />
  );
}
