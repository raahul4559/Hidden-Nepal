"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { createTripAction, type TripActionState } from "../actions";
import { TRIP_TITLE_MAX } from "../validation";

const initialState: TripActionState = { status: "idle" };

/** Creating a trip redirects straight to its planner page on success. */
export function NewTripForm() {
  const [state, formAction, pending] = useActionState(createTripAction, initialState);
  const error = state.status === "error" ? state.fieldErrors.title : undefined;
  const value = state.status === "error" ? (state.values.title ?? "") : "";

  return (
    <form action={formAction} noValidate className="space-y-3">
      <div className="grid gap-2">
        <label htmlFor="new-trip-title" className="text-sm font-semibold">
          Trip name
        </label>
        <input
          id="new-trip-title"
          name="title"
          required
          maxLength={TRIP_TITLE_MAX}
          defaultValue={value}
          placeholder="e.g. Kathmandu Valley in three days"
          aria-invalid={!!error}
          aria-describedby={error ? "new-trip-title-error" : undefined}
          className="h-12 w-full rounded-md border border-input bg-white px-3.5 text-base text-navy placeholder:text-ink-muted aria-invalid:border-destructive"
        />
        {error ? (
          <p id="new-trip-title-error" className="text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <Button type="submit" variant="accent" size="lg" disabled={pending}>
        {pending ? "Creating…" : "Start a trip"}
      </Button>

      {state.status === "error" && !error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
