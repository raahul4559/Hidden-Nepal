"use client";

import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { CATEGORIES } from "@/features/experiences/categories";
import { PROVINCES } from "@/features/regions/provinces";

import { type SubmissionFormState, submitPlace, type SubmissionFieldError } from "../actions";
import { HONEYPOT_FIELD } from "../validation";

const initialState: SubmissionFormState = { status: "idle" };

const control =
  "w-full rounded-md border border-input bg-white px-3.5 text-base text-navy placeholder:text-ink-muted aria-invalid:border-destructive";

export function PlaceSubmissionForm() {
  const [state, formAction] = useActionState(submitPlace, initialState);
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "error") summaryRef.current?.focus();
    if (state.status === "success") successRef.current?.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="rounded-md border border-teal/50 bg-white p-8 sm:p-10"
      >
        <CheckCircle2 aria-hidden className="size-8 text-teal" />
        <h2 className="mt-5 font-serif text-3xl">Thank you. We’ve received your suggestion.</h2>
        <p className="mt-3 max-w-prose leading-relaxed text-muted-foreground">
          An editor will look into it. If it’s a good fit, we’ll research it
          carefully, and if you left an email we may contact you with
          questions. Nothing is published without being checked.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="/explore" size="lg">
            Explore destinations
          </LinkButton>
          <LinkButton href="/" variant="outline" size="lg">
            Back to home
          </LinkButton>
        </div>
      </div>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors : {};
  const values = state.status === "error" ? state.values : {};
  const errorFor = (field: SubmissionFieldError) => errors[field];
  const describedBy = (field: SubmissionFieldError, hint?: boolean) =>
    [hint && `${field}-hint`, errors[field] && `${field}-error`].filter(Boolean).join(" ") || undefined;

  return (
    // Remount after each failed attempt so defaultValues reflect what was sent.
    <form
      key={state.status === "error" ? JSON.stringify(values) : "fresh"}
      action={formAction}
      noValidate
      className="space-y-7"
    >
      {state.status === "error" ? (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm"
        >
          <p className="font-semibold text-destructive">{state.message}</p>
          {Object.keys(errors).length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-navy">
              {Object.entries(errors).map(([field, message]) => (
                <li key={field}>
                  <a href={`#${field}`} className="underline underline-offset-2">
                    {message}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {/* Honeypot: hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <Field id="placeName" label="Name of the place" required error={errorFor("placeName")}>
        <input
          id="placeName"
          name="placeName"
          required
          maxLength={120}
          defaultValue={values.placeName}
          aria-invalid={!!errorFor("placeName")}
          aria-describedby={describedBy("placeName")}
          className={cn(control, "h-12")}
        />
      </Field>

      <div className="grid gap-7 sm:grid-cols-2">
        <Field id="region" label="Province" error={errorFor("region")}>
          <SelectShell>
            <select
              id="region"
              name="region"
              defaultValue={values.region ?? ""}
              aria-invalid={!!errorFor("region")}
              aria-describedby={describedBy("region")}
              className={cn(control, "h-12 appearance-none pr-10")}
            >
              <option value="">Not sure</option>
              {PROVINCES.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </SelectShell>
        </Field>

        <Field
          id="district"
          label="District"
          hint="So we can find it. Leave blank if you’re not sure."
          error={errorFor("district")}
        >
          <input
            id="district"
            name="district"
            maxLength={80}
            defaultValue={values.district}
            aria-invalid={!!errorFor("district")}
            aria-describedby={describedBy("district", true)}
            className={cn(control, "h-12")}
          />
        </Field>
      </div>

      <div className="grid gap-7 sm:grid-cols-2">
        <Field id="category" label="Type of experience" error={errorFor("category")}>
          <SelectShell>
            <select
              id="category"
              name="category"
              defaultValue={values.category ?? ""}
              aria-invalid={!!errorFor("category")}
              aria-describedby={describedBy("category")}
              className={cn(control, "h-12 appearance-none pr-10")}
            >
              <option value="">Not sure</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </SelectShell>
        </Field>

        <Field
          id="locationDetails"
          label="Where is it?"
          hint="District, nearest village or town, or how you get there."
          error={errorFor("locationDetails")}
        >
          <input
            id="locationDetails"
            name="locationDetails"
            maxLength={200}
            defaultValue={values.locationDetails}
            aria-invalid={!!errorFor("locationDetails")}
            aria-describedby={describedBy("locationDetails", true)}
            className={cn(control, "h-12")}
          />
        </Field>
      </div>

      <Field
        id="description"
        label="Why should travellers know about it?"
        hint="What makes it special, when you went, anything visitors should be careful about. At least 30 characters."
        required
        error={errorFor("description")}
      >
        <textarea
          id="description"
          name="description"
          required
          minLength={30}
          maxLength={3000}
          rows={6}
          defaultValue={values.description}
          aria-invalid={!!errorFor("description")}
          aria-describedby={describedBy("description", true)}
          className={cn(control, "py-3 leading-relaxed")}
        />
      </Field>

      <fieldset className="grid gap-7 border-t border-border pt-7 sm:grid-cols-2">
        <legend className="sr-only">Approximate location (optional)</legend>
        <Field
          id="latitude"
          label="Latitude"
          optional
          hint="Decimal degrees, e.g. 28.2094. Add both coordinates or neither."
          error={errorFor("latitude")}
        >
          <input
            id="latitude"
            name="latitude"
            inputMode="decimal"
            maxLength={12}
            defaultValue={values.latitude}
            aria-invalid={!!errorFor("latitude")}
            aria-describedby={describedBy("latitude", true)}
            className={cn(control, "h-12")}
          />
        </Field>
        <Field
          id="longitude"
          label="Longitude"
          optional
          hint="Decimal degrees, e.g. 83.9716."
          error={errorFor("longitude")}
        >
          <input
            id="longitude"
            name="longitude"
            inputMode="decimal"
            maxLength={12}
            defaultValue={values.longitude}
            aria-invalid={!!errorFor("longitude")}
            aria-describedby={describedBy("longitude", true)}
            className={cn(control, "h-12")}
          />
        </Field>
      </fieldset>

      <fieldset className="grid gap-7 border-t border-border pt-7 sm:grid-cols-2">
        <legend className="sr-only">Photo (optional)</legend>
        <Field
          id="image"
          label="Upload a photo"
          optional
          hint="JPEG, PNG, WebP or AVIF up to 8 MB. Every file is checked before it is stored."
          error={errorFor("image")}
        >
          <input
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            aria-invalid={!!errorFor("image")}
            aria-describedby={describedBy("image", true)}
            className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ivory"
          />
        </Field>
        <Field
          id="imageAlt"
          label="Describe the photo"
          optional
          hint="What does it show? Used as alt text if we publish the photo."
          error={errorFor("imageAlt")}
        >
          <input
            id="imageAlt"
            name="imageAlt"
            maxLength={200}
            defaultValue={values.imageAlt}
            aria-invalid={!!errorFor("imageAlt")}
            aria-describedby={describedBy("imageAlt", true)}
            className={cn(control, "h-12")}
          />
        </Field>
      </fieldset>

      <fieldset className="grid gap-7 border-t border-border pt-7 sm:grid-cols-2">
        <legend className="sr-only">About you (optional)</legend>
        <Field id="submitterName" label="Your name" optional error={errorFor("submitterName")}>
          <input
            id="submitterName"
            name="submitterName"
            maxLength={80}
            autoComplete="name"
            defaultValue={values.submitterName}
            aria-invalid={!!errorFor("submitterName")}
            aria-describedby={describedBy("submitterName")}
            className={cn(control, "h-12")}
          />
        </Field>
        <Field
          id="submitterEmail"
          label="Email"
          optional
          hint="Only used to ask follow-up questions about this place."
          error={errorFor("submitterEmail")}
        >
          <input
            id="submitterEmail"
            name="submitterEmail"
            type="email"
            maxLength={254}
            autoComplete="email"
            defaultValue={values.submitterEmail}
            aria-invalid={!!errorFor("submitterEmail")}
            aria-describedby={describedBy("submitterEmail", true)}
            className={cn(control, "h-12")}
          />
        </Field>
      </fieldset>

      <div>
        <div className="flex items-start gap-3">
          <input
            id="consentToShare"
            name="consentToShare"
            type="checkbox"
            required
            aria-invalid={!!errorFor("consentToShare")}
            aria-describedby={describedBy("consentToShare")}
            className="mt-1 size-5 shrink-0 accent-navy"
          />
          <label htmlFor="consentToShare" className="text-sm leading-relaxed">
            I wrote this myself, and Hidden Nepal may use it to research and
            write about this place.
          </label>
        </div>
        <FieldError id="consentToShare" message={errorFor("consentToShare")} />
      </div>

      <SubmitButton />
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  required,
  optional,
  children,
}: {
  id: SubmissionFieldError;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
        {required ? <span className="text-destructive" aria-hidden> *</span> : null}
        {optional ? <span className="font-normal text-muted-foreground"> (optional)</span> : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="-mt-1 text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {children}
      <FieldError id={id} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className="text-sm font-medium text-destructive">
      {message}
    </p>
  );
}

function SelectShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
      />
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="xl" disabled={pending} className="w-full sm:w-auto">
      {pending ? <Loader2 aria-hidden data-icon="inline-start" className="animate-spin" /> : null}
      {pending ? "Sending…" : "Send suggestion"}
    </Button>
  );
}
