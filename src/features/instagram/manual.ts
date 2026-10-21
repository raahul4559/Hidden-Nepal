import type { DestinationInput } from "@/features/destinations/validation";

import {
  manualDatasetSchema,
  manualPlaceSchema,
  manualPostSchema,
  type ManualPlaceInput,
} from "./schemas";
import type { InstagramCandidate, RejectedRecord } from "./types";
import { normalizeInstagramUsername, parseInstagramPostUrl } from "./urls";

function formatIssues(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return error.issues
    .map((issue) => {
      const path = issue.path.map(String).join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
}

export type ManualParseResult = {
  posts: InstagramCandidate[];
  places: ManualPlaceInput[];
  rejected: RejectedRecord[];
};

/**
 * Validates each record independently so one malformed row does not discard a
 * whole dataset. The outer document shape must still be an object.
 */
export function parseManualDataset(
  raw: unknown,
  now: Date = new Date(),
): ManualParseResult {
  const document = manualDatasetSchema.parse(raw);
  const posts: InstagramCandidate[] = [];
  const places: ManualPlaceInput[] = [];
  const rejected: RejectedRecord[] = [];

  document.places.forEach((record, index) => {
    const parsed = manualPlaceSchema.safeParse(record);
    if (!parsed.success) {
      rejected.push({
        kind: "place",
        source: `places[${index}]`,
        destinationSlug:
          typeof record === "object" && record !== null && "slug" in record
            ? String((record as { slug: unknown }).slug)
            : undefined,
        reason: formatIssues(parsed.error),
      });
      return;
    }
    places.push(parsed.data);
  });

  document.posts.forEach((record, index) => {
    const parsed = manualPostSchema.safeParse(record);
    if (!parsed.success) {
      rejected.push({
        kind: "post",
        source: `posts[${index}]`,
        destinationSlug:
          typeof record === "object" && record !== null && "destinationSlug" in record
            ? String((record as { destinationSlug: unknown }).destinationSlug)
            : undefined,
        reason: formatIssues(parsed.error),
      });
      return;
    }

    const link = parseInstagramPostUrl(parsed.data.postUrl);
    if (!link) {
      rejected.push({
        kind: "post",
        source: `posts[${index}]`,
        postUrl: parsed.data.postUrl,
        destinationSlug: parsed.data.destinationSlug,
        reason:
          "Not a public Instagram post URL. Use https://www.instagram.com/p/<shortcode>/, /reel/<shortcode>/ or /tv/<shortcode>/.",
      });
      return;
    }

    posts.push({
      destinationSlug: parsed.data.destinationSlug,
      shortcode: link.shortcode,
      url: link.canonicalUrl,
      creatorUsername: normalizeInstagramUsername(parsed.data.creatorUsername),
      caption: parsed.data.caption,
      locationTag: parsed.data.locationTag,
      imageUrl: parsed.data.imageUrl,
      sourceMethod: "MANUAL",
      rightsStatus: parsed.data.rightsStatus,
      rightsNote: parsed.data.rightsNote,
      collectedAt: parsed.data.collectedAt ?? now,
    });
  });

  return { posts, places, rejected };
}

/**
 * Convert a manually supplied place into the project's canonical destination
 * input. New places are always drafts unless the editor explicitly publishes
 * them, and practical information stays UNVERIFIED.
 */
export function manualPlaceToDestinationInput(
  place: ManualPlaceInput,
  now: Date,
): DestinationInput {
  const urls = [...new Set([place.geoSourceUrl, ...place.sourceUrls])];

  return {
    slug: place.slug,
    name: place.name,
    summary: place.summary,
    description: place.description,
    status: place.status,
    ...(place.status === "PUBLISHED" && { publishedAt: now }),
    isFeatured: false,
    isHiddenGem: false,
    isSample: false,
    regionSlug: place.province,
    district: place.district,
    categorySlugs: place.categorySlugs,
    coordinates: {
      latitude: place.latitude,
      longitude: place.longitude,
    },
    practicalInfo: { status: "UNVERIFIED" },
    images: [],
    sources: urls.map((url) => {
      const host = new URL(url).hostname;
      return {
        title:
          url === place.geoSourceUrl
            ? `Geographic verification (${host})`
            : `Place reference (${host})`,
        url,
        publisher: host,
        accessedAt: now,
      };
    }),
  };
}
