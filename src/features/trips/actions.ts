"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/session";

import {
  addTripStop,
  createTrip,
  deleteTrip,
  removeTripStop,
  reorderTripStops,
  updateTrip,
  updateTripStop,
} from "./service";
import {
  addTripStopSchema,
  removeTripStopSchema,
  reorderTripStopsSchema,
  tripDetailsSchema,
  updateTripStopSchema,
  TRIP_LIMIT_PER_USER,
  TRIP_STOP_LIMIT,
} from "./validation";

/**
 * Trip mutations. Every action resolves the account from the session and the
 * service scopes each query by that account, so a forged trip id or stop id
 * simply resolves to "not found".
 */

export type TripActionState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | {
      status: "error";
      message: string;
      fieldErrors: Record<string, string>;
      /** Echoed back so the form keeps what the traveller typed. */
      values: Record<string, string>;
    };

/** For mutations invoked directly from a client component. */
export type TripActionResult =
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

const SIGN_IN_REQUIRED = "Please sign in to manage your trips.";

const STATE_ERROR = "Something went wrong. Please try again.";

function errorState(
  message: string,
  values: Record<string, string> = {},
  fieldErrors: Record<string, string> = {},
): TripActionState {
  return { status: "error", message, fieldErrors, values };
}

function mutationMessage(status: string): string {
  switch (status) {
    case "not_found":
      return "That trip wasn’t found.";
    case "stop_not_found":
      return "That stop has already been removed.";
    case "invalid_order":
      return "The stop order changed since this page loaded. Refresh and try again.";
    case "conflict":
      return "Another change was saved at the same time. Please try again.";
    case "destination_not_found":
      return "That destination is no longer available.";
    case "already_added":
      return "That place is already in this trip.";
    case "limit_reached":
      return `This trip already has the maximum of ${TRIP_STOP_LIMIT} stops.`;
    default:
      return STATE_ERROR;
  }
}

function revalidateTrip(tripId: string) {
  revalidatePath("/trips");
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/account");
}

function fieldErrorsFrom(issues: readonly { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "form");
    fieldErrors[field] ??= issue.message;
  }
  return fieldErrors;
}

export async function createTripAction(
  _previous: TripActionState,
  formData: FormData,
): Promise<TripActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState(SIGN_IN_REQUIRED);

  const title = String(formData.get("title") ?? "");
  const parsed = tripDetailsSchema.safeParse({
    id: "new",
    title,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    return errorState(
      "Please check the highlighted fields.",
      { title },
      fieldErrorsFrom(parsed.error.issues),
    );
  }

  let result;
  try {
    result = await createTrip(user, parsed.data.title);
  } catch (error) {
    console.error("[trips] create failed", error instanceof Error ? error.message : error);
    return errorState(STATE_ERROR, { title });
  }

  if (result.status === "limit_reached") {
    return errorState(
      `You’ve reached the limit of ${TRIP_LIMIT_PER_USER} saved trips. Delete one to start another.`,
      { title },
    );
  }

  revalidatePath("/trips");
  revalidatePath("/account");
  redirect(`/trips/${result.id}`);
}

export async function updateTripAction(
  _previous: TripActionState,
  formData: FormData,
): Promise<TripActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState(SIGN_IN_REQUIRED);

  const raw = {
    id: formData.get("id"),
    title: formData.get("title"),
    notes: formData.get("notes") ?? undefined,
  };
  const parsed = tripDetailsSchema.safeParse(raw);
  if (!parsed.success) {
    return errorState(
      "Please check the highlighted fields.",
      {
        title: String(raw.title ?? ""),
        notes: String(raw.notes ?? ""),
      },
      fieldErrorsFrom(parsed.error.issues),
    );
  }

  try {
    const result = await updateTrip(user, parsed.data.id, {
      title: parsed.data.title,
      notes: parsed.data.notes,
    });
    if (result.status !== "ok") return errorState(mutationMessage(result.status));
    revalidateTrip(parsed.data.id);
    return { status: "ok", message: "Trip details saved." };
  } catch (error) {
    console.error("[trips] update failed", error instanceof Error ? error.message : error);
    return errorState(STATE_ERROR);
  }
}

