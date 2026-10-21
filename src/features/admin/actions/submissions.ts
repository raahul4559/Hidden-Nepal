"use server";

import { revalidatePath } from "next/cache";

import { AuthorizationError, assertAdmin } from "@/features/auth/session";

import {
  REVIEW_OUTCOMES,
  reviewInputSchema,
  SUBMISSION_STATUS_LABELS,
} from "../submission-review";
import { reviewSubmission } from "../submissions";

export type ReviewActionState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

/** Admin only. The role is checked here too, independently of the page guard. */
export async function reviewSubmissionAction(
  _previous: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  let actor;
  try {
    actor = await assertAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) return { status: "error", message: error.message };
    throw error;
  }

  const parsed = reviewInputSchema.safeParse({
    id: formData.get("id"),
    intent: formData.get("intent"),
    explanation: formData.get("explanation") ?? undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the review details.",
    };
  }

  try {
    const result = await reviewSubmission(actor, parsed.data);
    if (result.status === "not_found") {
      return { status: "error", message: "That suggestion no longer exists." };
    }
    if (result.status === "not_allowed") {
      return {
        status: "error",
        message: `That action isn’t available for a ${SUBMISSION_STATUS_LABELS[result.currentStatus].toLowerCase()} suggestion.`,
      };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/submissions");
    revalidatePath(`/admin/submissions/${parsed.data.id}`);
    return { status: "ok", message: REVIEW_OUTCOMES[parsed.data.intent].done };
  } catch (error) {
    console.error("[admin] submission review failed", error);
    return { status: "error", message: "The review could not be saved. Please try again." };
  }
}
