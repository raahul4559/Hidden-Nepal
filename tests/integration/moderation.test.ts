// @vitest-environment node
/**
 * Community submission moderation against a real PostgreSQL database named
 * *_test. Skipped unless TEST_DATABASE_URL is set. Only Auth.js is mocked;
 * permissions, transitions, rate limits and audit records all run for real.
 */
import "dotenv/config";

import { execFileSync } from "node:child_process";

import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  return {
    auth: vi.fn(),
    headers: new Headers({ "x-forwarded-for": "203.0.113.30" }),
  };
});

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));
vi.mock("next/server", async (original) => ({
  ...(await original<object>()),
  connection: async () => {},
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const url = process.env.TEST_DATABASE_URL;

type TestUser = { id: string; email: string; sessionVersion: number };

describe.skipIf(!url)("community moderation (integration)", () => {
  let prisma: PrismaClient;
  let alice: TestUser;
  let admin: TestUser;

  beforeAll(async () => {
    const dbName = new URL(url!).pathname.slice(1);
    if (!dbName.endsWith("_test")) {
      throw new Error(`TEST_DATABASE_URL must end in _test (got "${dbName}").`);
    }

    execFileSync("npx", ["prisma", "migrate", "deploy"], {
      env: { ...process.env, DATABASE_URL: url },
      stdio: "pipe",
    });

    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url! }) });
    await prisma.$executeRawUnsafe(
      'TRUNCATE "TripStop", "Trip", "AuditLog", "TravelGuide", "SavedDestination", "RateLimit", "PlaceSubmission", "DestinationSource", "DestinationActivity", "Activity", "DestinationImage", "DestinationSeason", "DestinationCategory", "Destination", "Category", "Region", "User" CASCADE',
    );

    const { seedDatabase } = await import("../../prisma/seed/index");
    await seedDatabase(prisma, { samples: false, researched: false, instagram: false });

    alice = await makeUser("alice@example.com");
    admin = await makeUser("admin@example.com", "ADMIN");
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  beforeEach(() => {
    signedInAs(null);
  });

  function signedInAs(user: TestUser | null) {
    mocks.auth.mockResolvedValue(
      user
        ? {
            user: { id: user.id },
            sessionVersion: user.sessionVersion,
            expires: "2099-01-01T00:00:00Z",
          }
        : null,
    );
  }

  async function makeUser(email: string, role: "USER" | "ADMIN" = "USER"): Promise<TestUser> {
    return prisma.user.create({
      data: { email, role },
      select: { id: true, email: true, sessionVersion: true },
    });
  }

  function form(fields: Record<string, string>) {
    const data = new FormData();
    for (const [key, value] of Object.entries(fields)) data.set(key, value);
    return data;
  }

  const asCurrent = (user: TestUser) => ({
    id: user.id,
    email: user.email,
    name: null,
    role: user === admin ? ("ADMIN" as const) : ("USER" as const),
  });

  async function createSubmission(placeName: string) {
    return prisma.placeSubmission.create({
      data: {
        placeName,
        description: "A pending suggestion created directly for a moderation test.",
        consentToShare: true,
      },
    });
  }

  async function auditActions(entityId: string) {
    const rows = await prisma.auditLog.findMany({
      where: { entityType: "PlaceSubmission", entityId },
      orderBy: { createdAt: "asc" },
      select: { action: true },
    });
    return rows.map((row) => row.action);
  }

  async function destinationCount() {
    return prisma.destination.count();
  }

  it("links a suggestion to the signed-in account and ignores identity fields in the form", async () => {
    signedInAs(alice);
    mocks.headers = new Headers({ "x-forwarded-for": "203.0.113.41" });
    const before = await destinationCount();

    const { submitPlace } = await import("@/features/submissions/actions");
    const result = await submitPlace(
      { status: "idle" },
      form({
        placeName: "Linked suggestion",
        region: "koshi",
        district: "Bhojpur",
        category: "waterfalls",
        description: "A suggestion submitted while signed in, with coordinates attached.",
        latitude: "27.123456",
        longitude: "87.123456",
        submitterName: "Alice",
        submitterEmail: "ALICE@Example.com",
        submitterId: "someone-else",
        consentToShare: "on",
      }),
    );

    expect(result).toEqual({ status: "success" });
    const saved = await prisma.placeSubmission.findFirstOrThrow({
      where: { placeName: "Linked suggestion" },
    });
    expect(saved).toMatchObject({
      submitterId: alice.id,
      submitterName: "Alice",
      submitterEmail: "alice@example.com",
      status: "PENDING",
      reviewerId: null,
      reviewedAt: null,
      district: "Bhojpur",
    });
    expect(Number(saved.latitude)).toBe(27.123456);
    expect(Number(saved.longitude)).toBe(87.123456);
    // Submission alone never creates catalogue content.
    expect(await destinationCount()).toBe(before);
  });

  it("rate-limits anonymous submissions per client address", async () => {
    signedInAs(null);
    mocks.headers = new Headers({ "x-forwarded-for": "198.51.100.41" });
    const { submitPlace } = await import("@/features/submissions/actions");

    const attempt = (n: number) =>
      submitPlace(
        { status: "idle" },
        form({
          placeName: `Burst suggestion ${n}`,
          description: "A valid suggestion sent in a burst to exercise the rate limit.",
          consentToShare: "on",
        }),
      );

    for (let n = 0; n < 5; n++) {
      expect(await attempt(n)).toEqual({ status: "success" });
    }
    const blocked = await attempt(5);
    expect(blocked).toMatchObject({ status: "error", message: /try again in about/i });
    expect(
      await prisma.placeSubmission.count({ where: { placeName: { startsWith: "Burst suggestion" } } }),
    ).toBe(5);
  });

  it("refuses moderation from a non-admin and leaves the queue unchanged", async () => {
    const submission = await createSubmission("Ordinary user probe");
    signedInAs(alice);

    const { reviewSubmissionAction } = await import("@/features/admin/actions/submissions");
    const action = await reviewSubmissionAction(
      { status: "idle" },
      form({ id: submission.id, intent: "approve" }),
    );
    expect(action).toEqual({ status: "error", message: "You don’t have permission to do that" });

    // Even a caller that skips the action guard is refused by the service.
    const { reviewSubmission } = await import("@/features/admin/submissions");
    await expect(
      reviewSubmission(asCurrent(alice), { id: submission.id, intent: "approve" }),
    ).rejects.toMatchObject({ status: 403 });

    expect(
      await prisma.placeSubmission.findUniqueOrThrow({ where: { id: submission.id } }),
    ).toMatchObject({ status: "PENDING", reviewerId: null, reviewedAt: null });
  });

  it("records approve, reject, request-changes and reopen decisions with reviewer and timestamps", async () => {
    signedInAs(admin);
    const { reviewSubmissionAction } = await import("@/features/admin/actions/submissions");
    const review = (id: string, intent: string, explanation?: string) =>
      reviewSubmissionAction(
        { status: "idle" },
        form({ id, intent, ...(explanation !== undefined && { explanation }) }),
      );

    const before = await destinationCount();

    const approved = await createSubmission("Approve me");
    expect(await review(approved.id, "approve")).toMatchObject({
      status: "ok",
      message: "Approved. Nothing was published.",
    });
    const approvedRow = await prisma.placeSubmission.findUniqueOrThrow({
      where: { id: approved.id },
    });
    expect(approvedRow.status).toBe("APPROVED");
    expect(approvedRow.reviewerId).toBe(admin.id);
    expect(approvedRow.reviewedAt).not.toBeNull();
    expect(await auditActions(approved.id)).toEqual(["submission.approved"]);
    // Approval is a decision, never a publication step.
    expect(await destinationCount()).toBe(before);
    expect(await review(approved.id, "approve")).toMatchObject({
      status: "error",
      message: /isn’t available/i,
    });

    const rejected = await createSubmission("Reject me");
    const missing = await review(rejected.id, "reject");
    expect(missing).toMatchObject({ status: "error", message: /Explain why/i });
    expect(
      await prisma.placeSubmission.findUniqueOrThrow({ where: { id: rejected.id } }),
    ).toMatchObject({ status: "PENDING" });

    expect(await review(rejected.id, "reject", "  Not a real place.  ")).toMatchObject({
      status: "ok",
    });
    expect(
      await prisma.placeSubmission.findUniqueOrThrow({ where: { id: rejected.id } }),
    ).toMatchObject({
      status: "REJECTED",
      reviewNotes: "Not a real place.",
      reviewerId: admin.id,
    });

    const changes = await createSubmission("Change me");
    expect(await review(changes.id, "request_changes", "Add the district, please.")).toMatchObject({
      status: "ok",
    });
    expect(
      await prisma.placeSubmission.findUniqueOrThrow({ where: { id: changes.id } }),
    ).toMatchObject({ status: "CHANGES_REQUESTED", reviewNotes: "Add the district, please." });

    expect(await review(changes.id, "reopen")).toMatchObject({ status: "ok" });
    expect(
      await prisma.placeSubmission.findUniqueOrThrow({ where: { id: changes.id } }),
    ).toMatchObject({
      status: "PENDING",
      // Reopening keeps the previous explanation as history.
      reviewNotes: "Add the district, please.",
      reviewerId: admin.id,
    });

    expect(await auditActions(changes.id)).toEqual([
      "submission.changes_requested",
      "submission.reopened",
    ]);
  });
});
