/**
 * Instagram permalink parsing. We accept only the public post/reel/TV URL
 * shapes so a manually supplied link cannot smuggle in another host or path.
 *
 * Instagram's CDN URLs are deliberately not accepted as permalinks: they
 * expire, are not stable references, and must never be rehosted.
 */

const INSTAGRAM_HOSTS = new Set([
  "instagram.com",
  "www.instagram.com",
  "m.instagram.com",
]);

const POST_PATH = /^\/(p|reel|reels|tv)\/([A-Za-z0-9_-]{5,30})$/;

export type InstagramUrlKind = "p" | "reel" | "tv";

export type InstagramUrlInfo = {
  shortcode: string;
  kind: InstagramUrlKind;
  canonicalUrl: string;
};

export function parseInstagramPostUrl(
  input: string | null | undefined,
): InstagramUrlInfo | null {
  if (!input) return null;

  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!INSTAGRAM_HOSTS.has(url.hostname.toLowerCase())) return null;

  const path = url.pathname.replace(/\/+$/, "");
  const match = path.match(POST_PATH);
  if (!match) return null;

  const kind: InstagramUrlKind =
    match[1] === "reels" ? "reel" : (match[1] as InstagramUrlKind);
  const shortcode = match[2];

  return {
    shortcode,
    kind,
    canonicalUrl: `https://www.instagram.com/${kind}/${shortcode}/`,
  };
}

/** Store handles without a leading @ and without surrounding whitespace. */
export function normalizeInstagramUsername(
  username: string | null | undefined,
): string | undefined {
  if (!username) return undefined;
  const value = username.trim().replace(/^@+/, "");
  return value || undefined;
}

/** Used by the importer to keep hashtag configuration unambiguous. */
export function normalizeHashtag(tag: string): string | undefined {
  const value = tag.trim().replace(/^#+/, "").toLowerCase();
  return /^[a-z0-9_]{1,100}$/.test(value) ? value : undefined;
}
