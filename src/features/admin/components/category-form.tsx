"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { updateCategoryAction, type CategoryActionState } from "../actions/categories";
import type { AdminCategoryRow } from "../categories";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-white px-2.5 text-sm text-navy outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20";
const textareaClass =
  "w-full rounded-md border border-input bg-white px-2.5 py-2 text-sm text-navy outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20";

export function CategoryForm({ category }: { category: AdminCategoryRow }) {
  const [state, formAction, pending] = useActionState(updateCategoryAction, {
    status: "idle",
  } satisfies CategoryActionState);
  const errors = state.status === "error" ? state.fieldErrors : {};

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={category.id} />
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-navy">Name</span>
          <input name="name" required defaultValue={category.name} className={inputClass} />
          {errors.name ? <p className="mt-1 text-xs text-destructive">{errors.name}</p> : null}
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-navy">Sort order</span>
          <input
            name="sortOrder"
            type="number"
            min={0}
            max={999}
            required
            defaultValue={category.sortOrder}
            className={inputClass}
          />
          {errors.sortOrder ? (
            <p className="mt-1 text-xs text-destructive">{errors.sortOrder}</p>
          ) : null}
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-navy">Description</span>
        <textarea
          name="description"
          required
          rows={2}
          defaultValue={category.description}
          className={textareaClass}
        />
        {errors.description ? (
          <p className="mt-1 text-xs text-destructive">{errors.description}</p>
        ) : null}
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="default" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save category"}
        </Button>
        {state.status !== "idle" ? (
          <span
            role={state.status === "error" ? "alert" : "status"}
            className={
              "text-sm " + (state.status === "error" ? "text-destructive" : "text-teal-button")
            }
          >
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
