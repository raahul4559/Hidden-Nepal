"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { AuthorizationError, assertAdmin } from "@/features/auth/session";

import {
  type DestinationStatusIntent,
  createDestination,
  setDestinationStatus,
  updateDestination,
} from "../destinations";
import {
  adminDestinationFormSchema,
  formDataToAdminDestination,
} from "../destination-validation";
import { revalidateDestination } from "./revalidate";

export type DestinationFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: Record<string, string> };

function invalid(raw: unknown) {
  const parsed = adminDestinationFormSchema.safeParse(raw);
  if (parsed.success) return { data: parsed.data, error: null as null };
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
  }
  return { data: null, error: { status: "error" as const, message: "Check the highlighted fields.", fieldErrors } };
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

export async function createDestinationAction(
  _previous: DestinationFormState,
  formData: FormData,
): Promise<DestinationFormState> {
  const auth = await actorOrError();
  if (auth.error) return auth.error;

  const form = invalid(formDataToAdminDestination(formData));
  if (form.error) return form.error;

  const result = await createDestination(auth.actor, form.data);
  if (result.status === "invalid") {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors };
  }
  if (result.status === "not_found") {
    return { status: "error", message: "That destination no longer exists.", fieldErrors: {} };
  }
  if (result.status === "error") {
    return { status: "error", message: "The destination could not be saved.", fieldErrors: {} };
  }

  revalidateDestination(result.slug);
  redirect(`/admin/destinations/${result.id}/edit?created=1`);
}

export async function updateDestinationAction(
  _previous: DestinationFormState,
  formData: FormData,
): Promise<DestinationFormState> {
  const auth = await actorOrError();
  if (auth.error) return auth.error;

  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Missing destination id.", fieldErrors: {} };

  const form = invalid(formDataToAdminDestination(formData));
  if (form.error) return form.error;

  const result = await updateDestination(auth.actor, id, form.data);
  if (result.status === "invalid") {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors };
  }
  if (result.status === "not_found") {
    return { status: "error", message: "That destination no longer exists.", fieldErrors: {} };
  }
  if (result.status === "error") {
    return { status: "error", message: "The destination could not be saved.", fieldErrors: {} };
  }

  revalidateDestination(result.slug, result.previousSlug);
  redirect(`/admin/destinations/${id}/edit?saved=1`);
}

const statusInput = z.object({
  id: z.string().min(1).max(64),
  intent: z.enum(["publish", "unpublish", "archive", "restore"]),
});

export type DestinationStatusState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

export async function setDestinationStatusAction(
  _previous: DestinationStatusState,
  formData: FormData,
): Promise<DestinationStatusState> {
  const auth = await actorOrError();
  if (auth.error) return { status: "error", message: auth.error.message };

  const parsed = statusInput.safeParse({
    id: formData.get("id"),
    intent: formData.get("intent"),
  });
  if (!parsed.success) return { status: "error", message: "Unknown status change." };

  try {
    const result = await setDestinationStatus(
      auth.actor,
      parsed.data.id,
      parsed.data.intent as DestinationStatusIntent,
    );
    if (result.status === "not_found") {
      return { status: "error", message: "That destination no longer exists." };
    }
    revalidateDestination(result.slug);
    return { status: "ok", message: "Destination updated." };
  } catch (error) {
    console.error("[admin] destination status failed", error);
    return { status: "error", message: "The destination could not be updated." };
  }
}
