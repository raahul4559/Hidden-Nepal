"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { updateTripAction, type TripActionState } from "../actions";
import { TRIP_NOTES_MAX, TRIP_TITLE_MAX } from "../validation";

const initialState: TripActionState = { status: "idle" };

export function TripDetailsForm({
  tripId,
  title,
  notes,
}: {
  tripId: string;
  title: string;
  notes: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateTripAction, initialState);
  const values = state.status === "error" ? state.values : undefined;
  const fieldErrors = state.status === "error" ? state.fieldErrors : {};

  return (
    <form action={formAction} noValidate className="space-y-4">
      <input type="hidden" name="id" value={tripId} />

      <div className="grid gap-2">
        <label htmlFor="trip-title" className="text-sm font-semibold">
          Trip name
        </label>
        <input
          id="trip-title"
          name="title"
          required
          maxLength={TRIP_TITLE_MAX}
          defaultValue={values?.title ?? title}
          aria-invalid={!!fieldErrors.title}
          aria-describedby={fieldErrors.title ? "trip-title-error" : undefined}
          className="h-12 w-full rounded-md border border-input bg-white px-3.5 text-base text-navy aria-invalid:border-destructive"
        />
        {fieldErrors.title ? (
          <p id="trip-title-error" className="text-sm font-medium text-destructive">
            {fieldErrors.title}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="trip-notes" className="text-sm font-semibold">
          Planning notes <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="trip-notes"
          name="notes"
          rows={6}
          maxLength={TRIP_NOTES_MAX}
          defaultValue={values?.notes ?? (notes ?? "")}
          aria-invalid={!!fieldErrors.notes}
          aria-describedby={fieldErrors.notes ? "trip-notes-error" : undefined}
          placeholder="Dates, budget, people travelling, things to book…"
          className="w-full rounded-md border border-input bg-white px-3.5 py-3 text-base text-navy aria-invalid:border-destructive"
        />
        {fieldErrors.notes ? (
          <p id="trip-notes-error" className="text-sm font-medium text-destructive">
            {fieldErrors.notes}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save details"}
        </Button>
        {state.status === "ok" ? (
          <p role="status" className="text-sm font-medium text-teal-button">
            {state.message}
          </p>
        ) : null}
      </div>

      {state.status === "error" && Object.keys(fieldErrors).length === 0 ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
