import { z } from "zod";

import { CATEGORY_SLUGS } from "@/features/experiences/categories";
import { PROVINCE_SLUGS } from "@/features/regions/provinces";
import { slugSchema } from "@/features/destinations/validation";

import { coordinatesInNepal, isReliableGeoSource } from "./geo";

const httpsUrl = z.url({ protocol: /^https$/ });
const username = z
  .string()
  .trim()
  .min(1)
  .max(31)
  .regex(
    /^@?[A-Za-z0-9._]+$/,
    "Instagram usernames contain only letters, numbers, periods and underscores",
  )
  .transform((value) => value.replace(/^@+/, ""));

export const manualPostSchema = z.object({
  destinationSlug: slugSchema,
  postUrl: z.string().trim().min(1).max(500),
  creatorUsername: username.optional(),
  caption: z.string().trim().max(2200).optional(),
  locationTag: z.string().trim().max(120).optional(),
  /** Optional metadata reference, never a rehosted image. */
  imageUrl: httpsUrl.optional(),
  collectedAt: z.coerce.date().optional(),
  rightsStatus: z.enum(["PERMITTED", "UNVERIFIED"]).default("UNVERIFIED"),
  rightsNote: z.string().trim().max(500).optional(),
});

export type ManualPostInput = z.output<typeof manualPostSchema>;

/**
 * A place supplied by an editor. Coordinates and a reliable geographic source
 * are mandatory; the importer creates it as a draft rather than overwriting an
 * existing destination with the same slug.
 */
export const manualPlaceSchema = z
  .object({
    slug: slugSchema,
    name: z.string().trim().min(2).max(120),
    summary: z.string().trim().min(20).max(280),
    description: z.string().trim().max(5000).optional(),
    province: z.enum(PROVINCE_SLUGS),
    district: z.string().trim().min(2).max(80),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    categorySlugs: z
      .array(z.enum(CATEGORY_SLUGS))
      .min(1)
      .max(4)
      .refine((items) => new Set(items).size === items.length, {
        message: "Categories must be unique",
      }),
    /** Public references for the place itself. */
    sourceUrls: z.array(httpsUrl).min(1).max(20),
    /** Must be an OSM/Wikidata/NTB/UNESCO/government URL. */
    geoSourceUrl: httpsUrl,
    status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  })
  .refine(
    (place) => coordinatesInNepal(place.latitude, place.longitude),
    {
      message: "Coordinates must fall within Nepal",
      path: ["latitude"],
    },
  )
  .refine((place) => isReliableGeoSource(place.geoSourceUrl), {
    message:
      "geoSourceUrl must be an OpenStreetMap, Wikidata, Nepal Tourism Board, UNESCO or government URL",
    path: ["geoSourceUrl"],
  })
  .refine(
    (place) => new Set(place.sourceUrls).size === place.sourceUrls.length,
    { message: "Source URLs must be unique", path: ["sourceUrls"] },
  );

export type ManualPlaceInput = z.output<typeof manualPlaceSchema>;

export const manualDatasetSchema = z.object({
  metadata: z
    .object({
      schemaVersion: z.string().trim().max(20).optional(),
      updatedAt: z.coerce.date().optional(),
      accessNote: z.string().trim().max(1000).optional(),
    })
    .catchall(z.unknown())
    .optional(),
  posts: z.array(z.unknown()).default([]),
  places: z.array(z.unknown()).default([]),
});

export type ManualDataset = z.output<typeof manualDatasetSchema>;
