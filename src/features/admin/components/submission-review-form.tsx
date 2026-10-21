"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { SubmissionStatus } from "@/generated/prisma/enums";

import {
  type ReviewActionState,
  reviewSubmissionAction,
} from "../actions/submissions";
import { availableReviewIntents, REVIEW_OUTCOMES, type ReviewIntent } from "../submission-review";

const initialState: ReviewActionState = { status: "idle" };

function variantFor(intent: ReviewIntent) {
  if (intent === "approve") return "accent" as const;
  if (intent === "reject") return "destructive" as const;
  return "outline" as const;
}

/**
 * One form, one explanation field, one button per allowed decision. The
 * clicked button's `name="intent"` value becomes part of the submitted
 * FormData, so the server action knows which decision was chosen.
 */
export function SubmissionReviewForm({
  id,
  status,
}: {
  id: string;
  status: SubmissionStatus;
}) {
  const [state, formAction, pending] = useActionState(reviewSubmissionAction, initialState);
  const intents = availableReviewIntents(status);

  if (intents.length === 0) {
    return (
      <p className="rounded-md border border-border bg-white p-4 text-sm leading-relaxed text-ink-muted">
        This suggestion has been approved. The decision is final; creating and publishing a
        destination is a separate, verified editorial step.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-md border border-border bg-white p-5">
      <input type="hidden" name="id" value={id} />

      <div className="grid gap-2">
        <label htmlFor="explanation" className="text-sm font-semibold">
          Explanation
        </label>
        <p id="explanation-hint" className="-mt-1 text-sm leading-relaxed text-ink-muted">
          Required to reject or request changes. Stored with the decision and used when
          following up with the submitter.
        </p>
        <textarea
          id="explanation"
          name="explanation"
          rows={4}
          maxLength={1000}
          aria-describedby="explanation-hint"
          className="w-full rounded-md border border-input bg-white px-3.5 py-3 text-base text-navy"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {intents.map((intent) => (
          <Button
            key={intent}
            type="submit"
            name="intent"
            value={intent}
            variant={variantFor(intent)}
            size="sm"
            disabled={pending}
          >
            {REVIEW_OUTCOMES[intent].label}
          </Button>
        ))}
        {pending ? (
          <span role="status" className="text-sm text-ink-muted">
            Saving…
          </span>
        ) : null}
      </div>

      {state.status === "error" ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.message}
        </p>
      ) : null}
      {state.status === "ok" ? (
        <p role="status" className="text-sm font-medium text-teal-button">
          {state.message}
        </p>
      ) : null}

      <p className="text-xs leading-relaxed text-ink-muted">
        Approving records the decision only. It never publishes the place or creates a
        destination, so unverified suggestions cannot reach travellers.
      </p>
    </form>
  );
}
