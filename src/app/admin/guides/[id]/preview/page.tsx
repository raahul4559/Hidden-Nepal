import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LinkButton } from "@/components/ui/link-button";
import { getAdminGuidePreview } from "@/features/admin/guides";
import { GuideArticle } from "@/features/guides/components/guide-article";

export const metadata: Metadata = { title: "Preview guide", robots: { index: false } };

export default async function PreviewGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getAdminGuidePreview(id);

  if (result.status === "unconfigured") {
    return (
      <p className="rounded-md border border-gold/50 bg-gold/10 p-4 text-sm">
        Connect a database to preview guides.
      </p>
    );
  }
  if (result.status === "error") throw new Error("Could not load guide preview");
  if (!result.guide) notFound();

  const guide = result.guide;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-gold/50 bg-gold/10 px-4 py-3 text-sm">
        <span className="font-semibold text-navy">
          {guide.status === "PUBLISHED" ? "Published preview" : `${guide.status.toLowerCase()} preview`}
        </span>
        <span className="text-ink-muted">
          {guide.status === "PUBLISHED"
            ? "This is the live public view."
            : "Only administrators can see this version."}
        </span>
        <Link
          href={`/admin/guides/${id}/edit`}
          className="ml-auto font-medium text-himalaya underline-offset-4 hover:underline"
        >
          Back to editor
        </Link>
      </div>
      <div className="overflow-hidden rounded-md border border-border bg-ivory">
        <GuideArticle guide={guide} />
      </div>
      <div className="mt-4">
        <LinkButton href={`/admin/guides/${id}/edit`} variant="outline">
          Edit guide
        </LinkButton>
      </div>
    </>
  );
}
