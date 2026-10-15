import type { MetadataRoute } from "next";
import { connection } from "next/server";

import { getSitemapDestinations } from "@/features/destinations/queries";
import { destinationHref, provinceHref } from "@/features/destinations/schemas";
import { PROVINCES } from "@/features/regions/provinces";
import { absoluteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Read at request time so newly published destinations appear without a rebuild.
  await connection();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/explore"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/provinces"), changeFrequency: "weekly", priority: 0.7 },
    ...PROVINCES.map((p) => ({
      url: absoluteUrl(provinceHref(p.slug)),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    { url: absoluteUrl("/contribute"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/credits"), changeFrequency: "yearly", priority: 0.1 },
  ];

  const result = await getSitemapDestinations();
  const destinations: MetadataRoute.Sitemap =
    result.status === "ok"
      ? result.destinations.map((d) => ({
          url: absoluteUrl(destinationHref(d.slug)),
          lastModified: d.updatedAt,
          changeFrequency: "monthly" as const,
          priority: 0.9,
        }))
      : [];

  return [...staticRoutes, ...destinations];
}
