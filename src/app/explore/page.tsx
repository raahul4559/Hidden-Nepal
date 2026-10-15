import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { DestinationResultsSkeleton } from "@/features/destinations/components/destination-results";
import { ExploreFilters } from "@/features/destinations/components/explore-filters";
import { FiltersJumpLink } from "@/features/destinations/components/filters-jump-link";
import { SearchResults } from "@/features/destinations/components/search-results";
import { describeSearch } from "@/features/destinations/describe-search";
import { getDistricts, searchDestinations } from "@/features/destinations/queries";
import {
  activeFilterCount,
  type DestinationSearch,
  exploreHref,
  parseDestinationSearch,
} from "@/features/destinations/schemas";

const BASE_DESCRIPTION =
  "Search Nepal's hidden waterfalls, remote villages, Himalayan lakes, trekking routes, heritage and food by experience, province, district or season.";

export async function generateMetadata({ searchParams }: PageProps<"/explore">): Promise<Metadata> {
  const search = parseDestinationSearch(await searchParams);
  const described = describeSearch(search);
  const page = search.page && search.page > 1 ? ` (page ${search.page})` : "";
  const title = `${described || "Explore destinations"}${page}`;

  return {
    title,
    description: described ? `${described} in Nepal. ${BASE_DESCRIPTION}` : BASE_DESCRIPTION,
    // Canonical uses only validated params, so junk query strings collapse.
    alternates: { canonical: exploreHref(search) },
    // Free-text results are thin and unbounded; keep them out of the index.
    robots: search.q ? { index: false, follow: true } : undefined,
    openGraph: { title, url: exploreHref(search) },
  };
}

export default function ExplorePage({ searchParams }: PageProps<"/explore">) {
  const search = searchParams.then(parseDestinationSearch);

  return (
    <>
      <PageHeader
        eyebrow="Explore"
        title="Find your way beyond the ordinary"
        intro="Search by place, or narrow by experience, province, district and season."
      />
      <section aria-labelledby="results-title" className="py-12 sm:py-16">
        <div className="container-page">
          <Suspense fallback={<ExploreFallback />}>
            <ExploreContent search={search} />
          </Suspense>
        </div>
      </section>
    </>
  );
}

function ExploreFallback() {
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div aria-hidden className="h-96 animate-pulse rounded-md bg-ivory-deep lg:col-span-3" />
      <div className="lg:col-span-9">
        <h2 id="results-title" className="font-serif text-3xl">Destinations</h2>
        <div className="mt-8">
          <DestinationResultsSkeleton count={6} />
        </div>
      </div>
    </div>
  );
}

async function ExploreContent({ search: searchPromise }: { search: Promise<DestinationSearch> }) {
  const search = await searchPromise;
  // Database reads (and Prisma's transaction IDs) belong to request time.
  await connection();
  const [result, districts] = await Promise.all([
    searchDestinations(search),
    getDistricts(search.region),
  ]);

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-8 xl:col-span-9">
        <h2 id="results-title" className="font-serif text-3xl sm:text-4xl">
          {describeSearch(search) || "All destinations"}
        </h2>
        <div className="mt-4">
          <FiltersJumpLink count={activeFilterCount(search)} />
        </div>
        <div className="mt-4">
          <SearchResults result={result} search={search} hrefFor={exploreHref} clearHref="/explore" />
        </div>
      </div>
      <aside id="filters" aria-label="Filters" className="scroll-mt-6 lg:order-first lg:col-span-4 xl:col-span-3">
        <div className="lg:sticky lg:top-6">
          <ExploreFilters search={search} districts={districts.status === "ok" ? districts.districts : null} />
        </div>
      </aside>
    </div>
  );
}
