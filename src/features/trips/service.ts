import "server-only";

import type { CurrentUser } from "@/features/auth/session";
import { getDb } from "@/lib/db";

import { applyStopOrder } from "./ordering";
import { TRIP_LIMIT_PER_USER, TRIP_STOP_LIMIT } from "./validation";

/**
 * Saved itineraries. Every function takes the user resolved from the session
 * and scopes its query by that user's id, so one account can never read or
 * change another account's trips. The service has no React or Next.js imports:
 * a future AI planner or map API can call the same functions.
 */

function db() {
  const client = getDb();
  if (!client) throw new Error("Database not configured");
  return client;
}

type Transaction = Parameters<Parameters<ReturnType<typeof db>["$transaction"]>[0]>[0];

export type TripSummary = {
  id: string;
  title: string;
  stopCount: number;
  updatedAt: Date;
};

export type TripStopView = {
  id: string;
  position: number;
  day: number | null;
  notes: string | null;
  destinationName: string;
  destinationSlug: string | null;
  regionName: string | null;
  summary: string | null;
  /** Ready for a future map layer; null when the place has no coordinates. */
  latitude: number | null;
  longitude: number | null;
};

export type TripView = {
  id: string;
  title: string;
  notes: string | null;
  visibility: "PRIVATE" | "PUBLIC";
  updatedAt: Date;
  stops: TripStopView[];
};

export type TripMutationResult =
  | { status: "ok" }
  | { status: "not_found" }
  | { status: "stop_not_found" }
  | { status: "invalid_order" }
  | { status: "conflict" };

export type TripDestinationOption = {
  slug: string;
  name: string;
  regionName: string;
};

const TRIP_SUMMARY_TAKE = 50;

