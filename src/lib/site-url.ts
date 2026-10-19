/**
 * Absolute origin for canonical URLs, Open Graph and the sitemap.
 * SITE_URL wins; Vercel's production domain comes next; local development uses localhost.
 */
export function getSiteUrl(): URL {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return new URL(explicit);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return new URL(`https://${vercel}`);
  return new URL(
    process.env.NODE_ENV === "production"
      ? "https://hiddennepal-one.vercel.app"
      : "http://localhost:3000",
  );
}

export function absoluteUrl(path: string): string {
  return new URL(path, getSiteUrl()).toString();
}
