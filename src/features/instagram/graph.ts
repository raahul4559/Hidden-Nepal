/**
 * Instagram Graph API provider.
 *
 * This is the only network path in the feature. It runs exclusively when an
 * access token and Instagram user id are configured, uses documented Graph
 * endpoints, and never scrapes instagram.com. Without credentials the manual
 * fallback is used instead.
 *
 * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api
 */

import { slugSchema } from "@/features/destinations/validation";

import type { InstagramCandidate } from "./types";
import { normalizeHashtag, normalizeInstagramUsername, parseInstagramPostUrl } from "./urls";

const GRAPH_ORIGIN = "https://graph.facebook.com";
const DEFAULT_API_VERSION = "v23.0";
const MEDIA_FIELDS =
  "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username";

export type HashtagTarget = {
  hashtag: string;
  destinationSlug: string;
};

export type InstagramGraphConfig = {
  accessToken: string;
  userId: string;
  apiVersion: string;
  hashtagTargets: HashtagTarget[];
  /** Attach authorized account media to this destination. */
  defaultDestinationSlug?: string;
  maxPages: number;
};

export type GraphMedia = {
  id: string;
  permalink?: string;
  shortcode?: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  timestamp?: string;
  username?: string;
};

export type GraphFetchResult = {
  candidates: InstagramCandidate[];
  errors: string[];
  requests: number;
};

export type InstagramGraphConfigResult = {
  config: InstagramGraphConfig | null;
  errors: string[];
  warnings: string[];
};

function parseHashtagTargets(
  raw: string | undefined,
  errors: string[],
): HashtagTarget[] {
  if (!raw?.trim()) return [];
  const targets: HashtagTarget[] = [];

  for (const entry of raw.split(",")) {
    const [hashtagPart, slugPart, ...rest] = entry.split(":");
    const hashtag = normalizeHashtag(hashtagPart ?? "");
    const slug = slugSchema.safeParse((slugPart ?? "").trim());

    if (!hashtag || !slug.success || rest.length) {
      errors.push(
        `Ignoring INSTAGRAM_HASHTAGS entry "${entry.trim()}". Use hashtag:destination-slug.`,
      );
      continue;
    }
    targets.push({ hashtag, destinationSlug: slug.data });
  }

  return targets;
}

/**
 * Reads optional env. A half-configured integration returns null with an
 * explanation rather than silently falling back.
 */
export function instagramGraphConfigFromEnv(
  env: Record<string, string | undefined>,
): InstagramGraphConfigResult {
  const accessToken = env.INSTAGRAM_ACCESS_TOKEN?.trim();
  const userId = env.INSTAGRAM_USER_ID?.trim();
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!accessToken && !userId) return { config: null, errors, warnings };
  if (!accessToken || !userId) {
    errors.push(
      "Instagram Graph API needs both INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID; falling back to manual references.",
    );
    return { config: null, errors, warnings };
  }

  const configuredVersion = env.INSTAGRAM_API_VERSION?.trim();
  const apiVersion = /^v\d+\.\d+$/.test(configuredVersion ?? "")
    ? configuredVersion!
    : DEFAULT_API_VERSION;
  if (configuredVersion && apiVersion !== configuredVersion) {
    warnings.push(
      `INSTAGRAM_API_VERSION "${configuredVersion}" is invalid; using ${DEFAULT_API_VERSION}.`,
    );
  }

  const hashtagTargets = parseHashtagTargets(env.INSTAGRAM_HASHTAGS, errors);

  const defaultSlugRaw = env.INSTAGRAM_DESTINATION_SLUG?.trim();
  const defaultSlug = defaultSlugRaw ? slugSchema.safeParse(defaultSlugRaw) : null;
  if (defaultSlugRaw && !defaultSlug?.success) {
    errors.push(
      `INSTAGRAM_DESTINATION_SLUG "${defaultSlugRaw}" is not a valid destination slug.`,
    );
  }

  const maxPagesRaw = Number.parseInt(env.INSTAGRAM_MAX_PAGES ?? "5", 10);
  const maxPages =
    Number.isFinite(maxPagesRaw) && maxPagesRaw > 0
      ? Math.min(maxPagesRaw, 25)
      : 5;

  if (!defaultSlug?.success && hashtagTargets.length === 0) {
    errors.push(
      "Graph API is configured but no destination mapping exists. Set INSTAGRAM_DESTINATION_SLUG (account media) or INSTAGRAM_HASHTAGS=hashtag:destination-slug.",
    );
    return { config: null, errors, warnings };
  }

  return {
    config: {
      accessToken,
      userId,
      apiVersion,
      hashtagTargets,
      defaultDestinationSlug: defaultSlug?.success ? defaultSlug.data : undefined,
      maxPages,
    },
    errors,
    warnings,
  };
}

type GraphResponse<T> = T & {
  paging?: { next?: string };
  error?: { message?: string };
};

