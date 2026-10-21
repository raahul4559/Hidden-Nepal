"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AuthorizationError, assertAdmin } from "@/features/auth/session";
import { destinationImageSchema } from "@/features/destinations/validation";
import { getStorageProvider, type UploadResult } from "@/features/uploads/provider";
import { validateImageMeta } from "@/features/uploads/validation";
import type { Prisma } from "@/generated/prisma/client";

import { adminDb, recordAudit } from "../data";
import { revalidateDestination } from "./revalidate";

export type ImageActionState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.url({ protocol: /^https$/ }).optional(),
);

const imageMetaSchema = z.object({
  alt: z.string().trim().min(1, "Alt text is required").max(300),
  caption: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(200).optional(),
  ),
  credit: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(200).optional(),
  ),
  license: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(60).optional(),
  ),
  sourceUrl: optionalUrl,
});

function metaFromForm(formData: FormData) {
  return imageMetaSchema.safeParse({
    alt: formData.get("alt"),
    caption: formData.get("caption"),
    credit: formData.get("credit"),
    license: formData.get("license"),
    sourceUrl: formData.get("sourceUrl"),
  });
}

async function actorOrError() {
  try {
    return { actor: await assertAdmin(), error: null as null };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { actor: null, error: { status: "error" as const, message: error.message } };
    }
    throw error;
  }
}

async function nextPosition(tx: Prisma.TransactionClient, destinationId: string) {
  const result = await tx.destinationImage.aggregate({
    where: { destinationId },
    _max: { position: true },
  });
  return (result._max.position ?? -1) + 1;
}

