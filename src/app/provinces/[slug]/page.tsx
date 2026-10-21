import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { DestinationResultsSkeleton } from "@/features/destinations/components/destination-results";
import { ExploreFilters } from "@/features/destinations/components/explore-filters";
import { FiltersJumpLink } from "@/features/destinations/components/filters-jump-link";
import { SearchResults } from "@/features/destinations/components/search-results";
import { getDistricts, searchDestinations } from "@/features/destinations/queries";
import {
  activeFilterCount,
  type DestinationSearch,
  exploreHref,
  parseDestinationSearch,
  provinceHref,
  searchQueryString,
} from "@/features/destinations/schemas";
import { getProvince, type Province, PROVINCES } from "@/features/regions/provinces";

/** All seven provinces are known ahead of time, so each page prerenders. */
export function generateStaticParams() {
  return PROVINCES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/provinces/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const province = getProvince(slug);
  if (!province) return { title: "Province not found", robots: { index: false } };

  const search = parseDestinationSearch(await searchParams);
  const title = `${province.name} Province`;
  const description = `Lesser-known destinations in ${province.name} Province, Nepal, known for ${listFormat(province.knownFor)}.`;
  return {
    title,
    description,
    alternates: { canonical: provinceHref(province.slug) },
    robots:
      activeFilterCount(search) > 0 || search.sort || (search.page && search.page > 1)
        ? { index: false, follow: true }
        : undefined,
    openGraph: {
      title,
      description,
      url: provinceHref(province.slug),
      images: ["/images/destinations/kathmandu-valley.jpg"],
    },
  };
}

function listFormat(items: readonly string[]) {
  return new Intl.ListFormat("en-GB", { style: "long", type: "conjunction" }).format(items);
}

export default async function ProvincePage({ params, searchParams }: PageProps<"/provinces/[slug]">) {
  // Unknown slugs render the not-found page. As with other streamed routes,
  // Next.js keeps a 200 status but marks the response noindex.
  const { slug } = await params;
  const province = getProvince(slug);
  if (!province) notFound();

  const index = PROVINCES.findIndex((p) => p.slug === province.slug);
  const previous = PROVINCES[index - 1];
  const next = PROVINCES[index + 1];

  return (
    <>
      <PageHeader
        eyebrow={`Province ${index + 1} of ${PROVINCES.length}`}
        title={province.name}
        intro={`Known for ${listFormat(province.knownFor)}.`}
      >
        <nav aria-label="Breadcrumb" className="mt-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ivory/75">
            <li><Link href="/" className="rounded-sm hover:text-ivory hover:underline">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/provinces" className="rounded-sm hover:text-ivory hover:underline">Provinces</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ivory">{province.name}</li>
          </ol>
        </nav>
      </PageHeader>

      <section aria-labelledby="province-results-title" className="py-12 sm:py-16">
        <div className="container-page">
          <Suspense fallback={<DestinationResultsSkeleton count={6} />}>
            <ProvinceDestinations province={province} searchParams={searchParams} />
          </Suspense>
        </div>
      </section>

      <nav aria-label="Other provinces" className="border-t border-border bg-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-8">
          {previous ? (
            <Link href={provinceHref(previous.slug)} className="group inline-flex items-center gap-2 rounded-sm font-semibold text-himalaya">
              <ChevronLeft aria-hidden className="size-4 transition-transform group-hover:-translate-x-0.5" />
              {previous.name}
            </Link>
          ) : <span />}
          <Link href="/provinces" className="rounded-sm text-sm font-semibold text-muted-foreground hover:underline">
            All provinces
          </Link>
          {next ? (
            <Link href={provinceHref(next.slug)} className="group inline-flex items-center gap-2 rounded-sm font-semibold text-himalaya">
              {next.name}
              <ChevronRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : <span />}
        </div>
      </nav>
    </>
  );
}

async function ProvinceDestinations({
  province,
  searchParams,
}: {
  province: Province;
  searchParams: PageProps<"/provinces/[slug]">["searchParams"];
}) {
  // The province comes from the path; ignore any region in the query string.
  const search: DestinationSearch = { ...parseDestinationSearch(await searchParams), region: province.slug };
  // Database reads (and Prisma's transaction IDs) belong to request time.
  await connection();
  const [result, districts] = await Promise.all([
    searchDestinations(search),
    getDistricts(province.slug),
  ]);
  const base = provinceHref(province.slug);
  const hrefFor = (s: DestinationSearch) => {
    const qs = searchQueryString({ ...s, region: undefined });
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-8 xl:col-span-9">
        <h2 id="province-results-title" className="font-serif text-3xl sm:text-4xl">
          Destinations in {province.name}
        </h2>
        <div className="mt-4">
          <FiltersJumpLink count={activeFilterCount({ ...search, region: undefined })} />
        </div>
        <div className="mt-4">
          <SearchResults
            result={result}
            search={search}
            hrefFor={hrefFor}
            clearHref={base}
            omitFilters={["region"]}
          />
        </div>
      </div>
      <aside id="filters" aria-label="Filters" className="scroll-mt-6 lg:order-first lg:col-span-4 xl:col-span-3">
        <div className="lg:sticky lg:top-6">
          <ExploreFilters
            search={search}
            districts={districts.status === "ok" ? districts.districts : null}
            action={base}
            lockRegion
          />
          <p className="mt-4 text-sm">
            <Link href={exploreHref({ region: province.slug })} className="rounded-sm font-semibold text-himalaya hover:underline">
              Search all of Nepal instead
            </Link>
          </p>
        </div>
      </aside>
    </div>
  );
}
