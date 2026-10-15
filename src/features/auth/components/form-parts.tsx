"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "cn";

import { Button } from "@/components/ui/button";

/** Form building blocks shared by the sign-in, registration and profile forms. */

const control =
  "h-12 w-full rounded-md border border-input bg-white px-3.5 text-base text-navy placeholder:text-ink-muted aria-invalid:border-destructive";

export function TextField({
  id,
  label,
  hint,
  error,
  optional,
  className,
  ...input
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
} & React.ComponentProps<"input">) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
        {optional ? <span className="font-normal text-muted-foreground"> (optional)</span> : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="-mt-1 text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <input
        id={id}
        name={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={cn(control, className)}
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormAlert({ message, ref }: { message: string; ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm font-semibold text-destructive"
    >
      {message}
    </div>
  );
}

export function SubmitButton({ children, pendingLabel }: { children: React.ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="xl" disabled={pending} className="w-full">
      {pending ? <Loader2 aria-hidden data-icon="inline-start" className="animate-spin" /> : null}
      {pending ? pendingLabel : children}
    </Button>
  );
}
