/**
 * Absolute origin for canonical URLs, Open Graph and the sitemap.
 * SITE_URL wins; on Vercel the production domain is used; otherwise localhost.
 */
export function getSiteUrl(): URL {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return new URL(explicit);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return new URL(`https://${vercel}`);
  return new URL("http://localhost:3000");
}

export function absoluteUrl(path: string): string {
  return new URL(path, getSiteUrl()).toString();
}
