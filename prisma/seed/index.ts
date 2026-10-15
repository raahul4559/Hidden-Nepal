import type { PrismaClient } from "@/generated/prisma/client";

import { upsertDestination } from "./destinations";
import { seedReferenceData } from "./reference";
import { SAMPLE_DESTINATIONS } from "./sample-destinations";

export type SeedOptions = {
  /** Development sample destinations. Never enabled in production. */
  samples: boolean;
};

export async function seedDatabase(prisma: PrismaClient, { samples }: SeedOptions) {
  const reference = await seedReferenceData(prisma);

  let sampleDestinations = 0;
  if (samples) {
    // Sequential: each upsert runs in its own transaction.
    for (const destination of SAMPLE_DESTINATIONS) {
      await upsertDestination(prisma, destination);
      sampleDestinations++;
    }
  }

  return { ...reference, sampleDestinations };
}

/**
 * Samples are on by default for local development, off when
 * SEED_SAMPLE_DATA=false, and refused outright in production.
 */
export function resolveSeedOptions(env: Record<string, string | undefined>): SeedOptions {
  const requested = env.SEED_SAMPLE_DATA?.toLowerCase() !== "false";
  if (requested && env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to seed sample destinations with NODE_ENV=production. Set SEED_SAMPLE_DATA=false.",
    );
  }
  return { samples: requested };
}
