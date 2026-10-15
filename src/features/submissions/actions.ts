"use server";

import { getDb } from "@/lib/db";

import {
  formDataToSubmission,
  HONEYPOT_FIELD,
  type PlaceSubmissionField,
  placeSubmissionSchema,
  SUBMISSION_FIELDS,
} from "./validation";

type SubmissionValues = Partial<Record<PlaceSubmissionField, string>>;

export type SubmissionFormState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      message: string;
      fieldErrors: Partial<Record<PlaceSubmissionField, string>>;
      /** Echoed back so the form keeps what the visitor typed. */
      values: SubmissionValues;
    };

export async function submitPlace(
  _previous: SubmissionFormState,
  formData: FormData,
): Promise<SubmissionFormState> {
  // Bots that fill the hidden field get a normal-looking success and no write.
  if (String(formData.get(HONEYPOT_FIELD) ?? "") !== "") {
    return { status: "success" };
  }

  const raw = formDataToSubmission(formData);
  const values = Object.fromEntries(
    SUBMISSION_FIELDS.filter((f) => f !== "consentToShare").map((f) => [f, String(raw[f] ?? "")]),
  ) as SubmissionValues;

  const parsed = placeSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<PlaceSubmissionField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as PlaceSubmissionField;
      fieldErrors[field] ??= issue.message;
    }
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors,
      values,
    };
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

  const { region, category, ...data } = parsed.data;
  try {
    await db.placeSubmission.create({
      data: {
        ...data,
        consentToShare: true,
        ...(region && { region: { connect: { slug: region } } }),
        ...(category && { category: { connect: { slug: category } } }),
      },
      select: { id: true },
    });
  } catch (error) {
    console.error("[submissions] create failed", error);
    return {
      status: "error",
      message: "Something went wrong saving your suggestion. Please try again.",
      fieldErrors: {},
      values,
    };
  }

  return { status: "success" };
}
