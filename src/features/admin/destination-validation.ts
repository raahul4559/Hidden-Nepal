import { z } from "zod";

import {
  Currency,
  Difficulty,
  InfoStatus,
  PublishStatus,
  Season,
} from "@/generated/prisma/enums";
import { ACTIVITY_SLUGS } from "@/features/destinations/activities";
import type { DestinationInput } from "@/features/destinations/validation";
import { slugSchema } from "@/features/destinations/validation";
import { CATEGORY_SLUGS } from "@/features/experiences/categories";
import { PROVINCE_SLUGS } from "@/features/regions/provinces";

/** Empty form fields arrive as "": treat them as absent. */
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

function optionalText(max: number) {
  return z.preprocess(
    blankToUndefined,
    z.string().trim().max(max, `Keep this under ${max} characters`).optional(),
  );
}

function optionalInt(min: number, max: number, label: string) {
  return z.preprocess(
    blankToUndefined,
    z.coerce
      .number({ error: `${label} must be a number` })
      .int(`${label} must be a whole number`)
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} must be at most ${max}`)
      .optional(),
  );
}

function optionalNumber(min: number, max: number, label: string) {
  return z.preprocess(
    blankToUndefined,
    z.coerce
      .number({ error: `${label} must be a number` })
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} must be at most ${max}`)
      .optional(),
  );
}

const optionalDate = z.preprocess(blankToUndefined, z.coerce.date().optional());

const checkbox = z.preprocess(
  (value) => value === "on" || value === "true" || value === true,
  z.boolean(),
);

const uniqueItems = <T>(items: readonly T[]) => new Set(items).size === items.length;

export const adminDestinationFormSchema = z
  .object({
    slug: slugSchema,
    name: z.string().trim().min(2, "Give the destination a name").max(120),
    summary: z
      .string()
      .trim()
      .min(20, "Write a one-sentence summary of at least 20 characters")
      .max(280),
    description: optionalText(5000),
    status: z.enum(PublishStatus),
    isFeatured: checkbox,
    isHiddenGem: checkbox,

    regionSlug: z.enum(PROVINCE_SLUGS, { error: "Choose a province" }),
    district: optionalText(80),
    categorySlugs: z
      .array(z.enum(CATEGORY_SLUGS, { error: "Choose a known category" }))
      .min(1, "Choose at least one category")
      .max(4)
      .refine(uniqueItems, "Categories must be unique"),

    latitude: optionalNumber(-90, 90, "Latitude"),
    longitude: optionalNumber(-180, 180, "Longitude"),
    elevationM: optionalInt(0, 8849, "Elevation"),
    costMin: optionalInt(0, 10_000_000, "Minimum cost"),
    costMax: optionalInt(0, 10_000_000, "Maximum cost"),
    currency: z.enum(Currency),
    costNotes: optionalText(500),
    difficulty: z.preprocess(blankToUndefined, z.enum(Difficulty).optional()),
    suggestedDays: optionalInt(1, 60, "Suggested days"),
    seasons: z
      .array(z.enum(Season))
      .max(4)
      .refine(uniqueItems, "Seasons must be unique"),
    bestSeasonNotes: optionalText(500),
    accessInfo: optionalText(3000),
    safetyInfo: optionalText(3000),
    activitySlugs: z
      .array(z.enum(ACTIVITY_SLUGS))
      .max(12)
      .refine(uniqueItems, "Activities must be unique"),
    practicalInfoStatus: z.enum(InfoStatus),
    practicalInfoVerifiedAt: optionalDate,
  })
  .superRefine((data, ctx) => {
    if ((data.latitude === undefined) !== (data.longitude === undefined)) {
      ctx.addIssue({
        code: "custom",
        path: ["latitude"],
        message: "Enter both latitude and longitude, or leave both blank",
      });
    }
    if ((data.costMin === undefined) !== (data.costMax === undefined)) {
      ctx.addIssue({
        code: "custom",
        path: ["costMin"],
        message: "Enter both minimum and maximum cost, or leave both blank",
      });
    }
    if (
      data.costMin !== undefined &&
      data.costMax !== undefined &&
      data.costMax < data.costMin
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["costMax"],
        message: "Maximum cost must be at least the minimum",
      });
    }
    if (
      data.practicalInfoStatus === "VERIFIED" &&
      data.practicalInfoVerifiedAt === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["practicalInfoVerifiedAt"],
        message: "Verified practical information needs a verification date",
      });
    }
  });

