import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";

import { hashPassword } from "./password";
import type { CurrentUser } from "./session";
import type { profileSchema, registerSchema } from "./validation";
import type { z } from "zod";

export type RegisterResult =
  | { status: "ok"; userId: string }
  | { status: "email_taken" }
  | { status: "unavailable" };

/**
 * Creates a USER account. Only validated fields are written: `role`,
 * `emailVerified` and `sessionVersion` always take their database defaults,
 * so nothing a visitor submits can make them an admin.
 */
export async function createAccount(input: z.output<typeof registerSchema>): Promise<RegisterResult> {
  const db = getDb();
  if (!db) return { status: "unavailable" };

  const passwordHash = await hashPassword(input.password);
  try {
    const user = await db.user.create({
      data: { email: input.email, name: input.name ?? null, passwordHash },
      select: { id: true },
    });
    return { status: "ok", userId: user.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: "email_taken" };
    }
    throw error;
  }
}

/** The signed-in user edits their own profile. Only `name` is editable. */
export async function updateOwnProfile(user: CurrentUser, input: z.output<typeof profileSchema>) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  await db.user.update({ where: { id: user.id }, data: { name: input.name } });
}

/** Signs the user out on every device by invalidating all session tokens. */
export async function revokeAllSessions(user: CurrentUser) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  await db.user.update({ where: { id: user.id }, data: { sessionVersion: { increment: 1 } } });
}
