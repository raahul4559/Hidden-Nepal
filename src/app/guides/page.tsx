import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { formatDate } from "@/features/destinations/format";
import { listPublishedGuides } from "@/features/guides/queries";

export const metadata: Metadata = {
  title: "Travel guides",
  description:
    "Long-form Hidden Nepal guides to regions, routes and local culture, written and checked by the editorial team.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Journal"
        title="Travel guides"
        intro="Longer reads for planning a trip: routes, context and the details that do not fit on a destination card."
      />
      <div className="container-page py-14 sm:py-20">
        <Suspense
          fallback={
            <div
              aria-hidden
              className="grid gap-5 md:grid-cols-2"
            >
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-52 animate-pulse rounded-md bg-ivory-deep" />
              ))}
            </div>
          }
        >
          <GuideList />
        </Suspense>
      </div>
    </>
  );
}

async function GuideList() {
  const result = await listPublishedGuides();

  return (
    <>
        {result.status === "unconfigured" ? (
          <p className="rounded-md border border-border bg-white p-6 text-sm text-ink-muted">
            Guides are unavailable until the database is connected.
          </p>
        ) : result.status === "error" ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            The guides could not be loaded. Please try again later.
          </p>
        ) : result.guides.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-white p-8 text-center text-sm text-ink-muted">
            No guides have been published yet.
          </p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2">
            {result.guides.map((guide) => (
              <li key={guide.slug}>
                <Link
                  href={`/guides/${guide.slug}`}
                  className="group flex h-full flex-col rounded-md border border-border bg-white p-6 transition-colors hover:border-navy/30 hover:bg-ivory/50"
                >
                  <p className="eyebrow text-himalaya">
                    {guide.publishedAt ? formatDate(guide.publishedAt) : "Travel guide"}
                  </p>
                  <h2 className="mt-3 font-serif text-2xl leading-snug text-navy group-hover:underline group-hover:underline-offset-4">
                    {guide.title}
                  </h2>
                  {guide.excerpt ? (
                    <p className="mt-3 text-sm leading-relaxed text-ink-muted">{guide.excerpt}</p>
                  ) : null}
                  <p className="mt-auto pt-5 text-sm font-medium text-himalaya">Read the guide →</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
    </>
  );
}
