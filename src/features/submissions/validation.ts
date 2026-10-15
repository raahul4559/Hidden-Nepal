import { z } from "zod";

import { CATEGORY_SLUGS } from "@/features/experiences/categories";
import { PROVINCE_SLUGS } from "@/features/regions/provinces";

/** Empty form fields arrive as "": treat them as absent. */
const blankToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalText = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max, `Keep this under ${max} characters`).optional());

export const placeSubmissionSchema = z.object({
  placeName: z
    .string({ error: "Tell us the place’s name" })
    .trim()
    .min(2, "Tell us the place’s name")
    .max(120, "Keep the name under 120 characters"),
  region: z.preprocess(blankToUndefined, z.enum(PROVINCE_SLUGS, { error: "Choose a province from the list" }).optional()),
  category: z.preprocess(blankToUndefined, z.enum(CATEGORY_SLUGS, { error: "Choose an experience from the list" }).optional()),
  locationDetails: optionalText(200),
  description: z
    .string({ error: "Describe the place" })
    .trim()
    .min(30, "Tell us a little more: at least 30 characters")
    .max(3000, "Keep the description under 3,000 characters"),
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
});

export type PlaceSubmissionInput = z.output<typeof placeSubmissionSchema>;
export type PlaceSubmissionField = keyof z.input<typeof placeSubmissionSchema>;

export const SUBMISSION_FIELDS = [
  "placeName",
  "region",
  "category",
  "locationDetails",
  "description",
  "submitterName",
  "submitterEmail",
  "consentToShare",
] as const satisfies readonly PlaceSubmissionField[];

/** Hidden field real visitors never fill in; bots often do. */
export const HONEYPOT_FIELD = "website";

export function formDataToSubmission(formData: FormData) {
  return {
    placeName: formData.get("placeName") ?? undefined,
    region: formData.get("region") ?? undefined,
    category: formData.get("category") ?? undefined,
    locationDetails: formData.get("locationDetails") ?? undefined,
    description: formData.get("description") ?? undefined,
    submitterName: formData.get("submitterName") ?? undefined,
    submitterEmail: formData.get("submitterEmail") ?? undefined,
    consentToShare: formData.get("consentToShare") === "on",
  };
}
