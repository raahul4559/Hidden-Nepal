"use server";

import { revalidatePath } from "next/cache";

import { AuthorizationError, assertAdmin } from "@/features/auth/session";
import { getDb } from "@/lib/db";

import { importInstagramReferences } from "./import";
import { parseManualDataset } from "./manual";
import { manualPostSchema } from "./schemas";

export type InstagramFormState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

function field(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/**
 * Admin-only manual entry point for Instagram references. It uses the same
 * validators and idempotent importer as the CLI, so a shortcode submitted twice
 * updates the existing row instead of creating a duplicate.
 */
export async function addInstagramReference(
  _previous: InstagramFormState,
  formData: FormData,
): Promise<InstagramFormState> {
  try {
    await assertAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) return { status: "error", message: error.message };
    throw error;
  }

  const destinationSlug = field(formData, "destinationSlug");
  const postUrl = field(formData, "postUrl");
  if (!destinationSlug) return { status: "error", message: "Choose a destination." };
  if (!postUrl) return { status: "error", message: "Paste the public Instagram post URL." };

  const raw = {
    destinationSlug,
    postUrl,
    creatorUsername: field(formData, "creatorUsername"),
    caption: field(formData, "caption"),
    locationTag: field(formData, "locationTag"),
    rightsStatus: field(formData, "rightsStatus") ?? "UNVERIFIED",
    rightsNote: field(formData, "rightsNote"),
  };

  const parsed = manualPostSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
    };
  }

  const manual = parseManualDataset({ posts: [parsed.data], places: [] });
  const post = manual.posts[0];
  if (!post) {
    return {
      status: "error",
      message:
        manual.rejected[0]?.reason ??
        "That isn’t a public Instagram post URL. Use /p/<shortcode>/, /reel/<shortcode>/ or /tv/<shortcode>/.",
    };
  }

  const db = getDb();
  if (!db) return { status: "error", message: "The database is not configured." };

  try {
    // If this shortcode already belongs to another destination, revalidate that
    // old detail page too after the upsert moves it.
    const existing = await db.destinationInstagramPost.findUnique({
      where: { shortcode: post.shortcode },
      select: { destination: { select: { slug: true } } },
    });

    const result = await importInstagramReferences(db, {
      posts: manual.posts,
      places: [],
      graphConfigured: false,
      dryRun: false,
      datasetErrors: manual.rejected,
    });

    const written = result.import.posts.created + result.import.posts.updated;
    if (written === 0) {
      return {
        status: "error",
        message:
          result.import.rejected[0]?.reason ??
          "The reference was not saved. Check the destination and post URL.",
      };
    }

    revalidatePath("/admin/instagram");
    revalidatePath(`/destinations/${post.destinationSlug}`);
    if (existing && existing.destination.slug !== post.destinationSlug) {
      revalidatePath(`/destinations/${existing.destination.slug}`);
    }

    return {
      status: "ok",
      message:
        result.import.posts.updated > 0
          ? "Reference updated."
          : post.rightsStatus === "PERMITTED"
            ? "Reference added. It will appear on the destination page."
            : "Reference saved. It stays hidden until its rights status is set to PERMITTED.",
    };
  } catch (error) {
    console.error("[instagram] admin save failed", error);
    return { status: "error", message: "Something went wrong saving the reference." };
  }
}
