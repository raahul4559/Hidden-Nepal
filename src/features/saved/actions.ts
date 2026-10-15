"use server";

import { z } from "zod";

import { AuthorizationError, getCurrentUser } from "@/features/auth/session";
import { slugSchema } from "@/features/destinations/validation";

import { removeSavedDestination, saveDestination } from "./service";

export type SaveState =
  | { status: "idle"; saved: boolean }
  | { status: "ok"; saved: boolean }
  | { status: "error"; saved: boolean; message: string };

const saveInput = z.object({
  slug: slugSchema,
  intent: z.enum(["save", "remove"]),
});

/**
 * Save or unsave a destination for the signed-in user. The user comes from
 * the session; a `userId` in the form data would simply be ignored.
 */
export async function toggleSavedDestination(previous: SaveState, formData: FormData): Promise<SaveState> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", saved: previous.saved, message: new AuthorizationError(401).message };
  }

  const parsed = saveInput.safeParse({ slug: formData.get("slug"), intent: formData.get("intent") });
  if (!parsed.success) return { status: "error", saved: previous.saved, message: "That destination wasn’t found." };

  try {
    const { slug, intent } = parsed.data;
    const result = intent === "save" ? await saveDestination(user, slug) : await removeSavedDestination(user, slug);
    if (result.status === "not_found") {
      return { status: "error", saved: false, message: "That destination wasn’t found." };
    }
    return { status: "ok", saved: result.saved };
  } catch (error) {
    console.error("[saved] toggle failed", error instanceof Error ? error.message : error);
    return { status: "error", saved: previous.saved, message: "Something went wrong. Please try again." };
  }
}
