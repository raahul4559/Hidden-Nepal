import type { Metadata } from "next";
import { X } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { cn } from "cn";

import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";
import {
  DestinationResults,
  DestinationResultsSkeleton,
} from "@/features/destinations/components/destination-results";
import { DestinationSearchForm } from "@/features/destinations/components/destination-search-form";
import { searchDestinations } from "@/features/destinations/queries";
import {
  type DestinationSearch,
  exploreHref,
  parseDestinationSearch,
} from "@/features/destinations/schemas";
import { getCategory } from "@/features/experiences/categories";
import { getProvince, PROVINCES } from "@/features/regions/provinces";

export const metadata: Metadata = {
  title: "Explore destinations",
  description:
    "Search Nepal's hidden waterfalls, remote villages, Himalayan lakes, trekking routes, heritage and food by experience or province.",
};

export default function ExplorePage({ searchParams }: PageProps<"/explore">) {
  const search = searchParams.then(parseDestinationSearch);

  return (
    <>
      <PageHeader
        eyebrow="Explore"
        title="Find your way beyond the ordinary"
        intro="Search by place or narrow by experience and province."
      >
        <Suspense fallback={<DestinationSearchForm className="mt-10 max-w-4xl" />}>
          <SearchFormWithParams search={search} />
        </Suspense>
      </PageHeader>

      <section aria-labelledby="results-title" className="py-14 sm:py-20">
        <div className="container-page">
          <Suspense fallback={<ResultsFallback />}>
            <Results search={search} />
          </Suspense>
        </div>
      </section>
    </>
  );
}

async function SearchFormWithParams({ search }: { search: Promise<DestinationSearch> }) {
  return <DestinationSearchForm defaultValues={await search} className="mt-10 max-w-4xl" />;
}

function ResultsFallback() {
  return (
    <>
      <h2 id="results-title" className="font-serif text-3xl">
        Destinations
      </h2>
      <div className="mt-8">
        <DestinationResultsSkeleton count={6} />
      </div>
    </>
  );
}

async function Results({ search: searchPromise }: { search: Promise<DestinationSearch> }) {
  const search = await searchPromise;
  const result = await searchDestinations(search);
  const category = search.category ? getCategory(search.category) : undefined;
  const province = search.region ? getProvince(search.region) : undefined;
  const hasFilters = Boolean(search.q || category || province);

  const heading = [category?.label, province && `in ${province.name}`]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="results-title" className="font-serif text-3xl sm:text-4xl">
            {heading || "All destinations"}
          </h2>
          {search.q ? (
            <p className="mt-2 text-muted-foreground">
              Matching “<span className="text-foreground">{search.q}</span>”
            </p>
          ) : null}
        </div>
        {hasFilters ? (
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 self-start rounded-sm text-sm font-semibold text-himalaya hover:underline lg:self-auto"
          >
            <X aria-hidden className="size-4" />
            Clear all filters
          </Link>
        ) : null}
      </div>

      <nav aria-label="Filter by province" className="mt-8">
        <ul className="flex flex-wrap gap-2">
          <li>
            <FilterChip href={exploreHref({ ...search, region: undefined })} active={!province}>
              All provinces
            </FilterChip>
          </li>
          {PROVINCES.map((p) => (
            <li key={p.slug}>
              <FilterChip href={exploreHref({ ...search, region: p.slug })} active={p.slug === search.region}>
                {p.name}
              </FilterChip>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10">
        <DestinationResults
          result={result}
          empty={{
            title: hasFilters ? "No destinations match yet" : "No destinations published yet",
            body: hasFilters
              ? "We’re adding places as they are researched and verified. Try a broader search, or check back soon."
              : "We’re researching and verifying the first places now. Check back soon.",
            action: hasFilters ? (
              <LinkButton href="/explore" variant="outline" size="lg">
                Clear filters
              </LinkButton>
            ) : undefined,
          }}
        />
      </div>
    </>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      scroll={false}
      className={cn(
        "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors",
        active
          ? "border-navy bg-navy text-ivory"
          : "border-input/50 bg-white text-navy hover:border-navy",
      )}
    >
      {children}
    </Link>
  );
}
