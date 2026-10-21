import { z } from "zod";

import { CATEGORY_SLUGS } from "@/features/experiences/categories";
import { PROVINCE_SLUGS } from "@/features/regions/provinces";

/** Empty form fields arrive as "": treat them as absent. */
const blankToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalText = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max, `Keep this under ${max} characters`).optional());

/**
 * Decimal degrees, e.g. 28.2094 / 83.9716. Parsed as text first so the error
 * names the field instead of failing on a NaN comparison.
 */
const coordinate = (label: string, min: number, max: number) =>
  z.preprocess(
    blankToUndefined,
    z
      .string()
      .trim()
      .regex(/^-?\d{1,3}(\.\d{1,6})?$/, `Enter ${label.toLowerCase()} as a number such as 28.2094`)
      .refine((v) => Number(v) >= min && Number(v) <= max, `${label} must be between ${min} and ${max}`)
      .transform(Number)
      .optional(),
  );

export const placeSubmissionSchema = z
  .object({
    placeName: z
      .string({ error: "Tell us the place’s name" })
      .trim()
      .min(2, "Tell us the place’s name")
      .max(120, "Keep the name under 120 characters"),
    region: z.preprocess(blankToUndefined, z.enum(PROVINCE_SLUGS, { error: "Choose a province from the list" }).optional()),
    district: optionalText(80),
    category: z.preprocess(blankToUndefined, z.enum(CATEGORY_SLUGS, { error: "Choose an experience from the list" }).optional()),
    locationDetails: optionalText(200),
    description: z
      .string({ error: "Describe the place" })
      .trim()
      .min(30, "Tell us a little more: at least 30 characters")
      .max(3000, "Keep the description under 3,000 characters"),
    latitude: coordinate("Latitude", -90, 90),
    longitude: coordinate("Longitude", -180, 180),
    imageAlt: optionalText(200),
    submitterName: optionalText(80),
    submitterEmail: z.preprocess(
      blankToUndefined,
      z
        .email("Enter a valid email address, or leave it blank")
        .max(254)
        .transform((v) => v.toLowerCase())
        .optional(),
    ),
    consentToShare: z.literal(true, {
      error: "Please confirm you’re happy for us to use this suggestion",
    }),
  })
  .superRefine((data, ctx) => {
    // A province without a district is too vague to research: the visitor can
    // say "Not sure" instead, which keeps district genuinely optional.
    if (data.region && !data.district) {
      ctx.addIssue({
        code: "custom",
        path: ["district"],
        message: "Add the district, or set the province to “Not sure”.",
      });
    }
    // Coordinates are only useful as a pair.
    if ((data.latitude === undefined) !== (data.longitude === undefined)) {
      ctx.addIssue({
        code: "custom",
        path: [data.latitude === undefined ? "latitude" : "longitude"],
        message: "Add both coordinates, or leave both blank.",
      });
    }
  });

export type PlaceSubmissionInput = z.output<typeof placeSubmissionSchema>;
export type PlaceSubmissionField = keyof z.input<typeof placeSubmissionSchema>;

export const SUBMISSION_FIELDS = [
  "placeName",
  "region",
  "district",
  "category",
  "locationDetails",
  "description",
  "latitude",
  "longitude",
  "imageAlt",
  "submitterName",
  "submitterEmail",
  "consentToShare",
] as const satisfies readonly PlaceSubmissionField[];

/** Hidden field real visitors never fill in; bots often do. */
export const HONEYPOT_FIELD = "website";

/** Form field name of the optional photo. Files are not echoed back. */
export const IMAGE_FIELD = "image";

/** True when the visitor actually chose a file (browsers send an empty one otherwise). */
export function pickedImage(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export function formDataToSubmission(formData: FormData) {
  return {
    placeName: formData.get("placeName") ?? undefined,
    region: formData.get("region") ?? undefined,
    district: formData.get("district") ?? undefined,
    category: formData.get("category") ?? undefined,
    locationDetails: formData.get("locationDetails") ?? undefined,
    description: formData.get("description") ?? undefined,
    latitude: formData.get("latitude") ?? undefined,
    longitude: formData.get("longitude") ?? undefined,
    imageAlt: formData.get("imageAlt") ?? undefined,
    submitterName: formData.get("submitterName") ?? undefined,
    submitterEmail: formData.get("submitterEmail") ?? undefined,
    consentToShare: formData.get("consentToShare") === "on",
  };
}
