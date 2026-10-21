import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LinkButton } from "@/components/ui/link-button";
import { AdminHeading } from "@/features/admin/components/admin-heading";
import { SubmissionReviewForm } from "@/features/admin/components/submission-review-form";
import { SubmissionStatusBadge } from "@/features/admin/components/submission-status-badge";
import { getAdminSubmission } from "@/features/admin/submissions";
import { formatDate } from "@/features/destinations/format";

export const metadata: Metadata = { title: "Review submission" };

function coordinates(latitude: unknown, longitude: unknown) {
  if (latitude == null || longitude == null) return null;
  return `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`;
}

export default async function AdminSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getAdminSubmission(id);

  if (result.status === "unconfigured") {
    return (
      <>
        <AdminHeading title="Review submission" eyebrow="Community" />
        <p className="rounded-md border border-gold/50 bg-gold/10 p-4 text-sm">
          Connect a database to moderate community suggestions.
        </p>
      </>
    );
  }
  if (result.status === "error") {
    throw new Error("Could not load the submission");
  }
  const submission = result.submission;
  if (!submission) notFound();

  const point = coordinates(submission.latitude, submission.longitude);

  return (
    <>
      <p className="mb-3 text-sm">
        <Link
          href="/admin/submissions"
          className="font-medium text-ink-muted underline-offset-4 hover:text-navy hover:underline"
        >
          ← Back to submissions
        </Link>
      </p>

      <AdminHeading
        eyebrow="Community suggestion"
        title={submission.placeName}
        intro={
          <>
            Received {formatDate(submission.createdAt)} · last updated{" "}
            {formatDate(submission.updatedAt)}
          </>
        }
        actions={
          <LinkButton href="/admin/destinations/new" variant="outline" size="sm">
            New destination
          </LinkButton>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-8">
          <section aria-labelledby="suggestion-heading" className="space-y-4">
            <h3 id="suggestion-heading" className="font-serif text-2xl text-navy">
              The suggestion
            </h3>
            <p className="whitespace-pre-line leading-relaxed text-navy">
              {submission.description}
            </p>

            <dl className="grid gap-x-6 gap-y-3 rounded-md border border-border bg-white p-5 text-sm sm:grid-cols-2">
              <Detail label="Province">{submission.region?.name ?? "Not sure"}</Detail>
              <Detail label="District">{submission.district ?? "Not given"}</Detail>
              <Detail label="Category">{submission.category?.name ?? "Not sure"}</Detail>
              <Detail label="Coordinates">{point ?? "Not given"}</Detail>
              <Detail label="Location details" full>
                {submission.locationDetails ?? "Not given"}
              </Detail>
            </dl>
          </section>

          <section aria-labelledby="photo-heading" className="space-y-3">
            <h3 id="photo-heading" className="font-serif text-2xl text-navy">
              Photo
            </h3>
            {submission.imageUrl ? (
              <div className="rounded-md border border-border bg-white p-5 text-sm">
                <a
                  href={submission.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="font-semibold text-himalaya underline underline-offset-2"
                >
                  Open the submitted photo
                </a>
                <p className="mt-2 text-ink-muted">
                  Alt text: {submission.imageAlt ?? "none supplied"}
                </p>
                <p className="mt-2 text-xs text-ink-muted">
                  The file was checked for type, size and signature on upload. It is not public
                  until an editor publishes it with a destination.
                </p>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">No photo was supplied.</p>
            )}
          </section>

          <section aria-labelledby="submitter-heading" className="space-y-3">
            <h3 id="submitter-heading" className="font-serif text-2xl text-navy">
              Submitter
            </h3>
            <dl className="grid gap-x-6 gap-y-3 rounded-md border border-border bg-white p-5 text-sm sm:grid-cols-2">
              <Detail label="Name">{submission.submitterName ?? "Anonymous"}</Detail>
              <Detail label="Contact email">{submission.submitterEmail ?? "Not given"}</Detail>
              <Detail label="Account">
                {submission.submitterId
                  ? submission.submitter
                    ? submission.submitter.email
                    : "Signed-in account"
                  : "Not signed in"}
              </Detail>
              <Detail label="Consent to share">
                {submission.consentToShare ? "Confirmed" : "Not confirmed"}
              </Detail>
            </dl>
            <p className="text-xs leading-relaxed text-ink-muted">
              Contact details are for follow-up only and are never published. Approving this
              suggestion does not grant permission to reuse the photo — confirm that separately.
            </p>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <section aria-labelledby="decision-heading" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 id="decision-heading" className="font-serif text-2xl text-navy">
                Decision
              </h3>
              <SubmissionStatusBadge status={submission.status} />
            </div>

            {submission.reviewedAt ? (
              <dl className="space-y-2 rounded-md border border-border bg-white p-4 text-sm">
                <Detail label="Last reviewed">
                  {formatDate(submission.reviewedAt)}
                  {submission.reviewer
                    ? ` by ${submission.reviewer.name ?? submission.reviewer.email}`
                    : ""}
                </Detail>
                {submission.reviewNotes ? (
                  <Detail label="Explanation">{submission.reviewNotes}</Detail>
                ) : null}
              </dl>
            ) : (
              <p className="text-sm text-ink-muted">No decision has been recorded yet.</p>
            )}
          </section>

          <SubmissionReviewForm id={submission.id} status={submission.status} />
        </aside>
      </div>
    </>
  );
}

function Detail({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</dt>
      <dd className="mt-0.5 break-words text-navy">{children}</dd>
    </div>
  );
}
