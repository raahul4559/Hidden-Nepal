"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { UserRole } from "@/generated/prisma/enums";

import { changeUserRole, type RoleFormState } from "../actions";

const initialState: RoleFormState = { status: "idle" };

export function RoleForm({ userId, role, email }: { userId: string; role: UserRole; email: string }) {
  const [state, formAction, pending] = useActionState(changeUserRole, initialState);
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <label htmlFor={`role-${userId}`} className="sr-only">
        Role for {email}
      </label>
      <select
        id={`role-${userId}`}
        name="role"
        defaultValue={role}
        className="h-9 rounded-md border border-input bg-white px-2 text-sm"
      >
        {Object.values(UserRole).map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        Update
      </Button>
      {state.status !== "idle" ? (
        <span role={state.status === "error" ? "alert" : "status"} className="text-sm">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
