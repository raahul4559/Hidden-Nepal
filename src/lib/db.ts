import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { serverEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient(connectionString: string) {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: serverEnv.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

/**
 * Returns the shared Prisma client, or `null` when no database is configured
 * so callers can render an honest "not connected" state instead of crashing.
 */
export function getDb(): PrismaClient | null {
  const url = serverEnv.DATABASE_URL;
  if (!url) return null;

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient(url);
  }
  return globalForPrisma.prisma;
}
