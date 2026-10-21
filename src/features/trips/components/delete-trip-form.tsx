"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { deleteTripAction, type TripActionState } from "../actions";

const initialState: TripActionState = { status: "idle" };

/** Deleting redirects to the trip list once the account-scoped delete succeeds. */
export function DeleteTripForm({ tripId, title }: { tripId: string; title: string }) {
  const [state, formAction, pending] = useActionState(deleteTripAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete “${title}” and all of its stops? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={tripId} />
      <Button type="submit" variant="destructive" size="lg" disabled={pending}>
        {pending ? "Deleting…" : "Delete trip"}
      </Button>
      {state.status === "error" ? (
        <p role="alert" className="mt-2 text-sm font-medium text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
