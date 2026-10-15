import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  // Optional during the foundation phase: pages render empty states without it.
  DATABASE_URL: z
    .string()
    .trim()
    .min(1)
    .refine((v) => !/^postgres(ql)?\+\w+:\/\//.test(v), {
      // e.g. postgresql+psycopg:// from Python/SQLAlchemy examples.
      message:
        "DATABASE_URL has a '+driver' suffix (SQLAlchemy style). Use plain postgresql:// for Prisma",
    })
    .refine((v) => /^postgres(ql)?:\/\//.test(v), {
      message: "DATABASE_URL must be a postgres:// or postgresql:// URL",
    })
    .optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(source: Record<string, string | undefined>) {
  return serverEnvSchema.parse({
    NODE_ENV: source.NODE_ENV,
    DATABASE_URL: source.DATABASE_URL || undefined,
  });
}

export const serverEnv: ServerEnv = parseServerEnv(process.env);
