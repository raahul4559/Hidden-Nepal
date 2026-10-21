import { z } from "zod";

import { PublishStatus } from "@/generated/prisma/enums";
import { slugSchema } from "@/features/destinations/validation";

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const guideFormSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(2, "Give the guide a title").max(160),
  excerpt: z.preprocess(
    blankToUndefined,
    z.string().trim().max(320, "Keep the excerpt under 320 characters").optional(),
  ),
  body: z
    .string()
    .trim()
    .min(50, "Write at least 50 characters for the guide body")
    .max(20_000, "Keep the guide under 20,000 characters"),
  status: z.enum(PublishStatus),
});

export type GuideFormData = z.output<typeof guideFormSchema>;

export function formDataToGuide(formData: FormData) {
  return {
    slug: String(formData.get("slug") ?? ""),
    title: String(formData.get("title") ?? ""),
    excerpt: String(formData.get("excerpt") ?? ""),
    body: String(formData.get("body") ?? ""),
    status: String(formData.get("status") ?? "") || PublishStatus.DRAFT,
  };
}
