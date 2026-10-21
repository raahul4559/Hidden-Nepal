"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Currency, Difficulty, InfoStatus, PublishStatus, Season } from "@/generated/prisma/enums";

import {
  createDestinationAction,
  updateDestinationAction,
  type DestinationFormState,
} from "../actions/destinations";

type Option = { slug: string; name: string };

export type DestinationFormValues = {
  id?: string;
  slug: string;
  name: string;
  summary: string;
  description: string | null;
  status: PublishStatus;
  isFeatured: boolean;
  isHiddenGem: boolean;
  isSample: boolean;
  regionSlug: string;
  district: string | null;
  categorySlugs: string[];
  activitySlugs: string[];
  latitude: number | null;
  longitude: number | null;
  elevationM: number | null;
  costMin: number | null;
  costMax: number | null;
  currency: Currency;
  costNotes: string | null;
  difficulty: Difficulty | null;
  suggestedDays: number | null;
  seasons: Season[];
  bestSeasonNotes: string | null;
  accessInfo: string | null;
  safetyInfo: string | null;
  practicalInfoStatus: InfoStatus;
  practicalInfoVerifiedAt: Date | null;
  imageCount?: number;
};

export const EMPTY_DESTINATION: DestinationFormValues = {
  slug: "",
  name: "",
  summary: "",
  description: null,
  status: PublishStatus.DRAFT,
  isFeatured: false,
  isHiddenGem: false,
  isSample: false,
  regionSlug: "",
  district: null,
  categorySlugs: [],
  activitySlugs: [],
  latitude: null,
  longitude: null,
  elevationM: null,
  costMin: null,
  costMax: null,
  currency: Currency.NPR,
  costNotes: null,
  difficulty: null,
  suggestedDays: null,
  seasons: [],
  bestSeasonNotes: null,
  accessInfo: null,
  safetyInfo: null,
  practicalInfoStatus: InfoStatus.UNVERIFIED,
  practicalInfoVerifiedAt: null,
};

const STATUS_LABELS: Record<PublishStatus, string> = {
  DRAFT: "Draft — only admins can preview",
  PUBLISHED: "Published — visible to everyone",
  ARCHIVED: "Archived — hidden, restorable",
};

const INFO_LABELS: Record<InfoStatus, string> = {
  UNVERIFIED: "Unverified — needs research",
  VERIFIED: "Verified — editor checked the facts",
  PLACEHOLDER: "Placeholder — sample content only",
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: "Easy",
  MODERATE: "Moderate",
  CHALLENGING: "Challenging",
  STRENUOUS: "Strenuous",
};

const SEASON_LABELS: Record<Season, string> = {
  SPRING: "Spring",
  MONSOON: "Monsoon",
  AUTUMN: "Autumn",
  WINTER: "Winter",
};

const inputClass =
  "h-9 w-full rounded-md border border-input bg-white px-2.5 text-sm text-navy outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 aria-invalid:border-destructive";
const textareaClass =
  "w-full rounded-md border border-input bg-white px-2.5 py-2 text-sm text-navy outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 aria-invalid:border-destructive";

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-navy">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-white p-5">
      <h3 className="font-serif text-xl text-navy">{title}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function CheckboxGroup({
  name,
  options,
  selected,
  error,
}: {
  name: string;
  options: Option[];
  selected: string[];
  error?: string;
}) {
  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-2 text-sm font-medium text-navy">Categories</legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <label
            key={option.slug}
            className="flex items-start gap-2 rounded-md border border-border bg-ivory/40 px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              name={name}
              value={option.slug}
              defaultChecked={selected.includes(option.slug)}
              className="mt-0.5 size-4 accent-navy"
            />
            <span>
              <span className="block font-medium text-navy">{option.name}</span>
              <span className="block font-mono text-xs text-ink-muted">{option.slug}</span>
            </span>
          </label>
        ))}
      </div>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </fieldset>
  );
}

