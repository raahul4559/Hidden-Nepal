"use server";

import { headers } from "next/headers";

import {
  clientIp,
  consumeRateLimit,
  formatRetryAfter,
  RATE_LIMITS,
} from "@/features/auth/rate-limit";
import { getCurrentUser } from "@/features/auth/session";
import { getStorageProvider } from "@/features/uploads/provider";
import { matchesImageSignature, validateImageMeta } from "@/features/uploads/validation";
import { getDb } from "@/lib/db";

import {
  formDataToSubmission,
  HONEYPOT_FIELD,
  IMAGE_FIELD,
  pickedImage,
  type PlaceSubmissionField,
  placeSubmissionSchema,
  SUBMISSION_FIELDS,
} from "./validation";

type SubmissionValues = Partial<Record<PlaceSubmissionField, string>>;

/** The photo input is validated but never echoed back (files are one-shot). */
export type SubmissionFieldError = PlaceSubmissionField | typeof IMAGE_FIELD;

export type SubmissionFormState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      message: string;
      fieldErrors: Partial<Record<SubmissionFieldError, string>>;
      /** Echoed back so the form keeps what the visitor typed. */
      values: SubmissionValues;
    };

function echoValues(raw: ReturnType<typeof formDataToSubmission>): SubmissionValues {
  return Object.fromEntries(
    SUBMISSION_FIELDS.filter((f) => f !== "consentToShare").map((f) => [f, String(raw[f] ?? "")]),
  ) as SubmissionValues;
}

function fieldError(
  message: string,
  field: SubmissionFieldError,
  values: SubmissionValues,
  fieldErrors: Partial<Record<SubmissionFieldError, string>> = {},
): SubmissionFormState {
  return { status: "error", message, fieldErrors: { ...fieldErrors, [field]: message }, values };
}

export async function submitPlace(
  _previous: SubmissionFormState,
  formData: FormData,
): Promise<SubmissionFormState> {
  // Bots that fill the hidden field get a normal-looking success and no write.
  if (String(formData.get(HONEYPOT_FIELD) ?? "") !== "") {
    return { status: "success" };
  }

  const raw = formDataToSubmission(formData);
  const values = echoValues(raw);

  const parsed = placeSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<SubmissionFieldError, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as SubmissionFieldError;
      fieldErrors[field] ??= issue.message;
    }
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors,
      values,
    };
  }

  // Photo: type, size and file signature are checked before anything is sent
  // to storage, so a renamed non-image never leaves the server.
  const provider = getStorageProvider();
  const image = formData.get(IMAGE_FIELD);
  const hasImage = pickedImage(image);
  if (hasImage) {
    const metaError = validateImageMeta(image.type, image.size);
    if (metaError) return fieldError(metaError, IMAGE_FIELD, values);

    const header = new Uint8Array(await image.slice(0, 16).arrayBuffer());
    if (!matchesImageSignature(header, image.type)) {
      return fieldError("That file does not look like a valid image.", IMAGE_FIELD, values);
    }
    if (!provider) {
      return fieldError(
        "Photo uploads aren’t available right now. Remove the photo to send your suggestion.",
        IMAGE_FIELD,
        values,
      );
    }
  }

  const db = getDb();
  if (!db) {
    return {
      status: "error",
      message: "We can’t receive suggestions right now. Please try again later.",
      fieldErrors: {},
      values,
    };
  }

  const user = await getCurrentUser().catch(() => null);

  // Rate limits: one counter per client address, plus a separate one per
  // signed-in account. Keys are hashed; no IP or email is stored.
  try {
    const requestHeaders = await headers();
    const subjects: { rule: (typeof RATE_LIMITS)[keyof typeof RATE_LIMITS]; subject: string }[] = [
      { rule: RATE_LIMITS.submissionPerIp, subject: clientIp(requestHeaders) },
    ];
    if (user) subjects.push({ rule: RATE_LIMITS.submissionPerUser, subject: user.id });

    for (const { rule, subject } of subjects) {
      const limit = await consumeRateLimit(db, rule, subject);
      if (!limit.ok) {
        return {
          status: "error",
          message: `You’ve sent several suggestions recently. Please try again in about ${formatRetryAfter(limit.retryAfterSeconds)}.`,
          fieldErrors: {},
          values,
        };
      }
    }
  } catch (error) {
    // A rate limiter that cannot record a count must not silently allow
    // unlimited submissions.
    console.error("[submissions] rate limit unavailable", error);
    return {
      status: "error",
      message: "We can’t receive suggestions right now. Please try again later.",
      fieldErrors: {},
      values,
    };
  }

  // Upload only once the submission itself is valid, so a rejected form never
  // leaves an orphaned asset behind.
  let upload: { url: string; publicId: string } | null = null;
  if (hasImage && provider) {
    try {
      const result = await provider.upload(image);
      upload = { url: result.url, publicId: result.publicId };
    } catch (error) {
      console.error("[submissions] image upload failed", error instanceof Error ? error.message : error);
      return fieldError(
        "We couldn’t accept that photo. Please try a different image, or send your suggestion without one.",
        IMAGE_FIELD,
        values,
      );
    }
  }

  const { region, category, latitude, longitude, imageAlt, ...data } = parsed.data;
  try {
    await db.placeSubmission.create({
      data: {
        ...data,
        consentToShare: true,
        // Account reference when the visitor is signed in; otherwise null.
        ...(user && { submitter: { connect: { id: user.id } } }),
        ...(region && { region: { connect: { slug: region } } }),
        ...(category && { category: { connect: { slug: category } } }),
        ...(latitude !== undefined && longitude !== undefined && { latitude, longitude }),
        ...(upload && { imageUrl: upload.url, imagePublicId: upload.publicId, imageAlt }),
      },
      select: { id: true },
    });
  } catch (error) {
    console.error("[submissions] create failed", error);
    if (upload) await provider?.destroy(upload.publicId).catch(() => {});
    return {
      status: "error",
      message: "Something went wrong saving your suggestion. Please try again.",
      fieldErrors: {},
      values,
    };
  }

  return { status: "success" };
}