export type AdminDestinationForm = z.output<typeof adminDestinationFormSchema>;

export function formDataToAdminDestination(formData: FormData) {
  const text = (name: string) => String(formData.get(name) ?? "");

  return {
    slug: text("slug"),
    name: text("name"),
    summary: text("summary"),
    description: text("description"),
    status: text("status") || PublishStatus.DRAFT,
    isFeatured: formData.get("isFeatured") === "on",
    isHiddenGem: formData.get("isHiddenGem") === "on",
    regionSlug: text("regionSlug"),
    district: text("district"),
    categorySlugs: formData.getAll("categorySlugs").map(String),
    latitude: text("latitude"),
    longitude: text("longitude"),
    elevationM: text("elevationM"),
    costMin: text("costMin"),
    costMax: text("costMax"),
    currency: text("currency") || Currency.NPR,
    costNotes: text("costNotes"),
    difficulty: text("difficulty"),
    suggestedDays: text("suggestedDays"),
    seasons: formData.getAll("seasons").map(String),
    bestSeasonNotes: text("bestSeasonNotes"),
    accessInfo: text("accessInfo"),
    safetyInfo: text("safetyInfo"),
    activitySlugs: formData.getAll("activitySlugs").map(String),
    practicalInfoStatus: text("practicalInfoStatus") || InfoStatus.UNVERIFIED,
    practicalInfoVerifiedAt: text("practicalInfoVerifiedAt"),
  };
}

type ExistingDestination = {
  publishedAt: Date | null;
  isSample: boolean;
};

/**
 * Converts validated admin form data into the canonical destination input.
 * Child rows that are managed by other screens (images, sources, Instagram)
 * are intentionally left empty here and are not touched by the scalar save.
 */
export function toDestinationInput(
  data: AdminDestinationForm,
  existing?: ExistingDestination,
): DestinationInput {
  const publishedAt =
    data.status === PublishStatus.PUBLISHED
      ? (existing?.publishedAt ?? new Date())
      : (existing?.publishedAt ?? undefined);

  const isSample = existing?.isSample ?? false;
  const practicalStatus = isSample ? InfoStatus.PLACEHOLDER : data.practicalInfoStatus;

  return {
    slug: data.slug,
    name: data.name,
    summary: data.summary,
    description: data.description,
    status: data.status,
    publishedAt,
    isFeatured: data.isFeatured,
    isHiddenGem: data.isHiddenGem,
    isSample,
    regionSlug: data.regionSlug,
    district: data.district,
    categorySlugs: data.categorySlugs,
    ...(data.latitude !== undefined &&
      data.longitude !== undefined && {
        coordinates: { latitude: data.latitude, longitude: data.longitude },
      }),
    elevationM: data.elevationM,
    ...(data.costMin !== undefined &&
      data.costMax !== undefined && {
        cost: { min: data.costMin, max: data.costMax, currency: data.currency },
      }),
    costNotes: data.costNotes,
    difficulty: data.difficulty,
    suggestedDays: data.suggestedDays,
    seasons: data.seasons,
    bestSeasonNotes: data.bestSeasonNotes,
    accessInfo: data.accessInfo,
    safetyInfo: data.safetyInfo,
    activitySlugs: data.activitySlugs,
    practicalInfo: {
      status: practicalStatus,
      ...(practicalStatus === InfoStatus.VERIFIED && {
        verifiedAt: data.practicalInfoVerifiedAt ?? new Date(),
      }),
    },
    images: [],
    sources: [],
  };
}
