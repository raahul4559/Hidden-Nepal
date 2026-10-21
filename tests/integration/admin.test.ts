// @vitest-environment node
/**
 * Admin CRUD integration tests. Skipped unless TEST_DATABASE_URL points at a
 * disposable PostgreSQL database whose name ends in *_test.
 */
import "dotenv/config";

import { execFileSync } from "node:child_process";

import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";
import type { CurrentUser } from "@/features/auth/session";

import { seedReferenceData } from "../../prisma/seed/reference";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("admin CMS (integration)", () => {
  let prisma: PrismaClient;
  let actor: CurrentUser;
  let admin: typeof import("@/features/admin/destinations");
  let publicQueries: typeof import("@/features/destinations/queries");

  beforeAll(async () => {
    const dbName = new URL(url!).pathname.slice(1);
    if (!dbName.endsWith("_test")) {
      throw new Error(`TEST_DATABASE_URL must point at a *_test database (got "${dbName}").`);
    }

    execFileSync("npx", ["prisma", "migrate", "deploy"], {
      env: { ...process.env, DATABASE_URL: url },
      stdio: "pipe",
    });

    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url! }) });
    await prisma.$executeRawUnsafe(
      'TRUNCATE "AuditLog", "TravelGuide", "SavedDestination", "RateLimit", "PlaceSubmission", "DestinationSource", "DestinationActivity", "Activity", "DestinationImage", "DestinationSeason", "DestinationCategory", "Destination", "Category", "Region", "User" CASCADE',
    );
    await seedReferenceData(prisma);

    const user = await prisma.user.create({
      data: { email: "admin@example.com", name: "Test Admin", role: "ADMIN" },
      select: { id: true, email: true, name: true, role: true },
    });
    actor = user;

    // Point the app's database helper at the disposable test database before
    // importing modules that read the environment at startup.
    process.env.DATABASE_URL = url;
    admin = await import("@/features/admin/destinations");
    publicQueries = await import("@/features/destinations/queries");
  }, 60_000);

  afterAll(async () => {
    const db = await import("@/lib/db");
    await db.getDb()?.$disconnect();
    await prisma?.$disconnect();
  });

  async function destinationForm(overrides: Record<string, string> = {}) {
    const { adminDestinationFormSchema, formDataToAdminDestination } = await import(
      "@/features/admin/destination-validation"
    );
    const data = new FormData();
    const fields: Record<string, string> = {
      slug: "integration-test-place",
      name: "Integration Test Place",
      summary: "A destination created only by the integration test suite.",
      status: "DRAFT",
      regionSlug: "bagmati",
      categorySlugs: "treks",
      seasons: "AUTUMN",
      practicalInfoStatus: "UNVERIFIED",
      currency: "NPR",
      ...overrides,
    };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== "") data.set(key, value);
    }
    const parsed = adminDestinationFormSchema.parse(formDataToAdminDestination(data));
    return parsed;
  }

  it("creates, updates, publishes, archives and restores a destination", async () => {
    const created = await admin.createDestination(actor, await destinationForm());
    expect(created.status).toBe("ok");
    if (created.status !== "ok") return;

    const list = await admin.listAdminDestinations({ q: "integration", status: "ALL", page: 1 });
    expect(list.status).toBe("ok");
    if (list.status === "ok") {
      expect(list.destinations.some((row) => row.id === created.id)).toBe(true);
      expect(list.destinations[0]?.status).toBe("DRAFT");
    }

    const updated = await admin.updateDestination(
      actor,
      created.id,
      await destinationForm({ name: "Integration Test Place Updated" }),
    );
    expect(updated.status).toBe("ok");

    const form = await admin.getAdminDestinationForForm(created.id);
    expect(form.status).toBe("ok");
    if (form.status === "ok") expect(form.destination?.name).toBe("Integration Test Place Updated");

    const published = await admin.setDestinationStatus(actor, created.id, "publish");
    expect(published.status).toBe("ok");

    const publicPage = await publicQueries.getDestinationBySlug("integration-test-place");
    expect(publicPage.status).toBe("ok");
    if (publicPage.status === "ok") {
      expect(publicPage.destination?.name).toBe("Integration Test Place Updated");
    }

    await admin.setDestinationStatus(actor, created.id, "archive");
    const archived = await publicQueries.getDestinationBySlug("integration-test-place");
    expect(archived.status).toBe("ok");
    if (archived.status === "ok") expect(archived.destination).toBeNull();

    await admin.setDestinationStatus(actor, created.id, "restore");
    const restored = await admin.getAdminDestinationForForm(created.id);
    if (restored.status === "ok") expect(restored.destination?.status).toBe("DRAFT");

    const audit = await prisma.auditLog.count({ where: { entityId: created.id } });
    expect(audit).toBeGreaterThanOrEqual(4);
  });

  it("rejects duplicate slugs without overwriting the original", async () => {
    const created = await admin.createDestination(actor, await destinationForm({ slug: "unique-place" }));
    expect(created.status).toBe("ok");

    const duplicate = await admin.createDestination(
      actor,
      await destinationForm({ slug: "unique-place", name: "A different place" }),
    );
    expect(duplicate.status).toBe("invalid");
    if (duplicate.status === "invalid") {
      expect(duplicate.fieldErrors.slug).toMatch(/already/i);
    }
  });

  it("persists guides and only exposes published ones", async () => {
    const guides = await import("@/features/admin/guides");
    const publicGuides = await import("@/features/guides/queries");
    const created = await guides.createGuide(actor, {
      slug: "integration-guide",
      title: "Integration guide",
      excerpt: "An integration test guide.",
      body: "This body is long enough to satisfy validation and to be useful in the test suite.",
      status: "DRAFT",
    });
    expect(created.status).toBe("ok");
    if (created.status !== "ok") return;

    const draft = await publicGuides.getPublishedGuide("integration-guide");
    expect(draft.status).toBe("ok");
    if (draft.status === "ok") expect(draft.guide).toBeNull();

    await guides.setGuideStatus(actor, created.id, "publish");
    const published = await publicGuides.getPublishedGuide("integration-guide");
    expect(published.status).toBe("ok");
    if (published.status === "ok") expect(published.guide?.title).toBe("Integration guide");
  });
});
