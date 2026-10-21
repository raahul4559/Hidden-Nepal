import "server-only";

import type { LoadResult } from "@/features/destinations/types";
import { getDb } from "@/lib/db";

export type PublicGuide = {
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  publishedAt: Date | null;
  updatedAt: Date;
  author: { name: string | null } | null;
};

async function load<T>(
  label: string,
  run: (db: NonNullable<ReturnType<typeof getDb>>) => Promise<T>,
): Promise<LoadResult<T>> {
  const db = getDb();
  if (!db) return { status: "unconfigured" };
  try {
    return { status: "ok", ...(await run(db)) };
  } catch (error) {
    console.error(`[guides] ${label} failed`, error);
    return { status: "error" };
  }
}

const publishedSelect = {
  slug: true,
  title: true,
  excerpt: true,
  body: true,
  publishedAt: true,
  updatedAt: true,
  author: { select: { name: true } },
} as const;

export function listPublishedGuides(limit = 50) {
  return load("list", async (db) => {
    const guides = await db.travelGuide.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
      take: limit,
      select: publishedSelect,
    });
    return { guides };
  });
}

export function getPublishedGuide(slug: string) {
  return load("detail", async (db) => {
    const guide = await db.travelGuide.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: publishedSelect,
    });
    return { guide };
  });
}

export function getSitemapGuides() {
  return load("sitemap", async (db) => {
    const guides = await db.travelGuide.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    });
    return { guides };
  });
}