export function DestinationForm({
  mode,
  values,
  regions,
  categories,
  activities,
}: {
  mode: "create" | "edit";
  values: DestinationFormValues;
  regions: Option[];
  categories: Option[];
  activities: Option[];
}) {
  const initialState: DestinationFormState = { status: "idle" };
  const action = mode === "create" ? createDestinationAction : updateDestinationAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.status === "error" ? state.fieldErrors : {};

  return (
    <form action={formAction} className="space-y-5">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      {state.status === "error" ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </div>
      ) : null}

      {values.isSample ? (
        <div className="rounded-md border border-gold/50 bg-gold/10 px-4 py-3 text-sm text-navy">
          This is sample content. Practical information is locked to placeholder while the record
          remains a sample.
        </div>
      ) : null}

      <Section title="Story">
        <Field label="Name" htmlFor="name" error={errors.name} className="sm:col-span-2">
          <input id="name" name="name" defaultValue={values.name} required className={inputClass} />
        </Field>
        <Field
          label="Slug"
          htmlFor="slug"
          error={errors.slug}
          hint="Lowercase letters, numbers and single hyphens. Must be unique."
        >
          <input id="slug" name="slug" defaultValue={values.slug} required className={inputClass} />
        </Field>
        <Field label="Status" htmlFor="status" error={errors.status}>
          <select id="status" name="status" defaultValue={values.status} className={inputClass}>
            {Object.values(PublishStatus).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Summary"
          htmlFor="summary"
          error={errors.summary}
          hint="One sentence shown on cards and in search results."
          className="sm:col-span-2"
        >
          <textarea
            id="summary"
            name="summary"
            defaultValue={values.summary}
            required
            rows={2}
            maxLength={280}
            className={textareaClass}
          />
        </Field>
        <Field label="Description" htmlFor="description" error={errors.description} className="sm:col-span-2">
          <textarea
            id="description"
            name="description"
            defaultValue={values.description ?? ""}
            rows={8}
            className={textareaClass}
          />
        </Field>
        <div className="flex flex-wrap gap-5 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-navy">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={values.isFeatured}
              className="size-4 accent-navy"
            />
            Feature on the homepage
          </label>
          <label className="flex items-center gap-2 text-sm text-navy">
            <input
              type="checkbox"
              name="isHiddenGem"
              defaultChecked={values.isHiddenGem}
              className="size-4 accent-navy"
            />
            Mark as a hidden gem
          </label>
        </div>
      </Section>

      <Section title="Location">
        <Field label="Province" htmlFor="regionSlug" error={errors.regionSlug}>
          <select id="regionSlug" name="regionSlug" defaultValue={values.regionSlug} required className={inputClass}>
            <option value="">Choose a province</option>
            {regions.map((region) => (
              <option key={region.slug} value={region.slug}>
                {region.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="District" htmlFor="district" error={errors.district}>
          <input id="district" name="district" defaultValue={values.district ?? ""} className={inputClass} />
        </Field>
        <CheckboxGroup
          name="categorySlugs"
          options={categories}
          selected={values.categorySlugs}
          error={errors.categorySlugs}
        />
        <Field
          label="Latitude"
          htmlFor="latitude"
          error={errors.latitude}
          hint="Both coordinates are required for a map marker."
        >
          <input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            min={-90}
            max={90}
            defaultValue={values.latitude ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Longitude" htmlFor="longitude" error={errors.longitude}>
          <input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            min={-180}
            max={180}
            defaultValue={values.longitude ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Elevation (metres)" htmlFor="elevationM" error={errors.elevationM}>
          <input
            id="elevationM"
            name="elevationM"
            type="number"
            min={0}
            max={8849}
            defaultValue={values.elevationM ?? ""}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Travel information">
        <Field label="Difficulty" htmlFor="difficulty" error={errors.difficulty}>
          <select id="difficulty" name="difficulty" defaultValue={values.difficulty ?? ""} className={inputClass}>
            <option value="">Not set</option>
            {Object.values(Difficulty).map((value) => (
              <option key={value} value={value}>
                {DIFFICULTY_LABELS[value]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Suggested days" htmlFor="suggestedDays" error={errors.suggestedDays}>
          <input
            id="suggestedDays"
            name="suggestedDays"
            type="number"
            min={1}
            max={60}
            defaultValue={values.suggestedDays ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Cost from" htmlFor="costMin" error={errors.costMin}>
          <input
            id="costMin"
            name="costMin"
            type="number"
            min={0}
            defaultValue={values.costMin ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Cost to" htmlFor="costMax" error={errors.costMax}>
          <input
            id="costMax"
            name="costMax"
            type="number"
            min={0}
            defaultValue={values.costMax ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Currency" htmlFor="currency" error={errors.currency}>
          <select id="currency" name="currency" defaultValue={values.currency} className={inputClass}>
            {Object.values(Currency).map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cost notes" htmlFor="costNotes" error={errors.costNotes}>
          <input
            id="costNotes"
            name="costNotes"
            defaultValue={values.costNotes ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Access" htmlFor="accessInfo" error={errors.accessInfo} className="sm:col-span-2">
          <textarea
            id="accessInfo"
            name="accessInfo"
            defaultValue={values.accessInfo ?? ""}
            rows={4}
            className={textareaClass}
          />
        </Field>
        <Field label="Safety" htmlFor="safetyInfo" error={errors.safetyInfo} className="sm:col-span-2">
          <textarea
            id="safetyInfo"
            name="safetyInfo"
            defaultValue={values.safetyInfo ?? ""}
            rows={4}
            className={textareaClass}
          />
        </Field>
      </Section>

      <Section title="Seasons & activities">
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-medium text-navy">Best seasons</legend>
          <div className="flex flex-wrap gap-4">
            {Object.values(Season).map((season) => (
              <label key={season} className="flex items-center gap-2 text-sm text-navy">
                <input
                  type="checkbox"
                  name="seasons"
                  value={season}
                  defaultChecked={values.seasons.includes(season)}
                  className="size-4 accent-navy"
                />
                {SEASON_LABELS[season]}
              </label>
            ))}
          </div>
          {errors.seasons ? <p className="mt-1 text-xs text-destructive">{errors.seasons}</p> : null}
        </fieldset>
        <Field
          label="Season notes"
          htmlFor="bestSeasonNotes"
          error={errors.bestSeasonNotes}
          className="sm:col-span-2"
        >
          <textarea
            id="bestSeasonNotes"
            name="bestSeasonNotes"
            defaultValue={values.bestSeasonNotes ?? ""}
            rows={3}
            className={textareaClass}
          />
        </Field>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-medium text-navy">Activities</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => (
              <label key={activity.slug} className="flex items-center gap-2 text-sm text-navy">
                <input
                  type="checkbox"
                  name="activitySlugs"
                  value={activity.slug}
                  defaultChecked={values.activitySlugs?.includes(activity.slug) ?? false}
                  className="size-4 accent-navy"
                />
                {activity.name}
              </label>
            ))}
          </div>
          {errors.activitySlugs ? <p className="mt-1 text-xs text-destructive">{errors.activitySlugs}</p> : null}
        </fieldset>
      </Section>

      <Section title="Practical information">
        <Field
          label="Verification status"
          htmlFor="practicalInfoStatus"
          error={errors.practicalInfoStatus}
          className="sm:col-span-2"
        >
          <select
            id="practicalInfoStatus"
            name="practicalInfoStatus"
            defaultValue={values.practicalInfoStatus}
            className={inputClass}
          >
            {Object.values(InfoStatus)
              .filter((status) => status !== InfoStatus.PLACEHOLDER || values.isSample)
              .map((status) => (
                <option key={status} value={status}>
                  {INFO_LABELS[status]}
                </option>
              ))}
          </select>
        </Field>
        <Field
          label="Verified on"
          htmlFor="practicalInfoVerifiedAt"
          error={errors.practicalInfoVerifiedAt}
          hint="Required when the status is Verified."
        >
          <input
            id="practicalInfoVerifiedAt"
            name="practicalInfoVerifiedAt"
            type="date"
            defaultValue={
              values.practicalInfoVerifiedAt
                ? values.practicalInfoVerifiedAt.toISOString().slice(0, 10)
                : ""
            }
            className={inputClass}
          />
        </Field>
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="accent" size="lg" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create destination" : "Save changes"}
        </Button>
        <LinkButton href="/admin/destinations" variant="outline" size="lg">
          Cancel
        </LinkButton>
        {values.id ? (
          <Link
            href={`/admin/destinations/${values.id}/preview`}
            className="text-sm font-medium text-himalaya underline-offset-4 hover:underline"
          >
            Preview this version
          </Link>
        ) : null}
      </div>
    </form>
  );
}
