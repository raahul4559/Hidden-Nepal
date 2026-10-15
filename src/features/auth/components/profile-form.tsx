"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { type FormState, updateProfile } from "../actions";
import type { ProfileField } from "../validation";
import { TextField } from "./form-parts";

const initialState: FormState<ProfileField> = { status: "idle" };

export function ProfileForm({ name }: { name: string | null }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const value = state.status === "error" ? state.values.name : (name ?? "");

  return (
    <form action={formAction} noValidate className="space-y-4">
      <TextField
        id="name"
        label="Display name"
        optional
        autoComplete="name"
        maxLength={80}
        defaultValue={value}
        error={state.status === "error" ? (state.fieldErrors.name ?? state.message) : undefined}
      />
      <div className="flex items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
        {state.status === "success" ? (
          <p role="status" className="text-sm font-medium text-navy">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
