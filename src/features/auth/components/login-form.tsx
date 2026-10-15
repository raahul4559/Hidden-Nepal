"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import { type FormState, login } from "../actions";
import type { LoginField } from "../validation";
import { FormAlert, SubmitButton, TextField } from "./form-parts";

const initialState: FormState<LoginField> = { status: "idle" };

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, formAction] = useActionState(login, initialState);
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
      {state.status === "error" ? (
        <FormAlert ref={alertRef} message={state.message} />
      ) : notice ? (
        <p role="status" className="rounded-md border border-teal/50 bg-white p-4 text-sm">
          {notice}
        </p>
      ) : null}

      <input type="hidden" name="next" value={next} />
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
        autoComplete="current-password"
        required
        maxLength={128}
        error={errors.password}
      />
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        New to Hidden Nepal?{" "}
        <Link
          href={`/register?${new URLSearchParams({ next })}`}
          className="font-semibold text-himalaya underline underline-offset-2"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
