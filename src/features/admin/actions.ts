"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AuthorizationError, assertAdmin } from "@/features/auth/session";

import { roleChangeSchema, setUserRole } from "./users";

export type RoleFormState = { status: "idle" } | { status: "ok"; message: string } | { status: "error"; message: string };

const input = roleChangeSchema.extend({ userId: z.string().min(1).max(64) });

/** Admin only. Checked here, independently of the /admin page guard. */
export async function changeUserRole(_previous: RoleFormState, formData: FormData): Promise<RoleFormState> {
  let actor;
  try {
    actor = await assertAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) return { status: "error", message: error.message };
    throw error;
  }

  const parsed = input.safeParse({ userId: formData.get("userId"), role: formData.get("role") });
  if (!parsed.success) return { status: "error", message: "Choose a valid role." };

  const result = await setUserRole(actor, parsed.data.userId, parsed.data.role);
  if (result.status === "self_change") return { status: "error", message: "You can’t change your own role." };
  if (result.status === "not_found") return { status: "error", message: "That user no longer exists." };

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  return { status: "ok", message: "Role updated." };
}
