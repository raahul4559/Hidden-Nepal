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
import { describeSearch } from "@/features/destinations/describe-search";
import {
  type DestinationSearch,
  exploreHref,
  parseDestinationSearch,
} from "@/features/destinations/schemas";
import { THEMES } from "@/features/experiences/themes";
import { PROVINCES } from "@/features/regions/provinces";
import { SEASONS } from "@/features/seasons/seasons";

export const metadata: Metadata = {
  title: "Explore destinations",
  description:
    "Search Nepal's hidden waterfalls, remote villages, Himalayan lakes, trekking routes, heritage and food by experience, province or season.",
};

export default function ExplorePage({ searchParams }: PageProps<"/explore">) {
  const search = searchParams.then(parseDestinationSearch);

  return (
    <>
      <PageHeader
        eyebrow="Explore"
        title="Find your way beyond the ordinary"
        intro="Search by place, or narrow by experience, province and season."
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
  const hasFilters = Boolean(search.q || search.theme || search.category || search.region || search.season);
  const hasSamples = result.status === "ok" && result.destinations.some((d) => d.isSample);

  return (
    <>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="results-title" className="font-serif text-3xl sm:text-4xl">
            {describeSearch(search) || "All destinations"}
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

      <div className="mt-8 space-y-4">
        <FilterGroup
          label="Experience"
          options={[
            {
              label: "All",
              href: exploreHref({ ...search, theme: undefined, category: undefined }),
              active: !search.theme && !search.category,
            },
            ...THEMES.map((t) => ({
              label: t.label,
              href: exploreHref({ ...search, theme: t.slug, category: undefined }),
              active: search.theme === t.slug,
            })),
          ]}
        />
        <FilterGroup
          label="Province"
          options={[
            { label: "All", href: exploreHref({ ...search, region: undefined }), active: !search.region },
            ...PROVINCES.map((p) => ({
              label: p.name,
              href: exploreHref({ ...search, region: p.slug }),
              active: search.region === p.slug,
            })),
          ]}
        />
        <FilterGroup
          label="Season"
          options={[
            { label: "Any", href: exploreHref({ ...search, season: undefined }), active: !search.season },
            ...SEASONS.map((season) => ({
              label: season.label,
              href: exploreHref({ ...search, season: season.slug }),
              active: search.season === season.slug,
            })),
          ]}
        />
      </div>

      {search.season && hasSamples ? (
        <p role="note" className="mt-6 rounded-md bg-gold/10 px-4 py-3 text-sm">
          Seasons for destinations marked <strong className="font-semibold">Sample content</strong>{" "}
          are development placeholders, not travel advice.
        </p>
      ) : null}

      <div className="mt-10">
        <DestinationResults
          result={result}
          headingLevel="h3"
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

type FilterOption = { label: string; href: string; active: boolean };

function FilterGroup({ label, options }: { label: string; options: FilterOption[] }) {
  return (
    <nav
      aria-label={`Filter by ${label.toLowerCase()}`}
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
    >
      <span className="w-24 shrink-0 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {/* Scrolls sideways on phones rather than wrapping into a tall block. */}
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {options.map((option) => (
          <li key={option.label} className="shrink-0">
            <Link
              href={option.href}
              aria-current={option.active ? "true" : undefined}
              scroll={false}
              className={cn(
                "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors",
                option.active
                  ? "border-navy bg-navy text-ivory"
                  : "border-input/50 bg-white text-navy hover:border-navy",
              )}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
