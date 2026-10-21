import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LinkButton } from "@/components/ui/link-button";
import { setGuideStatusAction } from "@/features/admin/actions/guides";
import { AdminHeading } from "@/features/admin/components/admin-heading";
import { GuideForm, type GuideFormValues } from "@/features/admin/components/guide-form";
import { StatusActionForm } from "@/features/admin/components/status-action-form";
import { getAdminGuide } from "@/features/admin/guides";

export const metadata: Metadata = { title: "Edit guide" };

export default async function EditGuidePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const result = await getAdminGuide(id);

  if (result.status === "unconfigured") {
    return (
      <>
        <AdminHeading eyebrow="Editorial" title="Edit guide" />
        <p className="rounded-md border border-gold/50 bg-gold/10 p-4 text-sm">
          Connect a database to edit guides.
        </p>
      </>
    );
  }
  if (result.status === "error") throw new Error("Could not load guide");
  if (!result.guide) notFound();

  const guide = result.guide;
  const values: GuideFormValues = {
    id: guide.id,
    slug: guide.slug,
    title: guide.title,
    excerpt: guide.excerpt,
    body: guide.body,
    status: guide.status,
  };
  const flash =
    query.created === "1"
      ? "Guide created and saved."
      : query.saved === "1"
        ? "Changes saved."
        : null;

  return (
    <>
      <AdminHeading
        eyebrow="Editorial"
        title={guide.title}
        intro={
          <>
            <span className="font-mono text-xs">{guide.slug}</span>
            {guide.author ? ` · ${guide.author.name || guide.author.email}` : ""}
          </>
        }
        actions={
          <>
            <LinkButton href={`/admin/guides/${id}/preview`} variant="outline" size="sm">
              Preview
            </LinkButton>
            {guide.status === "PUBLISHED" ? (
              <LinkButton href={`/guides/${guide.slug}`} variant="outline" size="sm">
                Public page
              </LinkButton>
            ) : null}
          </>
        }
      />

      {flash ? (
        <p role="status" className="mb-4 rounded-md border border-teal/40 bg-teal/10 px-4 py-3 text-sm text-teal-button">
          {flash}
        </p>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-md border border-border bg-white px-4 py-3">
        <span className="text-sm font-medium text-navy">Publication</span>
        {guide.status === "PUBLISHED" ? (
          <>
            <StatusActionForm
              id={id}
              intent="unpublish"
              label="Unpublish"
              action={setGuideStatusAction}
            />
            <StatusActionForm
              id={id}
              intent="archive"
              label="Archive"
              action={setGuideStatusAction}
              confirmMessage={`Archive ${guide.title}?`}
              variant="destructive"
            />
          </>
        ) : guide.status === "ARCHIVED" ? (
          <StatusActionForm
            id={id}
            intent="restore"
            label="Restore to draft"
            action={setGuideStatusAction}
          />
        ) : (
          <>
            <StatusActionForm
              id={id}
              intent="publish"
              label="Publish"
              action={setGuideStatusAction}
              variant="accent"
            />
            <StatusActionForm
              id={id}
              intent="archive"
              label="Archive"
              action={setGuideStatusAction}
              confirmMessage={`Archive ${guide.title}?`}
              variant="destructive"
            />
          </>
        )}
        <Link
          href="/admin/guides"
          className="ml-auto text-sm font-medium text-himalaya underline-offset-4 hover:underline"
        >
          Back to all guides
        </Link>
      </div>

      <GuideForm mode="edit" values={values} />
    </>
  );
}
