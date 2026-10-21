"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { destinationHref } from "@/features/destinations/schemas";

import {
  removeTripStopAction,
  reorderTripStopsAction,
  updateTripStopAction,
  type TripActionState,
} from "../actions";
import { moveStop } from "../ordering";
import type { TripStopView } from "../service";
import { TRIP_DAY_MAX, TRIP_STOP_NOTES_MAX } from "../validation";

const initialState: TripActionState = { status: "idle" };

/** The full stop order is sent with every move; the server checks it exactly. */
function OrderFields({ tripId, order }: { tripId: string; order: readonly string[] }) {
  return (
    <>
      <input type="hidden" name="tripId" value={tripId} />
      {order.map((id) => (
        <input key={id} type="hidden" name="order" value={id} />
      ))}
    </>
  );
}

export function TripStopCard({
  tripId,
  stop,
  index,
  total,
  order,
}: {
  tripId: string;
  stop: TripStopView;
  index: number;
  total: number;
  /** Current order of every stop id, oldest position first. */
  order: readonly string[];
}) {
  const [notesState, notesAction, notesPending] = useActionState(
    updateTripStopAction,
    initialState,
  );
  const [reorderState, reorderAction, reorderPending] = useActionState(
    reorderTripStopsAction,
    initialState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeTripStopAction,
    initialState,
  );

  const upOrder = moveStop(order, stop.id, "up") ?? [...order];
  const downOrder = moveStop(order, stop.id, "down") ?? [...order];
  const values = notesState.status === "error" ? notesState.values : undefined;
  const fieldErrors = notesState.status === "error" ? notesState.fieldErrors : {};

  return (
    <li className="rounded-md border border-border bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
            Stop {index + 1} of {total}
            {stop.day ? <span className="ml-2 text-himalaya">Day {stop.day}</span> : null}
          </p>
          <h3 className="mt-1 font-serif text-2xl text-navy">
            {stop.destinationSlug ? (
              <Link
                href={destinationHref(stop.destinationSlug)}
                className="underline-offset-4 hover:underline"
              >
                {stop.destinationName}
              </Link>
            ) : (
              stop.destinationName
            )}
          </h3>
          <p className="mt-1 text-sm text-ink-muted">
            {stop.regionName ?? "Region not recorded"}
            {stop.destinationSlug ? null : " · no longer in the catalogue"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <form action={reorderAction}>
            <OrderFields tripId={tripId} order={upOrder} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={index === 0 || reorderPending}
              aria-label={`Move ${stop.destinationName} up`}
            >
              ↑ Up
            </Button>
          </form>
          <form action={reorderAction}>
            <OrderFields tripId={tripId} order={downOrder} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={index === total - 1 || reorderPending}
              aria-label={`Move ${stop.destinationName} down`}
            >
              ↓ Down
            </Button>
          </form>
        </div>
      </div>

      {reorderState.status === "error" ? (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {reorderState.message}
        </p>
      ) : null}
      {reorderState.status === "ok" ? (
        <p role="status" className="mt-3 text-sm font-medium text-teal-button">
          {reorderState.message}
        </p>
      ) : null}

      <form action={notesAction} noValidate className="mt-5 grid gap-3 border-t border-border pt-5">
        <input type="hidden" name="tripId" value={tripId} />
        <input type="hidden" name="stopId" value={stop.id} />

        <div className="grid gap-2">
          <label htmlFor={`stop-notes-${stop.id}`} className="text-sm font-semibold">
            Notes for this stop <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id={`stop-notes-${stop.id}`}
            name="notes"
            rows={3}
            maxLength={TRIP_STOP_NOTES_MAX}
            defaultValue={values?.notes ?? (stop.notes ?? "")}
            aria-invalid={!!fieldErrors.notes}
            aria-describedby={fieldErrors.notes ? `stop-notes-error-${stop.id}` : undefined}
            placeholder="What to see, where to stay, opening hours…"
            className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-base text-navy aria-invalid:border-destructive"
          />
          {fieldErrors.notes ? (
            <p
              id={`stop-notes-error-${stop.id}`}
              className="text-sm font-medium text-destructive"
            >
              {fieldErrors.notes}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="grid w-32 gap-2">
            <label htmlFor={`stop-day-${stop.id}`} className="text-sm font-semibold">
              Day <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id={`stop-day-${stop.id}`}
              name="day"
              type="number"
              inputMode="numeric"
              min={1}
              max={TRIP_DAY_MAX}
              defaultValue={values?.day ?? (stop.day ?? "")}
              aria-invalid={!!fieldErrors.day}
              aria-describedby={fieldErrors.day ? `stop-day-error-${stop.id}` : undefined}
              className="h-11 w-full rounded-md border border-input bg-white px-3.5 text-base text-navy aria-invalid:border-destructive"
            />
            {fieldErrors.day ? (
              <p id={`stop-day-error-${stop.id}`} className="text-sm font-medium text-destructive">
                {fieldErrors.day}
              </p>
            ) : null}
          </div>

          <Button type="submit" size="default" disabled={notesPending}>
            {notesPending ? "Saving…" : "Save stop"}
          </Button>

          {notesState.status === "ok" ? (
            <p role="status" className="text-sm font-medium text-teal-button">
              {notesState.message}
            </p>
          ) : null}
        </div>

        {notesState.status === "error" &&
        Object.keys(fieldErrors).length === 0 ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {notesState.message}
          </p>
        ) : null}
      </form>

      <form
        action={removeAction}
        className="mt-4"
        onSubmit={(event) => {
          if (!window.confirm(`Remove ${stop.destinationName} from this trip?`)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="tripId" value={tripId} />
        <input type="hidden" name="stopId" value={stop.id} />
        <Button type="submit" variant="destructive" size="sm" disabled={removePending}>
          {removePending ? "Removing…" : "Remove stop"}
        </Button>
        {removeState.status === "error" ? (
          <p role="alert" className="mt-2 text-sm font-medium text-destructive">
            {removeState.message}
          </p>
        ) : null}
      </form>
    </li>
  );
}
