import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { SubmissionStatus } from "@/generated/prisma/enums";
import { AuthorizationError, type CurrentUser, isAdmin } from "@/features/auth/session";

import { adminDb, adminRead, recordAudit } from "./data";
import type { AdminListFilters } from "./list-params";
import {
  isReviewAllowed,
  REVIEW_OUTCOMES,
  type ReviewIntent,
  SUBMISSION_STATUSES,
} from "./submission-review";

const PAGE_SIZE = 20;

export type AdminSubmissionFilters = AdminListFilters<SubmissionStatus>;

export type AdminSubmissionRow = {
  id: string;
  placeName: string;
  district: string | null;
  regionName: string | null;
  categoryName: string | null;
  status: SubmissionStatus;
  submitterName: string | null;
  submitterEmail: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewerEmail: string | null;
  hasImage: boolean;
};

export type SubmissionStatusCounts = Record<SubmissionStatus, number> & { total: number };

export function listAdminSubmissions(filters: AdminSubmissionFilters) {
  return adminRead("submission list", async (db) => {
    const where: Prisma.PlaceSubmissionWhereInput = {
      ...(filters.status !== "ALL" && { status: filters.status }),
      ...(filters.q && {
        OR: [
          { placeName: { contains: filters.q, mode: "insensitive" } },
          { district: { contains: filters.q, mode: "insensitive" } },
          { submitterName: { contains: filters.q, mode: "insensitive" } },
          { submitterEmail: { contains: filters.q, mode: "insensitive" } },
          { region: { name: { contains: filters.q, mode: "insensitive" } } },
        ],
      }),
    };

    // Decisions queue oldest-first; reviewed history reads newest-first.
    const orderBy: Prisma.PlaceSubmissionOrderByWithRelationInput[] =
      filters.status === "PENDING" || filters.status === "CHANGES_REQUESTED"
        ? [{ createdAt: "asc" }, { id: "asc" }]
        : [{ createdAt: "desc" }, { id: "asc" }];

    const [total, rows] = await db.$transaction([
      db.placeSubmission.count({ where }),
      db.placeSubmission.findMany({
        where,
        orderBy,
        skip: (filters.page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          placeName: true,
          district: true,
          status: true,
          submitterName: true,
          submitterEmail: true,
          createdAt: true,
          reviewedAt: true,
          imageUrl: true,
          region: { select: { name: true } },
          category: { select: { name: true } },
          reviewer: { select: { email: true } },
        },
      }),
    ]);

    // Tab counts cover the whole queue, not just the current filter.
    const grouped = await db.placeSubmission.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    const counts = Object.fromEntries(
      SUBMISSION_STATUSES.map((status) => [status, 0]),
    ) as Record<SubmissionStatus, number>;
    for (const row of grouped) counts[row.status] = row._count._all;

    const submissions: AdminSubmissionRow[] = rows.map((row) => ({
      id: row.id,
      placeName: row.placeName,
      district: row.district,
      regionName: row.region?.name ?? null,
      categoryName: row.category?.name ?? null,
      status: row.status,
      submitterName: row.submitterName,
      submitterEmail: row.submitterEmail,
      createdAt: row.createdAt,
      reviewedAt: row.reviewedAt,
      reviewerEmail: row.reviewer?.email ?? null,
      hasImage: row.imageUrl !== null,
    }));

    return {
      submissions,
      total,
      page: filters.page,
      pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      pageSize: PAGE_SIZE,
      counts: {
        ...counts,
        total: Object.values(counts).reduce((sum, n) => sum + n, 0),
      } satisfies SubmissionStatusCounts,
    };
  });
}

export function getAdminSubmission(id: string) {
  return adminRead("submission detail", async (db) => {
    const submission = await db.placeSubmission.findUnique({
      where: { id },
      select: {
        id: true,
        placeName: true,
        district: true,
        locationDetails: true,
        description: true,
        latitude: true,
        longitude: true,
        imageUrl: true,
        imageAlt: true,
        submitterName: true,
        submitterEmail: true,
        submitterId: true,
        consentToShare: true,
        status: true,
        reviewNotes: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
        region: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
        reviewer: { select: { name: true, email: true } },
        submitter: { select: { name: true, email: true } },
      },
    });
    return { submission };
  });
}

export type ReviewResult =
  | { status: "ok"; submissionId: string; newStatus: SubmissionStatus }
  | { status: "not_found" }
  | { status: "not_allowed"; currentStatus: SubmissionStatus };

/**
 * Records a moderation decision. The actor is an admin verified by the caller.
 *
 * Approving only changes the submission's status: it never creates, publishes
 * or edits a Destination. Catalogue copy is researched and entered separately,
 * so an unverified suggestion can never reach travellers by being approved.
 */
export async function reviewSubmission(
  actor: CurrentUser,
  input: { id: string; intent: ReviewIntent; explanation?: string },
): Promise<ReviewResult> {
  // Re-checked next to the data, so a future caller that forgets the page or
  // action guard still cannot moderate suggestions.
  if (!isAdmin(actor)) throw new AuthorizationError(403);

  const outcome = REVIEW_OUTCOMES[input.intent];

  return adminDb().$transaction(async (tx) => {
    const submission = await tx.placeSubmission.findUnique({
      where: { id: input.id },
      select: { id: true, status: true },
    });
    if (!submission) return { status: "not_found" as const };
    if (!isReviewAllowed(submission.status, input.intent)) {
      return { status: "not_allowed" as const, currentStatus: submission.status };
    }

    await tx.placeSubmission.update({
      where: { id: submission.id },
      data: {
        status: outcome.status,
        reviewerId: actor.id,
        reviewedAt: new Date(),
        // Reopening without a note keeps the previous explanation as history.
        ...(input.explanation ? { reviewNotes: input.explanation } : {}),
      },
    });

    await recordAudit(
      tx,
      actor.id,
      outcome.auditAction,
      "PlaceSubmission",
      submission.id,
      {
        from: submission.status,
        to: outcome.status,
        ...(input.explanation ? { explanation: input.explanation } : {}),
      },
    );

    return { status: "ok" as const, submissionId: submission.id, newStatus: outcome.status };
  });
}

export { PAGE_SIZE as SUBMISSION_PAGE_SIZE };
