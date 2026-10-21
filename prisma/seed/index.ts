import type { PrismaClient } from "@/generated/prisma/client";

import { upsertDestination } from "./destinations";
import {
  seedInstagramReferences,
  type InstagramSeedSummary,
} from "./instagram";
import { seedReferenceData } from "./reference";
import { RESEARCHED_DESTINATIONS } from "./researched-destinations";
import { SAMPLE_DESTINATIONS } from "./sample-destinations";

export type SeedOptions = {
  /** Development sample destinations. Never enabled in production. */
  samples: boolean;
  /** Source-attributed destination records from data/nepal-tourism-destinations.json. */
  researched?: boolean;
  /** Editor-supplied Instagram references and places from data/instagram-references.json. */
  instagram?: boolean;
};

export async function seedDatabase(
  prisma: PrismaClient,
  { samples, researched, instagram }: SeedOptions,
) {
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

  let instagramResult: InstagramSeedSummary = {
    skipped: true,
    posts: 0,
    places: 0,
    rejected: 0,
  };
  if (instagram !== false) {
    instagramResult = await seedInstagramReferences(prisma);
  }

  return {
    ...reference,
    sampleDestinations,
    researchedPublished,
    researchedDrafts,
    preservedSampleDestinations,
    instagram: instagramResult,
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
    instagram: env.SEED_INSTAGRAM_DATA?.toLowerCase() !== "false",
  };
}
