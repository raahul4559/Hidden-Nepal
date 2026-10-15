"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import { type FormState, register } from "../actions";
import { PASSWORD_MIN, type RegisterField } from "../validation";
import { FormAlert, SubmitButton, TextField } from "./form-parts";

const initialState: FormState<RegisterField> = { status: "idle" };

export function RegisterForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(register, initialState);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "error") alertRef.current?.focus();
  }, [state]);

  const errors = state.status === "error" ? state.fieldErrors : {};
  const values = state.status === "error" ? state.values : {};

  return (
    <form
      key={state.status === "error" ? JSON.stringify(state) : "fresh"}
      action={formAction}
      noValidate
      className="space-y-6"
    >
      {state.status === "error" ? <FormAlert ref={alertRef} message={state.message} /> : null}

      <input type="hidden" name="next" value={next} />
      <TextField
        id="name"
        label="Name"
        optional
        autoComplete="name"
        maxLength={80}
        defaultValue={values.name}
        error={errors.name}
      />
      <TextField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
        defaultValue={values.email}
        error={errors.email}
      />
      <TextField
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN}
        maxLength={128}
        hint={`At least ${PASSWORD_MIN} characters. A short phrase is easy to remember and hard to guess.`}
        error={errors.password}
      />
      <TextField
        id="confirmPassword"
        label="Repeat password"
        type="password"
        autoComplete="new-password"
        required
        maxLength={128}
        error={errors.confirmPassword}
      />
      <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/login?${new URLSearchParams({ next })}`}
          className="font-semibold text-himalaya underline underline-offset-2"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
