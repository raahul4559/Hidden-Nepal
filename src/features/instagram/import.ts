import type { PrismaClient } from "@/generated/prisma/client";
import { destinationInputSchema } from "@/features/destinations/validation";

import { manualPlaceToDestinationInput } from "./manual";
import { planInstagramImport, type DestinationLookup } from "./plan";
import { buildCoverageReport, type CoverageReport } from "./report";
import type { ManualPlaceInput } from "./schemas";
import type { InstagramCandidate, RejectedRecord } from "./types";
import { upsertDestination } from "../../../prisma/seed/destinations";

export type ImportInstagramOptions = {
  posts: InstagramCandidate[];
  places: ManualPlaceInput[];
  graphConfigured: boolean;
  dryRun: boolean;
  datasetErrors?: RejectedRecord[];
  graphErrors?: string[];
  now?: Date;
};

export type ImportInstagramResult = {
  report: CoverageReport;
  import: {
    dryRun: boolean;
    graphConfigured: boolean;
    places: {
      input: number;
      created: number;
      skippedExisting: number;
      rejected: number;
    };
    posts: {
      input: number;
      accepted: number;
      created: number;
      updated: number;
      duplicates: number;
      rejected: number;
    };
    rejected: RejectedRecord[];
    duplicates: RejectedRecord[];
    pending: string[];
    graphErrors: string[];
  };
};

async function loadDestinations(prisma: PrismaClient): Promise<DestinationLookup[]> {
  const rows = await prisma.destination.findMany({
    select: { slug: true, name: true, region: { select: { slug: true } } },
  });
  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    regionSlug: row.region.slug,
  }));
}

/**
 * Idempotent importer:
 * - new places are created only when the slug is unused (never overwritten);
 * - Instagram rows are upserted by shortcode;
 * - one bad record does not abort the batch;
 * - the returned report reflects the database after the run.
 */
export async function importInstagramReferences(
  prisma: PrismaClient,
  options: ImportInstagramOptions,
): Promise<ImportInstagramResult> {
  const now = options.now ?? new Date();
  const rejected: RejectedRecord[] = [...(options.datasetErrors ?? [])];
  const duplicates: RejectedRecord[] = [];
  const pending: string[] = [];

  let destinations = await loadDestinations(prisma);
  const knownSlugs = new Set(destinations.map((destination) => destination.slug));

  const placeCounts = { created: 0, skippedExisting: 0, rejected: 0 };

  for (const place of options.places) {
    if (knownSlugs.has(place.slug)) {
      placeCounts.skippedExisting++;
      pending.push(
        `Place "${place.slug}" already exists; it was not overwritten. Review the existing record instead.`,
      );
      continue;
    }

    try {
      const input = destinationInputSchema.parse(
        manualPlaceToDestinationInput(place, now),
      );
      if (!options.dryRun) {
        await upsertDestination(prisma, input);
      } else {
        // Let dry-run planning resolve posts that reference this new place.
        destinations.push({
          slug: place.slug,
          name: place.name,
          regionSlug: place.province,
        });
      }
      knownSlugs.add(place.slug);
      placeCounts.created++;
    } catch (error) {
      placeCounts.rejected++;
      rejected.push({
        kind: "place",
        source: "places",
        destinationSlug: place.slug,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (placeCounts.created > 0) {
    destinations = await loadDestinations(prisma);
  }

  const existing = options.posts.length
    ? await prisma.destinationInstagramPost.findMany({
        where: { shortcode: { in: options.posts.map((post) => post.shortcode) } },
        select: { shortcode: true },
      })
    : [];
  const existingShortcodes = new Set(existing.map((row) => row.shortcode));

  const plan = planInstagramImport(options.posts, destinations, existingShortcodes);
  rejected.push(...plan.rejected);
  duplicates.push(...plan.duplicates);

  const destinationIdBySlug = new Map(
    (
      await prisma.destination.findMany({
        select: { id: true, slug: true },
      })
    ).map((row) => [row.slug, row.id]),
  );

  const postCounts = { created: 0, updated: 0, rejected: 0 };

  for (const post of plan.accepted) {
    const destinationId = destinationIdBySlug.get(post.destinationSlug);
    if (!destinationId) {
      postCounts.rejected++;
      rejected.push({
        kind: "post",
        source: post.sourceMethod,
        postUrl: post.url,
        destinationSlug: post.destinationSlug,
        reason: "Destination disappeared before the post could be written.",
      });
      continue;
    }

    if (post.isUpdate) postCounts.updated++;
    else postCounts.created++;

    if (options.dryRun) continue;

    try {
      await prisma.destinationInstagramPost.upsert({
        where: { shortcode: post.shortcode },
        update: {
          destinationId,
          url: post.url,
          creatorUsername: post.creatorUsername ?? null,
          caption: post.caption ?? null,
          locationTag: post.locationTag ?? null,
          imageUrl: post.imageUrl ?? null,
          sourceMethod: post.sourceMethod,
          rightsStatus: post.rightsStatus,
          rightsNote: post.rightsNote ?? null,
          collectedAt: post.collectedAt,
          verifiedAt: post.rightsStatus === "PERMITTED" ? now : null,
        },
        create: {
          destinationId,
          shortcode: post.shortcode,
          url: post.url,
          creatorUsername: post.creatorUsername ?? null,
          caption: post.caption ?? null,
          locationTag: post.locationTag ?? null,
          imageUrl: post.imageUrl ?? null,
          sourceMethod: post.sourceMethod,
          rightsStatus: post.rightsStatus,
          rightsNote: post.rightsNote ?? null,
          collectedAt: post.collectedAt,
          verifiedAt: post.rightsStatus === "PERMITTED" ? now : null,
        },
      });
    } catch (error) {
      if (!post.isUpdate) postCounts.created--;
      else postCounts.updated--;
      postCounts.rejected++;
      rejected.push({
        kind: "post",
        source: post.sourceMethod,
        postUrl: post.url,
        destinationSlug: post.destinationSlug,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const report = await buildCoverageReport(prisma, now);

  if (!options.graphConfigured) {
    pending.push(
      "Instagram Graph API is not configured. No authorized Instagram media was fetched; the importer used manually supplied references only.",
    );
  }
  if (report.totals.withPermittedInstagram === 0) {
    pending.push(
      "No permitted Instagram posts are available yet. Add real post URLs and attribution to data/instagram-references.json, or configure Graph API credentials.",
    );
  }
  for (const province of report.provinces) {
    if (province.missingCoordinates.length) {
      pending.push(
        `${province.name}: coordinates still need a reliable source for ${province.missingCoordinates.join(", ")}.`,
      );
    }
    if (province.missingDistrict.length) {
      pending.push(
        `${province.name}: district still needs verification for ${province.missingDistrict.join(", ")}.`,
      );
    }
  }

  return {
    report,
    import: {
      dryRun: options.dryRun,
      graphConfigured: options.graphConfigured,
      places: {
        input: options.places.length,
        ...placeCounts,
      },
      posts: {
        input: options.posts.length,
        accepted: plan.accepted.length,
        ...postCounts,
        duplicates: plan.duplicates.length,
        rejected: plan.rejected.length + postCounts.rejected,
      },
      rejected,
      duplicates,
      pending,
      graphErrors: options.graphErrors ?? [],
    },
  };
}
