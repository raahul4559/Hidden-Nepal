/**
 * Collect and import Instagram references for Nepal's destinations.
 *
 *   npm run data:instagram
 *   npm run data:instagram:dry
 *   npm run data:instagram -- --file=data/instagram-references.json
 *
 * Authorized Graph API media is used only when INSTAGRAM_ACCESS_TOKEN and
 * INSTAGRAM_USER_ID are set. Otherwise the command works from manually supplied
 * public post URLs in data/instagram-references.json. It never scrapes
 * Instagram, downloads media, or invents captions/locations.
 */
import "dotenv/config";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { fetchGraphCandidates, instagramGraphConfigFromEnv } from "@/features/instagram/graph";
import { importInstagramReferences } from "@/features/instagram/import";
import { parseManualDataset } from "@/features/instagram/manual";
import type { InstagramCandidate } from "@/features/instagram/types";

function argumentValue(args: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(
      [
        "Usage: npm run data:instagram -- [options]",
        "",
        "  --dry-run              Validate and report without writing",
        "  --no-graph             Ignore Graph API credentials",
        "  --strict               Exit 1 when a record or API request fails",
        "  --file=<path>          Manual dataset (default data/instagram-references.json)",
        "  --report=<path>        Report output (default data/reports/instagram-import.json)",
        "",
        "Graph API env: INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID,",
        "  INSTAGRAM_API_VERSION (optional), INSTAGRAM_DESTINATION_SLUG,",
        "  INSTAGRAM_HASHTAGS=hashtag:destination-slug,...",
      ].join("\n"),
    );
    return;
  }

  const dryRun = args.includes("--dry-run");
  const noGraph = args.includes("--no-graph");
  const strict = args.includes("--strict");
  const datasetPath = resolve(
    argumentValue(args, "file") ?? "data/instagram-references.json",
  );
  const reportPath = resolve(
    argumentValue(args, "report") ?? "data/reports/instagram-import.json",
  );

  const raw = JSON.parse(await readFile(datasetPath, "utf8"));
  const manual = parseManualDataset(raw);

  const graphEnv = instagramGraphConfigFromEnv(process.env);
  const graphErrors = [...graphEnv.errors];
  const warnings = [...graphEnv.warnings];
  let graphPosts: InstagramCandidate[] = [];

  if (noGraph) {
    if (graphEnv.config) {
      warnings.push("Graph API skipped because --no-graph was supplied.");
    }
  } else if (graphEnv.config) {
    const result = await fetchGraphCandidates(graphEnv.config);
    graphPosts = result.candidates;
    graphErrors.push(...result.errors);
    if (result.requests > 0) {
      console.log(
        `Instagram Graph API: ${result.requests} request(s), ${graphPosts.length} post(s).`,
      );
    }
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is required to resolve destinations and import references.",
    );
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const result = await importInstagramReferences(prisma, {
      posts: [...manual.posts, ...graphPosts],
      places: manual.places,
      graphConfigured: Boolean(graphEnv.config) && !noGraph,
      dryRun,
      datasetErrors: manual.rejected,
      graphErrors,
    });

    const output = {
      dataset: datasetPath,
      ...result,
    };
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

    for (const warning of warnings) console.warn(`Warning: ${warning}`);
    for (const error of graphErrors) console.warn(`Graph: ${error}`);

    const { import: summary, report } = result;
    console.log(
      [
        `${dryRun ? "Dry run: " : ""}Instagram import complete.`,
        `Places: ${summary.places.created} created, ${summary.places.skippedExisting} existing (not overwritten), ${summary.places.rejected} rejected.`,
        `Posts: ${summary.posts.created} created, ${summary.posts.updated} updated, ${summary.posts.duplicates} duplicate(s), ${summary.posts.rejected} rejected.`,
        `Coverage: ${report.totals.destinations} destinations across ${report.provinces.length} provinces; ${report.totals.withCoordinates} with coordinates, ${report.totals.withDistrict} with districts, ${report.totals.withPublicSources} with public sources.`,
        `Instagram: ${report.instagram.permitted} permitted, ${report.instagram.unverified} unverified, ${report.instagram.total} total.`,
        `Report: ${reportPath}`,
      ].join("\n"),
    );

    for (const item of summary.pending) console.log(`Pending: ${item}`);

    if (strict && (summary.rejected.length > 0 || graphErrors.length > 0)) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
