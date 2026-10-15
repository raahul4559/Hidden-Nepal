"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useActionState } from "react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";

import { type SaveState, toggleSavedDestination } from "../actions";

/** Save/unsave button. Works without JavaScript (plain form POST). */
export function SaveToggle({
  slug,
  initiallySaved,
  tone = "dark",
}: {
  slug: string;
  initiallySaved: boolean;
  /** "dark" sits on the navy destination hero; "light" on white surfaces. */
  tone?: "dark" | "light";
}) {
  const [state, formAction, pending] = useActionState(toggleSavedDestination, {
    status: "idle",
    saved: initiallySaved,
  } satisfies SaveState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="intent" value={state.saved ? "remove" : "save"} />
      <Button
        type="submit"
        variant="outline"
        size="lg"
        disabled={pending}
        aria-pressed={state.saved}
        className={cn(
          tone === "dark" && "border-ivory/35 bg-transparent text-ivory hover:border-gold hover:bg-ivory/10 hover:text-ivory",
        )}
      >
        {state.saved ? (
          <BookmarkCheck aria-hidden data-icon="inline-start" className={cn(tone === "dark" && "text-gold")} />
        ) : (
          <Bookmark aria-hidden data-icon="inline-start" />
        )}
        {state.saved ? "Saved" : "Save destination"}
      </Button>
      {state.status === "error" ? (
        <p role="alert" className={cn("text-sm font-medium", tone === "dark" ? "text-ivory" : "text-destructive")}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
