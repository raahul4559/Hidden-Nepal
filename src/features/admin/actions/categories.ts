"use server";

import { revalidatePath } from "next/cache";

import { AuthorizationError, assertAdmin } from "@/features/auth/session";

import { updateCategory } from "../categories";
import { categoryFormSchema, formDataToCategory } from "../category-validation";

export type CategoryActionState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string; fieldErrors: Record<string, string> };

export async function updateCategoryAction(
  _previous: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  let actor;
  try {
    actor = await assertAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) return { status: "error", message: error.message, fieldErrors: {} };
    throw error;
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Missing category id.", fieldErrors: {} };

  const parsed = categoryFormSchema.safeParse(formDataToCategory(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    }
    return { status: "error", message: "Check the highlighted fields.", fieldErrors };
  }

  const result = await updateCategory(actor, id, parsed.data);
  if (result.status === "invalid") {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors };
  }
  if (result.status === "not_found") {
    return { status: "error", message: "That category no longer exists.", fieldErrors: {} };
  }
  if (result.status === "error") {
    return { status: "error", message: "The category could not be saved.", fieldErrors: {} };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin");
  revalidatePath("/explore");
  return { status: "ok", message: "Category saved." };
}
