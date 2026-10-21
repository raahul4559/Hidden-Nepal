import { ChevronDown, SlidersHorizontal } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { CATEGORIES, getCategory } from "@/features/experiences/categories";
import { THEMES } from "@/features/experiences/themes";
import { PROVINCES } from "@/features/regions/provinces";
import { SEASONS } from "@/features/seasons/seasons";

import { BUDGETS, DIFFICULTIES, SORTS } from "../filters";
import type { DestinationSearch } from "../schemas";
import { DestinationSuggestionsInput } from "./destination-suggestions-input";

const control =
  "h-11 w-full rounded-md border border-input bg-white px-3 text-sm text-navy placeholder:text-ink-muted";

/**
 * All explore filters as one GET form: every state is a shareable URL and
 * works without JavaScript. Submitting resets to page 1.
 */
export function ExploreFilters({
  search,
  districts,
  action = "/explore",
  lockRegion = false,
}: {
  search: DestinationSearch;
  /** Districts with published destinations; null when unavailable. */
  districts: string[] | null;
  action?: string;
  /** Province pages fix the province, so its field is hidden. */
  lockRegion?: boolean;
}) {
  // Keep a selected district visible even if it has no published rows.
  const districtOptions = [...new Set([...(districts ?? []), ...(search.district ? [search.district] : [])])].sort();

  return (
    <Form action={action} aria-label="Filter destinations" className="rounded-md border border-border bg-white p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <SlidersHorizontal aria-hidden className="size-4 text-himalaya" />
        Filters
      </h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <Field label="Keyword" htmlFor="f-q" className="sm:col-span-2 lg:col-span-1">
          <DestinationSuggestionsInput
            id="f-q"
            name="q"
            defaultValue={search.q}
            placeholder="Name, district or description"
            className={control}
          />
        </Field>

        <SelectField label="Experience" name="theme" value={search.theme} anyLabel="Any experience">
          {THEMES.map((t) => (
            <option key={t.slug} value={t.slug}>{t.label}</option>
          ))}
        </SelectField>

        <SelectField label="Category" name="category" value={search.category} anyLabel="Any category">
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>{getCategory(c.slug)?.label}</option>
          ))}
        </SelectField>

        {lockRegion ? null : (
          <SelectField label="Province" name="region" value={search.region} anyLabel="Any province">
            {PROVINCES.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </SelectField>
        )}

        <SelectField
          label="District"
          name="district"
          value={search.district}
          anyLabel={districtOptions.length ? "Any district" : "No districts yet"}
          disabled={!districtOptions.length}
        >
          {districtOptions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </SelectField>

        <fieldset className="grid gap-4 border-t border-border pt-4 sm:col-span-2 sm:grid-cols-2 lg:col-span-1 lg:grid-cols-1">
          <legend className="sr-only">Practical filters</legend>
          <p id="practical-hint" className="text-xs leading-relaxed text-muted-foreground sm:col-span-2 lg:col-span-1">
            Season, difficulty and budget only match destinations whose practical details are verified.
          </p>
          <SelectField label="Season" name="season" value={search.season} anyLabel="Any season" describedBy="practical-hint">
            {SEASONS.map((s) => (
              <option key={s.slug} value={s.slug}>{s.label}</option>
            ))}
          </SelectField>
          <SelectField label="Difficulty" name="difficulty" value={search.difficulty} anyLabel="Any difficulty" describedBy="practical-hint">
            {DIFFICULTIES.map((d) => (
              <option key={d.slug} value={d.slug}>{d.label}</option>
            ))}
          </SelectField>
          <SelectField label="Budget per person" name="budget" value={search.budget} anyLabel="Any budget" describedBy="practical-hint">
            {BUDGETS.map((b) => (
              <option key={b.slug} value={b.slug}>{b.label}</option>
            ))}
          </SelectField>
        </fieldset>

        <SelectField label="Sort by" name="sort" value={search.sort ?? "featured"} className="border-t border-border pt-4 sm:col-span-2 lg:col-span-1">
          {SORTS.map((s) => (
            <option key={s.slug} value={s.slug}>{s.label}</option>
          ))}
        </SelectField>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" className="flex-1 sm:flex-none lg:flex-1">
          Apply filters
        </Button>
        <Link href={action} className="rounded-sm text-sm font-semibold text-himalaya hover:underline">
          Clear all
        </Link>
      </div>
    </Form>
  );
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-xs font-semibold text-ink-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  anyLabel,
  disabled,
  describedBy,
  className,
  children,
}: {
  label: string;
  name: string;
  value: string | undefined;
  anyLabel?: string;
  disabled?: boolean;
  describedBy?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const id = `f-${name}`;
  return (
    <Field label={label} htmlFor={id} className={className}>
      <div className="relative">
        <select
          id={id}
          name={name}
          defaultValue={value ?? ""}
          disabled={disabled}
          aria-describedby={describedBy}
          className={cn(control, "appearance-none pr-9 disabled:opacity-60")}
        >
          {anyLabel ? <option value="">{anyLabel}</option> : null}
          {children}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted" />
      </div>
    </Field>
  );
}
