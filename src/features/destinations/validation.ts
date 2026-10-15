/**
 * Validation for destination content entering the database (seed today,
 * admin forms later). Mirrors the database CHECK constraints and adds
 * domain rules the database can't know, such as "coordinates are in Nepal".
 *
 * Deliberately free of `server-only` so the seed script can import it.
 */
import { z } from "zod";

import {
  Currency,
  Difficulty,
  InfoStatus,
  PublishStatus,
  Season,
} from "@/generated/prisma/enums";
import { ACTIVITY_SLUGS } from "@/features/destinations/activities";
import { CATEGORY_SLUGS } from "@/features/experiences/categories";
import { PROVINCE_SLUGS } from "@/features/regions/provinces";

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens");

/** Generous bounding box around Nepal (≈26.3–30.5°N, 80.0–88.3°E). */
export const NEPAL_BOUNDS = {
  minLatitude: 26.3,
  maxLatitude: 30.5,
  minLongitude: 80.0,
  maxLongitude: 88.3,
} as const;

const coordinatesSchema = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })
  .refine(
    ({ latitude, longitude }) =>
      latitude >= NEPAL_BOUNDS.minLatitude &&
      latitude <= NEPAL_BOUNDS.maxLatitude &&
      longitude >= NEPAL_BOUNDS.minLongitude &&
      longitude <= NEPAL_BOUNDS.maxLongitude,
    { message: "Coordinates must fall within Nepal" },
  );

const costSchema = z
  .object({
    min: z.number().int().nonnegative(),
    max: z.number().int().nonnegative(),
    currency: z.enum(Currency),
  })
  .refine((c) => c.max >= c.min, {
    message: "Maximum cost must be at least the minimum",
    path: ["max"],
  });

const imageSchema = z.object({
  url: z.url({ protocol: /^https$/ }),
  alt: z.string().trim().min(1, "Images need alt text").max(300),
  caption: z.string().trim().max(200).optional(),
  credit: z.string().trim().max(200).optional(),
  license: z.string().trim().max(60).optional(),
  sourceUrl: z.url({ protocol: /^https$/ }).optional(),
});

const uniqueItems = <T>(items: readonly T[]) => new Set(items).size === items.length;

export const destinationInputSchema = z
  .object({
    slug: slugSchema,
    name: z.string().trim().min(2).max(120),
    summary: z.string().trim().min(20).max(280),
    description: z.string().trim().max(5000).optional(),
    status: z.enum(PublishStatus),
    publishedAt: z.date().optional(),
    isFeatured: z.boolean().default(false),
    isHiddenGem: z.boolean().default(false),
    isSample: z.boolean().default(false),

    regionSlug: z.enum(PROVINCE_SLUGS),
    district: z.string().trim().min(2).max(80).optional(),
    /** Ordered; the first is the primary category. */
    categorySlugs: z
      .array(z.enum(CATEGORY_SLUGS))
      .min(1)
      .max(4)
      .refine(uniqueItems, "Categories must be unique"),

    coordinates: coordinatesSchema.optional(),
    elevationM: z.number().int().min(0).max(8849).optional(),
    cost: costSchema.optional(),
    costNotes: z.string().trim().max(500).optional(),
    difficulty: z.enum(Difficulty).optional(),
    suggestedDays: z.number().int().min(1).max(60).optional(),
    seasons: z
      .array(z.enum(Season))
      .max(4)
      .refine(uniqueItems, "Seasons must be unique")
      .default([]),
    bestSeasonNotes: z.string().trim().max(500).optional(),
    accessInfo: z.string().trim().max(3000).optional(),
    safetyInfo: z.string().trim().max(3000).optional(),
    activitySlugs: z
      .array(z.enum(ACTIVITY_SLUGS))
      .max(12)
      .refine(uniqueItems, "Activities must be unique")
      .default([]),
    practicalInfo: z
      .object({
        status: z.enum(InfoStatus),
        verifiedAt: z.date().optional(),
      })
      .refine((p) => p.status !== "VERIFIED" || p.verifiedAt, {
        message: "Verified practical info needs a verification date",
        path: ["verifiedAt"],
      }),

    /** Ordered; the first is the cover. */
    images: z.array(imageSchema).max(12).default([]),
    sources: z
      .array(
        z.object({
          title: z.string().trim().min(2).max(200),
          url: z.url({ protocol: /^https$/ }),
          publisher: z.string().trim().max(120).optional(),
          accessedAt: z.date().optional(),
        }),
      )
      .max(20)
      .refine((s) => uniqueItems(s.map((x) => x.url)), "Source URLs must be unique")
      .default([]),
  })
  .refine((d) => d.status !== "PUBLISHED" || d.publishedAt, {
    message: "Published destinations need a publication date",
    path: ["publishedAt"],
  })
  .refine((d) => !d.isSample || d.practicalInfo.status === "PLACEHOLDER", {
    message: "Sample destinations must mark practical info as PLACEHOLDER",
    path: ["practicalInfo", "status"],
  });

export type DestinationInput = z.input<typeof destinationInputSchema>;
export type ValidDestinationInput = z.output<typeof destinationInputSchema>;
