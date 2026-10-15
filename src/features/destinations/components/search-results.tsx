import { CloudOff, X } from "lucide-react";
import Link from "next/link";

import { Pagination } from "@/components/navigation/pagination";
import { LinkButton } from "@/components/ui/link-button";
import { getCategory } from "@/features/experiences/categories";
import { getTheme } from "@/features/experiences/themes";
import { getProvince } from "@/features/regions/provinces";
import { getSeason } from "@/features/seasons/seasons";

import { getBudget, getDifficulty } from "../filters";
import type { DestinationSearch } from "../schemas";
import type { LoadResult, SearchPage } from "../types";
import { DestinationResults, StatePanel } from "./destination-results";

type FilterKey = Exclude<keyof DestinationSearch, "page" | "sort">;

/** Human labels for each active filter, in display order. */
export function activeFilters(search: DestinationSearch, omit: FilterKey[] = []) {
  const labels: [FilterKey, string | undefined][] = [
    ["q", search.q && `“${search.q}”`],
    ["theme", search.theme && getTheme(search.theme)?.label],
    ["category", search.category && getCategory(search.category)?.label],
    ["region", search.region && getProvince(search.region)?.name],
    ["district", search.district],
    ["season", search.season && getSeason(search.season)?.label],
    ["difficulty", search.difficulty && getDifficulty(search.difficulty)?.label],
    ["budget", search.budget && getBudget(search.budget)?.label],
  ];
  return labels.filter(
    (entry): entry is [FilterKey, string] => Boolean(entry[1]) && !omit.includes(entry[0]),
  );
}

export function SearchResults({
  result,
  search,
  hrefFor,
  clearHref,
  omitFilters,
}: {
  result: LoadResult<SearchPage>;
  search: DestinationSearch;
  /** URL for a variant of the current search (used for chips and pages). */
  hrefFor: (search: DestinationSearch) => string;
  clearHref: string;
  /** Filters fixed by the page itself (e.g. the province on province pages). */
  omitFilters?: FilterKey[];
}) {
  const filters = activeFilters(search, omitFilters);
  const practical = Boolean(search.season || search.difficulty || search.budget);

  if (result.status === "error") {
    return (
      <StatePanel
        role="alert"
        icon={<CloudOff aria-hidden className="size-6" />}
        title="Destinations couldn’t be loaded"
        body="Something went wrong on our side. Please try again in a moment."
      />
    );
  }

  const ok = result.status === "ok" ? result : null;
  const outOfRange = ok !== null && ok.total > 0 && ok.page > ok.pageCount;
  const from = ok && ok.total ? (ok.page - 1) * ok.pageSize + 1 : 0;
  const to = ok ? Math.min(ok.page * ok.pageSize, ok.total) : 0;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
        <p role="status" className="text-sm text-muted-foreground">
          {ok && ok.total > 0 && !outOfRange ? (
            <>
              Showing <strong className="text-foreground">{from}–{to}</strong> of{" "}
              <strong className="text-foreground">{ok.total}</strong> destination{ok.total === 1 ? "" : "s"}
            </>
          ) : ok ? (
            "No matching destinations"
          ) : null}
          {ok && search.sort === "name" ? " · sorted A–Z" : null}
        </p>
      </div>

      {filters.length ? (
        <ul aria-label="Active filters" className="mt-4 flex flex-wrap gap-2">
          {filters.map(([key, label]) => (
            <li key={key}>
              <Link
                href={hrefFor({ ...search, [key]: undefined, page: undefined })}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-navy px-3 text-sm font-medium text-ivory transition-colors hover:bg-navy-700"
              >
                {label}
                <X aria-hidden className="size-3.5" />
                <span className="sr-only">(remove filter)</span>
              </Link>
            </li>
          ))}
          <li>
            <Link href={clearHref} className="inline-flex h-8 items-center rounded-sm px-1 text-sm font-semibold text-himalaya hover:underline">
              Clear all filters
            </Link>
          </li>
        </ul>
      ) : null}

      {practical ? (
        <p role="note" className="mt-5 rounded-md bg-ivory-deep px-4 py-3 text-sm leading-relaxed">
          Season, difficulty and budget filters only include destinations whose practical details
          have been verified. Unverified and sample destinations are left out.
        </p>
      ) : null}

      <div className="mt-8">
        {outOfRange ? (
          <StatePanel
            icon={<X aria-hidden className="size-6" />}
            title={`There’s no page ${ok.page}`}
            body={`These results have ${ok.pageCount} page${ok.pageCount === 1 ? "" : "s"}.`}
            action={
              <LinkButton href={hrefFor({ ...search, page: undefined })} variant="outline" size="lg">
                Go to page 1
              </LinkButton>
            }
          />
        ) : (
          <DestinationResults
            result={result}
            headingLevel="h3"
            empty={{
              title: filters.length ? "No destinations match these filters" : "No destinations published yet",
              body: filters.length
                ? practical
                  ? "No verified destinations match yet. Try removing the season, difficulty or budget filter."
                  : "Try removing a filter or searching for something broader."
                : "We’re researching and verifying the first places now. Check back soon.",
              action: filters.length ? (
                <LinkButton href={clearHref} variant="outline" size="lg">
                  Clear filters
                </LinkButton>
              ) : undefined,
            }}
          />
        )}
      </div>

      {ok && !outOfRange ? (
        <div className="mt-12">
          <Pagination
            page={ok.page}
            pageCount={ok.pageCount}
            hrefFor={(page) => hrefFor({ ...search, page })}
            label="Results pages"
          />
        </div>
      ) : null}
    </div>
  );
}
