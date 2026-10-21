"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { addTripStopAction, type TripActionState } from "../actions";
import type { TripDestinationOption } from "../service";

const initialState: TripActionState = { status: "idle" };

/**
 * Adds a published destination to the end of the trip. The options are
 * filtered by the page to exclude places already in this trip.
 */
export function AddStopForm({
  tripId,
  options,
}: {
  tripId: string;
  options: TripDestinationOption[];
}) {
  const [state, formAction, pending] = useActionState(addTripStopAction, initialState);
  const error = state.status === "error" ? state.fieldErrors.slug : undefined;

  if (options.length === 0) {
    return (
      <p className="rounded-md border border-border bg-white p-4 text-sm text-ink-muted">
        Every available destination is already in this trip. Explore the catalogue to find more
        places.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="tripId" value={tripId} />
      <div className="grid gap-2">
        <label htmlFor="add-stop-slug" className="text-sm font-semibold">
          Add a destination
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            id="add-stop-slug"
            name="slug"
            required
            defaultValue=""
            aria-invalid={!!error}
            aria-describedby={error ? "add-stop-error" : undefined}
            className="h-12 w-full rounded-md border border-input bg-white px-3.5 text-base text-navy aria-invalid:border-destructive"
          >
            <option value="" disabled>
              Choose a place…
            </option>
            {options.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.name} · {option.regionName}
              </option>
            ))}
          </select>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Adding…" : "Add stop"}
          </Button>
        </div>
        {error ? (
          <p id="add-stop-error" className="text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      {state.status === "ok" ? (
        <p role="status" className="text-sm font-medium text-teal-button">
          {state.message}
        </p>
      ) : null}
      {state.status === "error" && !error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