async function graphRequest<T>(
  url: URL,
  fetchImpl: typeof fetch,
): Promise<GraphResponse<T>> {
  const response = await fetchImpl(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });

  const body = (await response.json().catch(() => null)) as GraphResponse<T> | null;
  if (!response.ok || !body) {
    const message = body?.error?.message ?? `HTTP ${response.status}`;
    // Never include the request URL: it contains the access token.
    throw new Error(`Instagram Graph API request failed: ${message}`);
  }
  if (body.error) {
    throw new Error(`Instagram Graph API error: ${body.error.message ?? "unknown"}`);
  }
  return body;
}

function buildGraphUrl(
  config: InstagramGraphConfig,
  path: string,
  params: Record<string, string>,
): URL {
  const url = new URL(`${GRAPH_ORIGIN}/${config.apiVersion}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("access_token", config.accessToken);
  return url;
}

function assertGraphPagingUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "graph.facebook.com") {
    throw new Error("Instagram Graph API returned an unexpected paging URL.");
  }
  return url;
}

async function collectMedia<T extends { data?: GraphMedia[] }>(
  first: GraphResponse<T>,
  config: InstagramGraphConfig,
  fetchImpl: typeof fetch,
  state: { requests: number; errors: string[] },
): Promise<GraphMedia[]> {
  const media: GraphMedia[] = [];
  let page: GraphResponse<T> | null = first;

  for (let index = 0; page && index < config.maxPages; index++) {
    state.requests++;
    media.push(...(page.data ?? []));
    const nextUrl: string | undefined = page.paging?.next;
    if (!nextUrl) break;

    try {
      const nextPage: GraphResponse<T> = await graphRequest<T>(
        assertGraphPagingUrl(nextUrl),
        fetchImpl,
      );
      page = nextPage;
    } catch (error) {
      state.errors.push(error instanceof Error ? error.message : String(error));
      break;
    }
  }

  return media;
}

function toCandidate(
  media: GraphMedia,
  destinationSlug: string,
  now: Date,
): { candidate?: InstagramCandidate; error?: string } {
  const link =
    parseInstagramPostUrl(media.permalink) ??
    (media.shortcode ? parseInstagramPostUrl(`https://www.instagram.com/p/${media.shortcode}/`) : null);

  if (!link) {
    return { error: `Media ${media.id} has no usable Instagram permalink.` };
  }

  const timestamp = media.timestamp ? new Date(media.timestamp) : null;
  const collectedAt =
    timestamp && !Number.isNaN(timestamp.valueOf()) ? timestamp : now;

  return {
    candidate: {
      destinationSlug,
      shortcode: link.shortcode,
      url: link.canonicalUrl,
      creatorUsername: normalizeInstagramUsername(media.username),
      caption: media.caption?.slice(0, 2200),
      imageUrl: media.media_type === "VIDEO" ? media.thumbnail_url : media.media_url,
      sourceMethod: "GRAPH_API",
      rightsStatus: "PERMITTED",
      rightsNote:
        "Authorized Graph API response. The permalink is stored; media is not rehosted and may expire.",
      collectedAt,
    },
  };
}

/**
 * Fetch authorized account media and/or hashtag top media. Errors are returned
 * per source so one failed hashtag does not discard the rest.
 */
export async function fetchGraphCandidates(
  config: InstagramGraphConfig,
  fetchImpl: typeof fetch = fetch,
  now: Date = new Date(),
): Promise<GraphFetchResult> {
  const state = { requests: 0, errors: [] as string[] };
  const candidates: InstagramCandidate[] = [];

  if (config.defaultDestinationSlug) {
    try {
      const first = await graphRequest<{ data?: GraphMedia[] }>(
        buildGraphUrl(config, `${config.userId}/media`, {
          fields: MEDIA_FIELDS,
          limit: "50",
        }),
        fetchImpl,
      );
      const media = await collectMedia(first, config, fetchImpl, state);
      for (const item of media) {
        const result = toCandidate(item, config.defaultDestinationSlug, now);
        if (result.candidate) candidates.push(result.candidate);
        if (result.error) state.errors.push(result.error);
      }
    } catch (error) {
      state.errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  for (const target of config.hashtagTargets) {
    try {
      const search = await graphRequest<{ data?: { id: string }[] }>(
        buildGraphUrl(config, "ig_hashtag_search", {
          user_id: config.userId,
          q: target.hashtag,
        }),
        fetchImpl,
      );
      state.requests++;
      const hashtagId = search.data?.[0]?.id;
      if (!hashtagId) {
        state.errors.push(`No hashtag id returned for #${target.hashtag}.`);
        continue;
      }

      const first = await graphRequest<{ data?: GraphMedia[] }>(
        buildGraphUrl(config, `${hashtagId}/top_media`, {
          user_id: config.userId,
          fields: MEDIA_FIELDS,
          limit: "50",
        }),
        fetchImpl,
      );
      const media = await collectMedia(first, config, fetchImpl, state);
      for (const item of media) {
        const result = toCandidate(item, target.destinationSlug, now);
        if (result.candidate) candidates.push(result.candidate);
        if (result.error) state.errors.push(result.error);
      }
    } catch (error) {
      state.errors.push(
        `#${target.hashtag}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return { candidates, errors: state.errors, requests: state.requests };
}
