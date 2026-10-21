import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Give the category a name").max(80),
  description: z
    .string()
    .trim()
    .min(10, "Write a short description of at least 10 characters")
    .max(300),
  sortOrder: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.coerce.number().int().min(0).max(999),
  ),
});

export type CategoryFormData = z.output<typeof categoryFormSchema>;

export function formDataToCategory(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? ""),
  };
}
