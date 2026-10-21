import "server-only";

import type { PublishStatus, SubmissionStatus } from "@/generated/prisma/enums";

import { adminRead } from "./data";

export type AdminActivity = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: Date;
  actor: { name: string | null; email: string } | null;
};

export type AdminDashboard = {
  destinations: Record<PublishStatus, number> & { total: number };
  submissions: Record<SubmissionStatus, number> & { total: number };
  guides: Record<PublishStatus, number> & { total: number };
  categories: number;
  recentActivity: AdminActivity[];
};

export function getAdminDashboard() {
  return adminRead("dashboard", async (db) => {
    const [
      publishedDestinations,
      draftDestinations,
      archivedDestinations,
      totalDestinations,
      pendingSubmissions,
      changesRequestedSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      spamSubmissions,
      publishedGuides,
      draftGuides,
      archivedGuides,
      totalGuides,
      categories,
      recentActivity,
    ] = await Promise.all([
      db.destination.count({ where: { status: "PUBLISHED" } }),
      db.destination.count({ where: { status: "DRAFT" } }),
      db.destination.count({ where: { status: "ARCHIVED" } }),
      db.destination.count(),
      db.placeSubmission.count({ where: { status: "PENDING" } }),
      db.placeSubmission.count({ where: { status: "CHANGES_REQUESTED" } }),
      db.placeSubmission.count({ where: { status: "APPROVED" } }),
      db.placeSubmission.count({ where: { status: "REJECTED" } }),
      db.placeSubmission.count({ where: { status: "SPAM" } }),
      db.travelGuide.count({ where: { status: "PUBLISHED" } }),
      db.travelGuide.count({ where: { status: "DRAFT" } }),
      db.travelGuide.count({ where: { status: "ARCHIVED" } }),
      db.travelGuide.count(),
      db.category.count(),
      db.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,
          actor: { select: { name: true, email: true } },
        },
      }),
    ]);

    return {
      destinations: {
        PUBLISHED: publishedDestinations,
        DRAFT: draftDestinations,
        ARCHIVED: archivedDestinations,
        total: totalDestinations,
      },
      submissions: {
        PENDING: pendingSubmissions,
        CHANGES_REQUESTED: changesRequestedSubmissions,
        APPROVED: approvedSubmissions,
        REJECTED: rejectedSubmissions,
        SPAM: spamSubmissions,
        total:
          pendingSubmissions +
          changesRequestedSubmissions +
          approvedSubmissions +
          rejectedSubmissions +
          spamSubmissions,
      },
      guides: {
        PUBLISHED: publishedGuides,
        DRAFT: draftGuides,
        ARCHIVED: archivedGuides,
        total: totalGuides,
      },
      categories,
      recentActivity,
    };
  });
}