export async function listTrips(user: CurrentUser): Promise<TripSummary[]> {
  const rows = await db().trip.findMany({
    where: { userId: user.id },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    take: TRIP_SUMMARY_TAKE,
    select: {
      id: true,
      title: true,
      updatedAt: true,
      _count: { select: { stops: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    stopCount: row._count.stops,
    updatedAt: row.updatedAt,
  }));
}

/** Ownership is part of the query: a trip id alone never grants access. */
export async function getTrip(
  user: CurrentUser,
  tripId: string,
): Promise<{ status: "ok"; trip: TripView } | { status: "not_found" }> {
  const row = await db().trip.findFirst({
    where: { id: tripId, userId: user.id },
    select: {
      id: true,
      title: true,
      notes: true,
      visibility: true,
      updatedAt: true,
      stops: {
        orderBy: [{ position: "asc" }, { id: "asc" }],
        select: {
          id: true,
          position: true,
          day: true,
          notes: true,
          destinationName: true,
          destination: {
            select: {
              slug: true,
              summary: true,
              latitude: true,
              longitude: true,
              region: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!row) return { status: "not_found" };

  return {
    status: "ok",
    trip: {
      id: row.id,
      title: row.title,
      notes: row.notes,
      visibility: row.visibility,
      updatedAt: row.updatedAt,
      stops: row.stops.map((stop) => ({
        id: stop.id,
        position: stop.position,
        day: stop.day,
        notes: stop.notes,
        destinationName: stop.destinationName,
        destinationSlug: stop.destination?.slug ?? null,
        regionName: stop.destination?.region.name ?? null,
        summary: stop.destination?.summary ?? null,
        latitude:
          stop.destination?.latitude != null ? Number(stop.destination.latitude) : null,
        longitude:
          stop.destination?.longitude != null ? Number(stop.destination.longitude) : null,
      })),
    },
  };
}

export async function listTripDestinationOptions(): Promise<TripDestinationOption[]> {
  const rows = await db().destination.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ name: "asc" }],
    take: 500,
    select: { slug: true, name: true, region: { select: { name: true } } },
  });

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    regionName: row.region.name,
  }));
}

export async function createTrip(
  user: CurrentUser,
  title: string,
): Promise<{ status: "ok"; id: string } | { status: "limit_reached" }> {
  const count = await db().trip.count({ where: { userId: user.id } });
  if (count >= TRIP_LIMIT_PER_USER) return { status: "limit_reached" };

  const trip = await db().trip.create({
    data: { userId: user.id, title },
    select: { id: true },
  });
  return { status: "ok", id: trip.id };
}

/** Renames a trip and replaces its planning notes in one step. */
export async function updateTrip(
  user: CurrentUser,
  tripId: string,
  input: { title: string; notes?: string },
): Promise<TripMutationResult> {
  const { count } = await db().trip.updateMany({
    where: { id: tripId, userId: user.id },
    data: { title: input.title, notes: input.notes ?? null },
  });
  return count > 0 ? { status: "ok" } : { status: "not_found" };
}

export async function deleteTrip(user: CurrentUser, tripId: string): Promise<TripMutationResult> {
  const { count } = await db().trip.deleteMany({
    where: { id: tripId, userId: user.id },
  });
  return count > 0 ? { status: "ok" } : { status: "not_found" };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

/**
 * Positions are unique per trip. Move every row through a high temporary
 * range first so a reorder never collides with an occupied position.
 */
async function writeStopPositions(tx: Transaction, ids: readonly string[]) {
  for (const [index, id] of ids.entries()) {
    await tx.tripStop.update({ where: { id }, data: { position: 100_000 + index } });
  }
  for (const [index, id] of ids.entries()) {
    await tx.tripStop.update({ where: { id }, data: { position: index } });
  }
}

async function touchTrip(tx: Transaction, tripId: string, userId: string) {
  await tx.trip.updateMany({
    where: { id: tripId, userId },
    data: { updatedAt: new Date() },
  });
}

/** Adds a published destination as the last stop. Duplicates are rejected. */
export async function addTripStop(
  user: CurrentUser,
  tripId: string,
  slug: string,
): Promise<
  | { status: "ok"; stopId: string }
  | { status: "not_found" }
  | { status: "destination_not_found" }
  | { status: "already_added" }
  | { status: "limit_reached" }
  | { status: "conflict" }
> {
  const client = db();
  const trip = await client.trip.findFirst({
    where: { id: tripId, userId: user.id },
    select: { id: true },
  });
  if (!trip) return { status: "not_found" };

  const destination = await client.destination.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, name: true },
  });
  if (!destination) return { status: "destination_not_found" };

  try {
    return await client.$transaction(async (tx) => {
      const stops = await tx.tripStop.findMany({
        where: { tripId },
        orderBy: [{ position: "asc" }, { id: "asc" }],
        select: { destinationId: true },
      });
      if (stops.some((stop) => stop.destinationId === destination.id)) {
        return { status: "already_added" as const };
      }
      if (stops.length >= TRIP_STOP_LIMIT) return { status: "limit_reached" as const };

      const stop = await tx.tripStop.create({
        data: {
          tripId,
          destinationId: destination.id,
          // Snapshot: the stop stays readable if the destination is removed.
          destinationName: destination.name,
          position: stops.length,
        },
        select: { id: true },
      });
      await touchTrip(tx, tripId, user.id);
      return { status: "ok" as const, stopId: stop.id };
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    // A concurrent request inserted the same place (or the last position).
    const duplicate = await client.tripStop.count({
      where: { tripId, destinationId: destination.id },
    });
    return duplicate > 0 ? { status: "already_added" } : { status: "conflict" };
  }
}

/** Removes a stop and closes the gap so positions stay 0..n-1. */
export async function removeTripStop(
  user: CurrentUser,
  tripId: string,
  stopId: string,
): Promise<TripMutationResult> {
  return db().$transaction(async (tx) => {
    const trip = await tx.trip.findFirst({
      where: { id: tripId, userId: user.id },
      select: { id: true },
    });
    if (!trip) return { status: "not_found" as const };

    const deleted = await tx.tripStop.deleteMany({ where: { id: stopId, tripId } });
    if (deleted.count === 0) return { status: "stop_not_found" as const };

    const remaining = await tx.tripStop.findMany({
      where: { tripId },
      orderBy: [{ position: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    await writeStopPositions(
      tx,
      remaining.map((stop) => stop.id),
    );
    await touchTrip(tx, tripId, user.id);
    return { status: "ok" as const };
  });
}

/**
 * Stores a new full order for a trip's stops. `applyStopOrder` refuses
 * anything that is not exactly the current set of stop ids.
 */
export async function reorderTripStops(
  user: CurrentUser,
  tripId: string,
  requestedIds: readonly string[],
): Promise<TripMutationResult> {
  return db().$transaction(async (tx) => {
    const trip = await tx.trip.findFirst({
      where: { id: tripId, userId: user.id },
      select: { id: true },
    });
    if (!trip) return { status: "not_found" as const };

    const stops = await tx.tripStop.findMany({
      where: { tripId },
      orderBy: [{ position: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    const order = applyStopOrder(
      stops.map((stop) => stop.id),
      requestedIds,
    );
    if (!order.ok) return { status: "invalid_order" as const };

    await writeStopPositions(tx, order.ids);
    await touchTrip(tx, tripId, user.id);
    return { status: "ok" as const };
  });
}

/** Updates a single stop's notes and optional day assignment. */
export async function updateTripStop(
  user: CurrentUser,
  tripId: string,
  stopId: string,
  input: { notes?: string; day?: number },
): Promise<TripMutationResult> {
  return db().$transaction(async (tx) => {
    const trip = await tx.trip.findFirst({
      where: { id: tripId, userId: user.id },
      select: { id: true },
    });
    if (!trip) return { status: "not_found" as const };

    const { count } = await tx.tripStop.updateMany({
      where: { id: stopId, tripId },
      data: { notes: input.notes ?? null, day: input.day ?? null },
    });
    if (count === 0) return { status: "stop_not_found" as const };

    await touchTrip(tx, tripId, user.id);
    return { status: "ok" as const };
  });
}