export async function deleteTripAction(
  _previous: TripActionState,
  formData: FormData,
): Promise<TripActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState(SIGN_IN_REQUIRED);

  const tripId = String(formData.get("id") ?? "");
  if (!tripId) return errorState("That trip wasn’t found.");

  let result;
  try {
    result = await deleteTrip(user, tripId);
  } catch (error) {
    console.error("[trips] delete failed", error instanceof Error ? error.message : error);
    return errorState(STATE_ERROR);
  }

  if (result.status !== "ok") return errorState(mutationMessage(result.status));

  revalidatePath("/trips");
  revalidatePath("/account");
  redirect("/trips");
}

export async function addTripStopAction(
  _previous: TripActionState,
  formData: FormData,
): Promise<TripActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState(SIGN_IN_REQUIRED);

  const raw = {
    tripId: formData.get("tripId"),
    slug: formData.get("slug"),
  };
  const parsed = addTripStopSchema.safeParse(raw);
  if (!parsed.success) {
    return errorState(
      "Choose a destination to add.",
      {},
      fieldErrorsFrom(parsed.error.issues),
    );
  }

  try {
    const result = await addTripStop(user, parsed.data.tripId, parsed.data.slug);
    if (result.status !== "ok") return errorState(mutationMessage(result.status));
    revalidateTrip(parsed.data.tripId);
    return { status: "ok", message: "Stop added to the end of your trip." };
  } catch (error) {
    console.error("[trips] add stop failed", error instanceof Error ? error.message : error);
    return errorState(STATE_ERROR);
  }
}

export async function removeTripStopAction(
  _previous: TripActionState,
  formData: FormData,
): Promise<TripActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState(SIGN_IN_REQUIRED);

  const parsed = removeTripStopSchema.safeParse({
    tripId: formData.get("tripId"),
    stopId: formData.get("stopId"),
  });
  if (!parsed.success) return errorState("That stop wasn’t found.");

  try {
    const result = await removeTripStop(user, parsed.data.tripId, parsed.data.stopId);
    if (result.status !== "ok") return errorState(mutationMessage(result.status));
    revalidateTrip(parsed.data.tripId);
    return { status: "ok", message: "Stop removed." };
  } catch (error) {
    console.error("[trips] remove stop failed", error instanceof Error ? error.message : error);
    return errorState(STATE_ERROR);
  }
}

/**
 * Stores the full stop order after an up/down move. The order arrives as one
 * `order` entry per stop and must be an exact permutation of the saved stops.
 */
export async function reorderTripStopsAction(
  _previous: TripActionState,
  formData: FormData,
): Promise<TripActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState(SIGN_IN_REQUIRED);

  const parsed = reorderTripStopsSchema.safeParse({
    tripId: formData.get("tripId"),
    order: formData.getAll("order"),
  });
  if (!parsed.success) {
    return errorState("That stop order wasn’t valid. Refresh and try again.");
  }

  try {
    const result = await reorderTripStops(user, parsed.data.tripId, parsed.data.order);
    if (result.status !== "ok") return errorState(mutationMessage(result.status));
    revalidateTrip(parsed.data.tripId);
    return { status: "ok", message: "Stop order saved." };
  } catch (error) {
    console.error("[trips] reorder failed", error instanceof Error ? error.message : error);
    return errorState(STATE_ERROR);
  }
}

export async function updateTripStopAction(
  _previous: TripActionState,
  formData: FormData,
): Promise<TripActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState(SIGN_IN_REQUIRED);

  const raw = {
    tripId: formData.get("tripId"),
    stopId: formData.get("stopId"),
    notes: formData.get("notes") ?? undefined,
    day: formData.get("day") ?? undefined,
  };
  const parsed = updateTripStopSchema.safeParse(raw);
  if (!parsed.success) {
    return errorState(
      "Please check the highlighted fields.",
      {
        notes: String(raw.notes ?? ""),
        day: String(raw.day ?? ""),
      },
      fieldErrorsFrom(parsed.error.issues),
    );
  }

  try {
    const result = await updateTripStop(user, parsed.data.tripId, parsed.data.stopId, {
      notes: parsed.data.notes,
      day: parsed.data.day,
    });
    if (result.status !== "ok") return errorState(mutationMessage(result.status));
    revalidateTrip(parsed.data.tripId);
    return { status: "ok", message: "Stop details saved." };
  } catch (error) {
    console.error("[trips] update stop failed", error instanceof Error ? error.message : error);
    return errorState(STATE_ERROR);
  }
}
