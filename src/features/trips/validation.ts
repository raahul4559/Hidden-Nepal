import { z } from "zod";

import { slugSchema } from "@/features/destinations/validation";

/** Limits keep a single account (or one trip) from growing without bound. */
export const TRIP_LIMIT_PER_USER = 20;
export const TRIP_STOP_LIMIT = 50;
export const TRIP_TITLE_MAX = 120;
export const TRIP_NOTES_MAX = 4000;
export const TRIP_STOP_NOTES_MAX = 2000;
export const TRIP_DAY_MAX = 60;

/** Empty form fields arrive as "": treat them as absent. */
const blankToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

export const tripIdSchema = z.string().trim().min(1, "Missing trip").max(64);
export const stopIdSchema = z.string().trim().min(1, "Missing stop").max(64);

export const tripTitleSchema = z
  .string({ error: "Give your trip a name" })
  .trim()
  .min(2, "Give your trip a name of at least 2 characters")
  .max(TRIP_TITLE_MAX, `Keep the name under ${TRIP_TITLE_MAX} characters`);

export const tripNotesSchema = z.preprocess(
  blankToUndefined,
  z
    .string()
    .trim()
    .max(TRIP_NOTES_MAX, `Keep notes under ${TRIP_NOTES_MAX} characters`)
    .optional(),
);

export const tripStopNotesSchema = z.preprocess(
  blankToUndefined,
  z
    .string()
    .trim()
    .max(TRIP_STOP_NOTES_MAX, `Keep stop notes under ${TRIP_STOP_NOTES_MAX} characters`)
    .optional(),
);

/** Optional day assignment: a whole number from 1 to 60, or blank. */
export const tripDaySchema = z.preprocess(
  blankToUndefined,
  z
    .string()
    .trim()
    .regex(/^\d{1,2}$/, "Use a whole day number, e.g. 2")
    .transform(Number)
    .refine((day) => day >= 1 && day <= TRIP_DAY_MAX, `Use a day between 1 and ${TRIP_DAY_MAX}`)
    .optional(),
);

/** Full stop order sent by the planner after a move. Must be a permutation. */
export const stopOrderSchema = z.array(stopIdSchema).max(TRIP_STOP_LIMIT);

export const tripDetailsSchema = z.object({
  id: tripIdSchema,
  title: tripTitleSchema,
  notes: tripNotesSchema,
});

export const addTripStopSchema = z.object({
  tripId: tripIdSchema,
  slug: slugSchema,
});

export const removeTripStopSchema = z.object({
  tripId: tripIdSchema,
  stopId: stopIdSchema,
});

export const reorderTripStopsSchema = z.object({
  tripId: tripIdSchema,
  order: stopOrderSchema,
});

export const updateTripStopSchema = z.object({
  tripId: tripIdSchema,
  stopId: stopIdSchema,
  notes: tripStopNotesSchema,
  day: tripDaySchema,
});

export type TripDetailsInput = z.output<typeof tripDetailsSchema>;
export type UpdateTripStopInput = z.output<typeof updateTripStopSchema>;
