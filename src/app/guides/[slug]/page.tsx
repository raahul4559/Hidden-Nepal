import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { GuideArticle } from "@/features/guides/components/guide-article";
import { getPublishedGuide } from "@/features/guides/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublishedGuide(slug);
  const guide = result.status === "ok" ? result.guide : null;
  if (!guide) return { title: "Guide not found", robots: { index: false } };

  return {
    title: guide.title,
    description: guide.excerpt ?? undefined,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.excerpt ?? undefined,
      url: `/guides/${guide.slug}`,
      ...(guide.publishedAt && { publishedTime: guide.publishedAt.toISOString() }),
    },
  };
}

export default function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="container-page pt-32 pb-20" aria-label="Loading guide">
          <div className="h-10 w-2/3 animate-pulse rounded bg-ivory-deep" />
          <div className="mt-8 space-y-3">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="h-4 animate-pulse rounded bg-ivory-deep" />
            ))}
          </div>
        </div>
      }
    >
      <GuideContent params={params} />
    </Suspense>
  );
}

async function GuideContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublishedGuide(slug);

  if (result.status === "error") throw new Error("Guide could not be loaded");
  if (result.status !== "ok" || !result.guide) notFound();

  return <GuideArticle guide={result.guide} />;
}