async function reindex(tx: Prisma.TransactionClient, destinationId: string) {
  const rows = await tx.destinationImage.findMany({
    where: { destinationId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  // Move to a high temporary range first: positions are unique per destination.
  for (const [index, row] of rows.entries()) {
    await tx.destinationImage.update({
      where: { id: row.id },
      data: { position: 100_000 + index },
    });
  }
  for (const [index, row] of rows.entries()) {
    await tx.destinationImage.update({ where: { id: row.id }, data: { position: index } });
  }
}

export async function uploadDestinationImage(
  _previous: ImageActionState,
  formData: FormData,
): Promise<ImageActionState> {
  const auth = await actorOrError();
  if (auth.error) return auth.error;

  const destinationId = String(formData.get("destinationId") ?? "");
  if (!destinationId) return { status: "error", message: "Missing destination." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose an image to upload." };
  }
  const fileError = validateImageMeta(file.type, file.size);
  if (fileError) return { status: "error", message: fileError };

  const meta = metaFromForm(formData);
  if (!meta.success) {
    return { status: "error", message: meta.error.issues[0]?.message ?? "Check the image details." };
  }

  const provider = getStorageProvider();
  if (!provider) {
    return {
      status: "error",
      message:
        "Image uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
    };
  }

  const db = adminDb();
  const destination = await db.destination.findUnique({
    where: { id: destinationId },
    select: { id: true, slug: true },
  });
  if (!destination) return { status: "error", message: "That destination no longer exists." };

  let uploaded: UploadResult;
  try {
    uploaded = await provider.upload(file);
  } catch (error) {
    console.error("[admin] image upload failed", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "The image could not be uploaded.",
    };
  }

  try {
    await db.$transaction(async (tx) => {
      const position = await nextPosition(tx, destinationId);
      await tx.destinationImage.create({
        data: {
          destinationId,
          url: uploaded.url,
          alt: meta.data.alt,
          caption: meta.data.caption ?? null,
          credit: meta.data.credit ?? null,
          license: meta.data.license ?? null,
          sourceUrl: meta.data.sourceUrl ?? null,
          position,
        },
      });
      await recordAudit(tx, auth.actor.id, "image.uploaded", "destination", destinationId, {
        provider: uploaded.provider,
        publicId: uploaded.publicId,
        bytes: uploaded.bytes,
      });
    });
  } catch (error) {
    // Do not leave an orphaned paid asset if the row could not be written.
    await provider.destroy(uploaded.publicId).catch(() => undefined);
    console.error("[admin] image row failed", error);
    return { status: "error", message: "The image uploaded but could not be saved. Please retry." };
  }

  revalidatePath(`/admin/destinations/${destinationId}/images`);
  revalidateDestination(destination.slug);
  return { status: "ok", message: "Image uploaded and added to the gallery." };
}

export async function addDestinationImageUrl(
  _previous: ImageActionState,
  formData: FormData,
): Promise<ImageActionState> {
  const auth = await actorOrError();
  if (auth.error) return auth.error;

  const destinationId = String(formData.get("destinationId") ?? "");
  if (!destinationId) return { status: "error", message: "Missing destination." };

  const parsed = destinationImageSchema.safeParse({
    url: formData.get("url"),
    alt: formData.get("alt"),
    caption: formData.get("caption") || undefined,
    credit: formData.get("credit") || undefined,
    license: formData.get("license") || undefined,
    sourceUrl: formData.get("sourceUrl") || undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the image details." };
  }

  const db = adminDb();
  const destination = await db.destination.findUnique({
    where: { id: destinationId },
    select: { id: true, slug: true },
  });
  if (!destination) return { status: "error", message: "That destination no longer exists." };

  try {
    await db.$transaction(async (tx) => {
      const position = await nextPosition(tx, destinationId);
      await tx.destinationImage.create({
        data: {
          destinationId,
          url: parsed.data.url,
          alt: parsed.data.alt,
          caption: parsed.data.caption ?? null,
          credit: parsed.data.credit ?? null,
          license: parsed.data.license ?? null,
          sourceUrl: parsed.data.sourceUrl ?? null,
          position,
        },
      });
      await recordAudit(tx, auth.actor.id, "image.url_added", "destination", destinationId, {
        url: parsed.data.url,
      });
    });
  } catch (error) {
    console.error("[admin] image URL add failed", error);
    return { status: "error", message: "The image could not be added." };
  }

  revalidatePath(`/admin/destinations/${destinationId}/images`);
  revalidateDestination(destination.slug);
  return { status: "ok", message: "Image added to the gallery." };
}

export async function updateDestinationImage(
  _previous: ImageActionState,
  formData: FormData,
): Promise<ImageActionState> {
  const auth = await actorOrError();
  if (auth.error) return auth.error;

  const destinationId = String(formData.get("destinationId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");
  if (!destinationId || !imageId) return { status: "error", message: "Missing image." };

  const meta = metaFromForm(formData);
  if (!meta.success) {
    return { status: "error", message: meta.error.issues[0]?.message ?? "Check the image details." };
  }

  const db = adminDb();
  const image = await db.destinationImage.findFirst({
    where: { id: imageId, destinationId },
    select: { id: true, destination: { select: { slug: true } } },
  });
  if (!image) return { status: "error", message: "That image no longer exists." };

  try {
    await db.$transaction(async (tx) => {
      await tx.destinationImage.update({
        where: { id: imageId },
        data: {
          alt: meta.data.alt,
          caption: meta.data.caption ?? null,
          credit: meta.data.credit ?? null,
          license: meta.data.license ?? null,
          sourceUrl: meta.data.sourceUrl ?? null,
        },
      });
      await recordAudit(tx, auth.actor.id, "image.updated", "destination", destinationId, { imageId });
    });
  } catch (error) {
    console.error("[admin] image update failed", error);
    return { status: "error", message: "The image could not be updated." };
  }

  revalidatePath(`/admin/destinations/${destinationId}/images`);
  revalidateDestination(image.destination.slug);
  return { status: "ok", message: "Image details saved." };
}

export async function deleteDestinationImage(
  _previous: ImageActionState,
  formData: FormData,
): Promise<ImageActionState> {
  const auth = await actorOrError();
  if (auth.error) return auth.error;

  const destinationId = String(formData.get("destinationId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");
  if (!destinationId || !imageId) return { status: "error", message: "Missing image." };

  const db = adminDb();
  const image = await db.destinationImage.findFirst({
    where: { id: imageId, destinationId },
    select: { id: true, url: true, destination: { select: { slug: true } } },
  });
  if (!image) return { status: "error", message: "That image no longer exists." };

  try {
    await db.$transaction(async (tx) => {
      await tx.destinationImage.delete({ where: { id: imageId } });
      await reindex(tx, destinationId);
      await recordAudit(tx, auth.actor.id, "image.deleted", "destination", destinationId, {
        imageId,
        url: image.url,
      });
    });
  } catch (error) {
    console.error("[admin] image delete failed", error);
    return { status: "error", message: "The image could not be removed." };
  }

  revalidatePath(`/admin/destinations/${destinationId}/images`);
  revalidateDestination(image.destination.slug);
  return { status: "ok", message: "Image removed." };
}

export async function moveDestinationImage(
  _previous: ImageActionState,
  formData: FormData,
): Promise<ImageActionState> {
  const auth = await actorOrError();
  if (auth.error) return auth.error;

  const destinationId = String(formData.get("destinationId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");
  const intent = String(formData.get("intent") ?? "");
  if (!destinationId || !imageId || !["up", "down", "cover"].includes(intent)) {
    return { status: "error", message: "Unknown image order change." };
  }

  const db = adminDb();
  const destination = await db.destination.findUnique({
    where: { id: destinationId },
    select: { slug: true },
  });
  if (!destination) return { status: "error", message: "That destination no longer exists." };

  try {
    await db.$transaction(async (tx) => {
      const rows = await tx.destinationImage.findMany({
        where: { destinationId },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { id: true },
      });
      const index = rows.findIndex((row) => row.id === imageId);
      if (index === -1) throw new Error("Image not found");
      const target =
        intent === "cover" ? 0 : intent === "up" ? Math.max(0, index - 1) : Math.min(rows.length - 1, index + 1);
      if (target === index) return;

      const reordered = [...rows];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(target, 0, moved);

      for (const [position, row] of reordered.entries()) {
        await tx.destinationImage.update({
          where: { id: row.id },
          data: { position: 100_000 + position },
        });
      }
      for (const [position, row] of reordered.entries()) {
        await tx.destinationImage.update({
          where: { id: row.id },
          data: { position },
        });
      }
      await recordAudit(tx, auth.actor.id, "image.reordered", "destination", destinationId, {
        imageId,
        intent,
      });
    });
  } catch (error) {
    console.error("[admin] image reorder failed", error);
    return { status: "error", message: "The image order could not be changed." };
  }

  revalidatePath(`/admin/destinations/${destinationId}/images`);
  revalidateDestination(destination.slug);
  return { status: "ok", message: "Image order updated." };
}
