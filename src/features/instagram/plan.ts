import type { InstagramCandidate, RejectedRecord } from "./types";
import { parseInstagramPostUrl } from "./urls";

export type DestinationLookup = {
  slug: string;
  name: string;
  regionSlug: string;
};

export type PlannedPost = InstagramCandidate & {
  /** True when this shortcode already exists and will be refreshed. */
  isUpdate: boolean;
};

export type ImportPlan = {
  accepted: PlannedPost[];
  rejected: RejectedRecord[];
  duplicates: RejectedRecord[];
};

/**
 * Resolve posts to known destinations and collapse duplicate shortcodes.
 * Existing rows are not duplicates: they are updates, which keeps repeated
 * imports idempotent while still refreshing captions and attribution.
 */
export function planInstagramImport(
  candidates: InstagramCandidate[],
  destinations: DestinationLookup[],
  existingShortcodes: ReadonlySet<string> = new Set(),
): ImportPlan {
  const bySlug = new Map(destinations.map((destination) => [destination.slug, destination]));
  const seen = new Set<string>();
  const accepted: PlannedPost[] = [];
  const rejected: RejectedRecord[] = [];
  const duplicates: RejectedRecord[] = [];

  for (const candidate of candidates) {
    const link = parseInstagramPostUrl(candidate.url);
    if (!link || link.shortcode !== candidate.shortcode) {
      rejected.push({
        kind: "post",
        source: candidate.sourceMethod,
        postUrl: candidate.url,
        destinationSlug: candidate.destinationSlug,
        reason: "Post URL and shortcode do not match, or the URL is not a canonical Instagram permalink.",
      });
      continue;
    }

    if (!bySlug.has(candidate.destinationSlug)) {
      rejected.push({
        kind: "post",
        source: candidate.sourceMethod,
        postUrl: candidate.url,
        destinationSlug: candidate.destinationSlug,
        reason: `Unknown destination slug "${candidate.destinationSlug}". Add the place first or fix the slug.`,
      });
      continue;
    }

    if (seen.has(candidate.shortcode)) {
      duplicates.push({
        kind: "post",
        source: candidate.sourceMethod,
        postUrl: candidate.url,
        destinationSlug: candidate.destinationSlug,
        reason: "Duplicate shortcode in this import; the first occurrence was kept.",
      });
      continue;
    }
    seen.add(candidate.shortcode);

    accepted.push({
      ...candidate,
      isUpdate: existingShortcodes.has(candidate.shortcode),
    });
  }

  return { accepted, rejected, duplicates };
}
