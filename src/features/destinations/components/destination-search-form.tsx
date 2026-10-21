import { ChevronDown, Search } from "lucide-react";
import Form from "next/form";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { getCategory } from "@/features/experiences/categories";
import { THEMES } from "@/features/experiences/themes";

import { DestinationSuggestionsInput } from "./destination-suggestions-input";
import type { DestinationSearch } from "../schemas";

type DestinationSearchFormProps = {
  defaultValues?: DestinationSearch;
  className?: string;
};

const fieldClass =
  "h-12 w-full rounded-md border border-input bg-white px-3.5 text-base text-navy placeholder:text-ink-muted";

/**
 * GET form to /explore. Works without JavaScript; next/form adds
 * client-side navigation when it is available.
 */
export function DestinationSearchForm({
  defaultValues,
  className,
}: DestinationSearchFormProps) {
  return (
    <Form
      action="/explore"
      role="search"
      aria-label="Search destinations"
      className={cn(
        "grid gap-3 rounded-lg bg-ivory p-3 text-navy shadow-2xl shadow-navy/30 [--ring:var(--blue)] sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] sm:items-end sm:p-4",
        className,
      )}
    >
      {/* Keep active province/season filters when searching from /explore. */}
      {defaultValues?.region ? (
        <input type="hidden" name="region" value={defaultValues.region} />
      ) : null}
      {defaultValues?.season ? (
        <input type="hidden" name="season" value={defaultValues.season} />
      ) : null}

      <div className="grid gap-1.5">
        <label htmlFor="search-q" className="text-xs font-semibold text-ink-muted">
          Where to?
        </label>
        <DestinationSuggestionsInput
          id="search-q"
          name="q"
          defaultValue={defaultValues?.q}
          placeholder="A lake, village, trail or district"
          className={fieldClass}
        />
      </div>

      <div className="grid gap-1.5">
        <label
          htmlFor="search-category"
          className="text-xs font-semibold text-ink-muted"
        >
          Experience
        </label>
        <div className="relative">
          <select
            id="search-category"
            name="category"
            defaultValue={defaultValues?.category ?? ""}
            className={cn(fieldClass, "appearance-none pr-10")}
          >
            <option value="">Any experience</option>
            {THEMES.map((theme) => (
              <optgroup key={theme.slug} label={theme.label}>
                {theme.categories.map((slug) => (
                  <option key={slug} value={slug}>
                    {getCategory(slug)?.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
          />
        </div>
      </div>

      <Button type="submit" size="xl" className="w-full sm:w-auto">
        <Search aria-hidden data-icon="inline-start" />
        Search
      </Button>
    </Form>
  );
}
