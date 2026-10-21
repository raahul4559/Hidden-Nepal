"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { AuthorizationError, assertAdmin } from "@/features/auth/session";

import { createGuide, setGuideStatus, updateGuide, type GuideStatusIntent } from "../guides";
import { formDataToGuide, guideFormSchema } from "../guide-validation";
import { revalidateGuide } from "./revalidate";

export type GuideFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: Record<string, string> };

function parseForm(formData: FormData) {
  const parsed = guideFormSchema.safeParse(formDataToGuide(formData));
  if (parsed.success) return { data: parsed.data, error: null as null };
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
  }
  return {
    data: null,
    error: {
      status: "error" as const,
      message: "Check the highlighted fields.",
      fieldErrors,
    },
  };
}

async function actorOrError() {
  try {
    return { actor: await assertAdmin(), error: null as null };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { actor: null, error: { status: "error" as const, message: error.message, fieldErrors: {} } };
    }
    throw error;
  }
}

export async function createGuideAction(
  _previous: GuideFormState,
  formData: FormData,
): Promise<GuideFormState> {
  const auth = await actorOrError();
  if (auth.error) return auth.error;
  const form = parseForm(formData);
  if (form.error) return form.error;

  const result = await createGuide(auth.actor, form.data);
  if (result.status === "invalid") {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors };
  }
  if (result.status === "not_found") {
    return { status: "error", message: "That guide no longer exists.", fieldErrors: {} };
  }
  if (result.status === "error") {
    return { status: "error", message: "The guide could not be saved.", fieldErrors: {} };
  }

  revalidateGuide(result.slug);
  redirect(`/admin/guides/${result.id}/edit?created=1`);
}

export async function updateGuideAction(
  _previous: GuideFormState,
  formData: FormData,
): Promise<GuideFormState> {
  const auth = await actorOrError();
  if (auth.error) return auth.error;

  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Missing guide id.", fieldErrors: {} };

  const form = parseForm(formData);
  if (form.error) return form.error;

  const result = await updateGuide(auth.actor, id, form.data);
  if (result.status === "invalid") {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors };
  }
  if (result.status === "not_found") {
    return { status: "error", message: "That guide no longer exists.", fieldErrors: {} };
  }
  if (result.status === "error") {
    return { status: "error", message: "The guide could not be saved.", fieldErrors: {} };
  }

  revalidateGuide(result.slug, result.previousSlug);
  redirect(`/admin/guides/${id}/edit?saved=1`);
}

const statusInput = z.object({
  id: z.string().min(1).max(64),
  intent: z.enum(["publish", "unpublish", "archive", "restore"]),
});

export type GuideStatusState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

export async function setGuideStatusAction(
  _previous: GuideStatusState,
  formData: FormData,
): Promise<GuideStatusState> {
  const auth = await actorOrError();
  if (auth.error) return { status: "error", message: auth.error.message };

  const parsed = statusInput.safeParse({
    id: formData.get("id"),
    intent: formData.get("intent"),
  });
  if (!parsed.success) return { status: "error", message: "Unknown status change." };

  try {
    const result = await setGuideStatus(auth.actor, parsed.data.id, parsed.data.intent as GuideStatusIntent);
    if (result.status === "not_found") {
      return { status: "error", message: "That guide no longer exists." };
    }
    revalidateGuide(result.slug);
    return { status: "ok", message: "Guide updated." };
  } catch (error) {
    console.error("[admin] guide status failed", error);
    return { status: "error", message: "The guide could not be updated." };
  }
}
