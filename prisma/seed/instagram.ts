import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { PrismaClient } from "@/generated/prisma/client";
import { importInstagramReferences } from "@/features/instagram/import";
import { parseManualDataset } from "@/features/instagram/manual";

export type InstagramSeedSummary = {
  skipped: boolean;
  posts: number;
  places: number;
  rejected: number;
};

const EMPTY: InstagramSeedSummary = {
  skipped: true,
  posts: 0,
  places: 0,
  rejected: 0,
};

/**
 * Imports editor-supplied Instagram references and places as part of the
 * normal seed. The file is optional; without it the seed is unchanged.
 *
 * This is deliberately the same idempotent importer used by
 * `npm run data:instagram`, so seeding twice cannot create duplicates.
 */
export async function seedInstagramReferences(
  prisma: PrismaClient,
): Promise<InstagramSeedSummary> {
  const file = resolve(process.cwd(), "data/instagram-references.json");

  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return EMPTY;
    throw new Error(
      `Could not read ${file}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const manual = parseManualDataset(raw);
  const result = await importInstagramReferences(prisma, {
    posts: manual.posts,
    places: manual.places,
    graphConfigured: false,
    dryRun: false,
    datasetErrors: manual.rejected,
  });

  return {
    skipped: false,
    posts: result.import.posts.created + result.import.posts.updated,
    places: result.import.places.created,
    rejected: result.import.rejected.length,
  };
}
