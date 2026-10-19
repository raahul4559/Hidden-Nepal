import type { PrismaClient } from "@/generated/prisma/client";

import { upsertDestination } from "./destinations";
import { seedReferenceData } from "./reference";
import { RESEARCHED_DESTINATIONS } from "./researched-destinations";
import { SAMPLE_DESTINATIONS } from "./sample-destinations";

export type SeedOptions = {
  /** Development sample destinations. Never enabled in production. */
  samples: boolean;
  /** Source-attributed destination records from data/nepal-tourism-destinations.json. */
  researched?: boolean;
};

export async function seedDatabase(prisma: PrismaClient, { samples, researched }: SeedOptions) {
  const reference = await seedReferenceData(prisma);

  let sampleDestinations = 0;
  if (samples) {
    // Sequential: each upsert runs in its own transaction.
    for (const destination of SAMPLE_DESTINATIONS) {
      await upsertDestination(prisma, destination);
      sampleDestinations++;
    }
  }

  let researchedPublished = 0;
  let researchedDrafts = 0;
  let preservedSampleDestinations = 0;
  if (researched !== false) {
    for (const destination of RESEARCHED_DESTINATIONS) {
      const existing = await prisma.destination.findUnique({
        where: { slug: destination.slug },
        select: { isSample: true },
      });
      if (existing?.isSample) {
        preservedSampleDestinations++;
        continue;
      }
      await upsertDestination(prisma, destination);
      if (destination.status === "PUBLISHED") researchedPublished++;
      else researchedDrafts++;
    }
  }

  return {
    ...reference,
    sampleDestinations,
    researchedPublished,
    researchedDrafts,
    preservedSampleDestinations,
  };
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
  return {
    samples: requested,
    researched: env.SEED_RESEARCHED_DATA?.toLowerCase() !== "false",
  };
}
