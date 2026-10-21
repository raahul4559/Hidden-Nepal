// @vitest-environment node
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";
import type { CurrentUser } from "@/features/auth/session";

const marker = `zz-live-check-${Date.now()}`;
const destinationSlug = `${marker}-destination`;
const guideSlug = `${marker}-guide`;

describe("live admin persistence check", () => {
  let prisma: PrismaClient;
  let actor: CurrentUser;
  let temporaryUser = false;
  let adminDestinations: typeof import("@/features/admin/destinations");
  let adminGuides: typeof import("@/features/admin/guides");
  let publicDestinations: typeof import("@/features/destinations/queries");
  let publicGuides: typeof import("@/features/guides/queries");
  let destinationId: string | null = null;

  beforeAll(async () => {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is required");
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

    const existing = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, email: true, name: true, role: true },
    });
    if (existing) {
      actor = existing;
    } else {
      actor = await prisma.user.create({
        data: { email: `${marker}@example.com`, name: "Live check admin", role: "ADMIN" },
        select: { id: true, email: true, name: true, role: true },
      });
      temporaryUser = true;
    }

    adminDestinations = await import("@/features/admin/destinations");
    adminGuides = await import("@/features/admin/guides");
    publicDestinations = await import("@/features/destinations/queries");
    publicGuides = await import("@/features/guides/queries");
  }, 60_000);

  afterAll(async () => {
    if (destinationId) {
      await prisma.auditLog.deleteMany({ where: { entityId: destinationId } });
    }
    const guide = await prisma.travelGuide.findUnique({ where: { slug: guideSlug }, select: { id: true } });
    if (guide) await prisma.auditLog.deleteMany({ where: { entityId: guide.id } });
    await prisma.travelGuide.deleteMany({ where: { slug: guideSlug } });
    await prisma.destination.deleteMany({ where: { slug: destinationSlug } });
    if (temporaryUser) await prisma.user.deleteMany({ where: { id: actor.id } });
    await prisma.$disconnect();
    const appDb = await import("@/lib/db");
    await appDb.getDb()?.$disconnect();
  });

  it("creates, edits, publishes, archives, restores and persists a destination", async () => {
    const { adminDestinationFormSchema, formDataToAdminDestination } = await import(
      "@/features/admin/destination-validation"
    );
    const formData = new FormData();
    const fields = {
      slug: destinationSlug,
      name: "Live check destination",
      summary: "A temporary destination used to verify admin persistence in the live database.",
      status: "DRAFT",
      regionSlug: "bagmati",
      categorySlugs: "treks",
      seasons: "AUTUMN",
      practicalInfoStatus: "UNVERIFIED",
      currency: "NPR",
    };
    for (const [key, value] of Object.entries(fields)) formData.set(key, value);
    const data = adminDestinationFormSchema.parse(formDataToAdminDestination(formData));

    const created = await adminDestinations.createDestination(actor, data);
    expect(created.status).toBe("ok");
    if (created.status !== "ok") throw new Error(JSON.stringify(created));
    destinationId = created.id;

    const row = await prisma.destination.findUnique({ where: { id: created.id } });
    expect(row?.name).toBe("Live check destination");
    expect(row?.status).toBe("DRAFT");

    const updated = await adminDestinations.updateDestination(actor, created.id, {
      ...data,
      name: "Live check destination (edited)",
    });
    expect(updated.status).toBe("ok");
    expect((await prisma.destination.findUnique({ where: { id: created.id } }))?.name).toBe(
      "Live check destination (edited)",
    );

    const published = await adminDestinations.setDestinationStatus(actor, created.id, "publish");
    expect(published.status).toBe("ok");
    const publicPage = await publicDestinations.getDestinationBySlug(destinationSlug);
    expect(publicPage.status).toBe("ok");
    if (publicPage.status === "ok") expect(publicPage.destination?.name).toBe("Live check destination (edited)");

    await adminDestinations.setDestinationStatus(actor, created.id, "archive");
    const hidden = await publicDestinations.getDestinationBySlug(destinationSlug);
    expect(hidden.status).toBe("ok");
    if (hidden.status === "ok") expect(hidden.destination).toBeNull();

    await adminDestinations.setDestinationStatus(actor, created.id, "restore");
    const restored = await adminDestinations.getAdminDestinationForForm(created.id);
    expect(restored.status).toBe("ok");
    if (restored.status === "ok") expect(restored.destination?.status).toBe("DRAFT");

    const draft = await publicDestinations.getDestinationBySlug(destinationSlug);
    expect(draft.status).toBe("ok");
    if (draft.status === "ok") expect(draft.destination).toBeNull();

    const duplicate = await adminDestinations.createDestination(actor, data);
    expect(duplicate.status).toBe("invalid");

    const auditCount = await prisma.auditLog.count({ where: { entityId: created.id } });
    expect(auditCount).toBeGreaterThanOrEqual(4);
  }, 60_000);

  it("persists a guide and only publishes it on request", async () => {
    const created = await adminGuides.createGuide(actor, {
      slug: guideSlug,
      title: "Live check guide",
      excerpt: "A temporary guide used to verify persistence.",
      body: "This is a temporary guide body, long enough to pass validation and verify the live database.",
      status: "DRAFT",
    });
    expect(created.status).toBe("ok");
    if (created.status !== "ok") throw new Error(JSON.stringify(created));

    const hidden = await publicGuides.getPublishedGuide(guideSlug);
    expect(hidden.status).toBe("ok");
    if (hidden.status === "ok") expect(hidden.guide).toBeNull();

    await adminGuides.setGuideStatus(actor, created.id, "publish");
    const visible = await publicGuides.getPublishedGuide(guideSlug);
    expect(visible.status).toBe("ok");
    if (visible.status === "ok") expect(visible.guide?.title).toBe("Live check guide");

    const row = await prisma.travelGuide.findUnique({ where: { slug: guideSlug } });
    expect(row?.status).toBe("PUBLISHED");
    expect(row?.publishedAt).toBeInstanceOf(Date);
  }, 60_000);
});
