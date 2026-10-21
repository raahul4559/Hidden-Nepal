"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { PublishStatus } from "@/generated/prisma/enums";

import {
  createGuideAction,
  updateGuideAction,
  type GuideFormState,
} from "../actions/guides";

export type GuideFormValues = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  status: PublishStatus;
};

export const EMPTY_GUIDE: GuideFormValues = {
  slug: "",
  title: "",
  excerpt: null,
  body: "",
  status: PublishStatus.DRAFT,
};

const STATUS_LABELS: Record<PublishStatus, string> = {
  DRAFT: "Draft — admins only",
  PUBLISHED: "Published — public",
  ARCHIVED: "Archived — hidden",
};

const inputClass =
  "h-9 w-full rounded-md border border-input bg-white px-2.5 text-sm text-navy outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20";
const textareaClass =
  "w-full rounded-md border border-input bg-white px-2.5 py-2 text-sm text-navy outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20";

export function GuideForm({
  mode,
  values,
}: {
  mode: "create" | "edit";
  values: GuideFormValues;
}) {
  const action = mode === "create" ? createGuideAction : updateGuideAction;
  const [state, formAction, pending] = useActionState(action, {
    status: "idle",
  } satisfies GuideFormState);
  const errors = state.status === "error" ? state.fieldErrors : {};

  return (
    <form action={formAction} className="space-y-5">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      {state.status === "error" ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-md border border-border bg-white p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-navy">
            Title
          </label>
          <input id="title" name="title" required defaultValue={values.title} className={inputClass} />
          {errors.title ? <p className="mt-1 text-xs text-destructive">{errors.title}</p> : null}
        </div>

        <div>
          <label htmlFor="slug" className="mb-1 block text-sm font-medium text-navy">
            Slug
          </label>
          <input id="slug" name="slug" required defaultValue={values.slug} className={inputClass} />
          {errors.slug ? (
            <p className="mt-1 text-xs text-destructive">{errors.slug}</p>
          ) : (
            <p className="mt-1 text-xs text-ink-muted">Unique, lowercase, hyphenated.</p>
          )}
        </div>

        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-navy">
            Status
          </label>
          <select id="status" name="status" defaultValue={values.status} className={inputClass}>
            {Object.values(PublishStatus).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          {errors.status ? <p className="mt-1 text-xs text-destructive">{errors.status}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="excerpt" className="mb-1 block text-sm font-medium text-navy">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows={3}
            defaultValue={values.excerpt ?? ""}
            maxLength={320}
            className={textareaClass}
            placeholder="One or two sentences for the guide index and social previews."
          />
          {errors.excerpt ? <p className="mt-1 text-xs text-destructive">{errors.excerpt}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="body" className="mb-1 block text-sm font-medium text-navy">
            Body
          </label>
          <textarea
            id="body"
            name="body"
            required
            rows={18}
            defaultValue={values.body}
            className={textareaClass}
            placeholder="Plain text. Leave a blank line between paragraphs."
          />
          {errors.body ? (
            <p className="mt-1 text-xs text-destructive">{errors.body}</p>
          ) : (
            <p className="mt-1 text-xs text-ink-muted">
              Plain text with blank lines between paragraphs. No HTML is rendered.
            </p>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="accent" size="lg" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create guide" : "Save changes"}
        </Button>
        <LinkButton href="/admin/guides" variant="outline" size="lg">
          Cancel
        </LinkButton>
        {values.id ? (
          <Link
            href={`/admin/guides/${values.id}/preview`}
            className="text-sm font-medium text-himalaya underline-offset-4 hover:underline"
          >
            Preview this version
          </Link>
        ) : null}
      </div>
    </form>
  );
}
