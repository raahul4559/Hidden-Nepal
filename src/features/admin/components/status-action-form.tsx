"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

export type StatusState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

type Action = (previous: StatusState, formData: FormData) => Promise<StatusState>;

export function StatusActionForm({
  id,
  intent,
  label,
  action,
  confirmMessage,
  variant = "outline",
  showMessage = true,
}: {
  id: string;
  intent: string;
  label: string;
  action: Action;
  confirmMessage?: string;
  variant?: "outline" | "ghost" | "destructive" | "default" | "accent";
  showMessage?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });

  return (
    <form
      action={formAction}
      className="inline-flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="intent" value={intent} />
      <Button type="submit" variant={variant} size="sm" disabled={pending}>
        {pending ? "Working…" : label}
      </Button>
      {showMessage && state.status !== "idle" ? (
        <span
          role={state.status === "error" ? "alert" : "status"}
          className={
            "text-xs " + (state.status === "error" ? "text-destructive" : "text-ink-muted")
          }
        >
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
