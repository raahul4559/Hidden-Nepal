// @vitest-environment node
/**
 * Trip planning against a real PostgreSQL database named *_test. Skipped
 * unless TEST_DATABASE_URL is set. Only Auth.js is mocked: the session
 * lookup returns the account a test is signed in as, and everything after
 * that (ownership scoping, ordering, constraints) runs for real.
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
    headers: new Headers({ "x-forwarded-for": "203.0.113.20" }),
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

describe.skipIf(!url)("trip planning (integration)", () => {
  let prisma: PrismaClient;
  let alice: TestUser;
  let bob: TestUser;

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
    const { upsertDestination } = await import("../../prisma/seed/destinations");
    await seedDatabase(prisma, { samples: false, researched: false, instagram: false });

    const base = {
      summary: "Integration-test destination for trip planning.",
      regionSlug: "koshi" as const,
      categorySlugs: ["villages" as const],
      practicalInfo: { status: "UNVERIFIED" as const },
    };
    for (const [slug, name] of [
      ["trip-place-one", "Trip Place One"],
      ["trip-place-two", "Trip Place Two"],
    ]) {
      await upsertDestination(prisma, {
        ...base,
        slug,
        name,
        status: "PUBLISHED",
        publishedAt: new Date(),
      });
    }
    await upsertDestination(prisma, { ...base, slug: "trip-place-draft", name: "Trip Place Draft", status: "DRAFT" });

    alice = await makeUser("alice@example.com");
    bob = await makeUser("bob@example.com");
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

  async function makeUser(email: string): Promise<TestUser> {
    return prisma.user.create({
      data: { email },
      select: { id: true, email: true, sessionVersion: true },
    });
  }

  function form(fields: Record<string, string | string[]>) {
    const data = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      if (Array.isArray(value)) for (const entry of value) data.append(key, entry);
      else data.set(key, value);
    }
    return data;
  }

  const asCurrent = (user: TestUser) => ({
    id: user.id,
    email: user.email,
    name: null,
    role: "USER" as const,
  });

  /** Server-side redirect() throws an error whose digest names the target. */
  async function interruption(promise: Promise<unknown>) {
    try {
      await promise;
    } catch (error) {
      return String((error as { digest?: string }).digest ?? error);
    }
    return "no interruption";
  }

  const actions = () => import("@/features/trips/actions");
  const service = () => import("@/features/trips/service");

  async function createTripFor(user: TestUser, title: string) {
    const { createTrip } = await service();
    const result = await createTrip(asCurrent(user), title);
    if (result.status !== "ok") throw new Error(`Could not create trip: ${result.status}`);
    return result.id;
  }

  it("creates a trip through the action and persists renamed details", async () => {
    signedInAs(alice);
    const { createTripAction, updateTripAction } = await actions();

    const redirect = await interruption(
      createTripAction({ status: "idle" }, form({ title: "  Kathmandu Valley  " })),
    );
    expect(redirect).toMatch(/NEXT_REDIRECT.*\/trips\//);

    const trip = await prisma.trip.findFirstOrThrow({ where: { userId: alice.id } });
    expect(trip).toMatchObject({ title: "Kathmandu Valley", notes: null, visibility: "PRIVATE" });

    const update = await updateTripAction(
      { status: "idle" },
      form({ id: trip.id, title: "Valley and hills", notes: "Three days, two nights." }),
    );
    expect(update).toEqual({ status: "ok", message: "Trip details saved." });

    const { getTrip } = await service();
    const view = await getTrip(asCurrent(alice), trip.id);
    expect(view.status === "ok" && view.trip).toMatchObject({
      title: "Valley and hills",
      notes: "Three days, two nights.",
      visibility: "PRIVATE",
      stops: [],
    });
  });

  it("adds, reorders, annotates and removes stops, keeping positions gapless", async () => {
    signedInAs(alice);
    const { addTripStopAction, reorderTripStopsAction, updateTripStopAction, removeTripStopAction } =
      await actions();
    const tripId = await createTripFor(alice, "Loop");

    expect(await addTripStopAction({ status: "idle" }, form({ tripId, slug: "trip-place-one" }))).toMatchObject({
      status: "ok",
    });
    expect(await addTripStopAction({ status: "idle" }, form({ tripId, slug: "trip-place-two" }))).toMatchObject({
      status: "ok",
    });
    // A draft destination and a duplicate are both refused.
    expect(await addTripStopAction({ status: "idle" }, form({ tripId, slug: "trip-place-draft" }))).toMatchObject({
      status: "error",
      message: /no longer available/i,
    });
    expect(await addTripStopAction({ status: "idle" }, form({ tripId, slug: "trip-place-one" }))).toMatchObject({
      status: "error",
      message: /already in this trip/i,
    });

    const saved = await prisma.tripStop.findMany({
      where: { tripId },
      orderBy: { position: "asc" },
      include: { destination: { select: { slug: true } } },
    });
    expect(saved.map((stop) => [stop.destination?.slug, stop.position])).toEqual([
      ["trip-place-one", 0],
      ["trip-place-two", 1],
    ]);

    const [first, second] = saved;
    expect(
      await reorderTripStopsAction(
        { status: "idle" },
        form({ tripId, order: [second.id, first.id] }),
      ),
    ).toMatchObject({ status: "ok" });

    const reordered = await prisma.tripStop.findMany({
      where: { tripId },
      orderBy: { position: "asc" },
      select: { id: true, position: true },
    });
    expect(reordered).toEqual([
      { id: second.id, position: 0 },
      { id: first.id, position: 1 },
    ]);

    // Anything that is not exactly the saved stops is rejected, unchanged.
    expect(
      await reorderTripStopsAction(
        { status: "idle" },
        form({ tripId, order: [first.id, "someone-elses-stop"] }),
      ),
    ).toMatchObject({ status: "error", message: /changed since this page loaded/i });
    expect(
      (
        await prisma.tripStop.findMany({
          where: { tripId },
          orderBy: { position: "asc" },
          select: { id: true },
        })
      ).map((stop) => stop.id),
    ).toEqual([second.id, first.id]);

    expect(
      await updateTripStopAction(
        { status: "idle" },
        form({ tripId, stopId: first.id, notes: "  Reach before noon  ", day: "2" }),
      ),
    ).toMatchObject({ status: "ok" });
    expect(
      await prisma.tripStop.findUniqueOrThrow({ where: { id: first.id } }),
    ).toMatchObject({ notes: "Reach before noon", day: 2 });

    // Invalid days are rejected before touching the saved stop.
    const badDay = await updateTripStopAction(
      { status: "idle" },
      form({ tripId, stopId: first.id, notes: "Changed", day: "61" }),
    );
    expect(badDay).toMatchObject({ status: "error", fieldErrors: { day: expect.any(String) } });
    expect(
      await prisma.tripStop.findUniqueOrThrow({ where: { id: first.id } }),
    ).toMatchObject({ notes: "Reach before noon", day: 2 });

    expect(
      await removeTripStopAction({ status: "idle" }, form({ tripId, stopId: second.id })),
    ).toMatchObject({ status: "ok" });
    expect(
      await prisma.tripStop.findMany({
        where: { tripId },
        select: { id: true, position: true },
      }),
    ).toEqual([{ id: first.id, position: 0 }]);
  });

  it("scopes every read and mutation to the signed-in owner", async () => {
    signedInAs(alice);
    const aliceTrip = await createTripFor(alice, "Alice's trip");
    const { addTripStop } = await service();
    const added = await addTripStop(asCurrent(alice), aliceTrip, "trip-place-one");
    expect(added.status).toBe("ok");
    const stopId = added.status === "ok" ? added.stopId : "";

    signedInAs(bob);
    const { getTrip, listTrips } = await service();
    const { updateTripAction, deleteTripAction, addTripStopAction, removeTripStopAction, reorderTripStopsAction } =
      await actions();

    expect(await getTrip(asCurrent(bob), aliceTrip)).toEqual({ status: "not_found" });
    expect(await listTrips(asCurrent(bob))).toEqual([]);

    expect(
      await updateTripAction({ status: "idle" }, form({ id: aliceTrip, title: "Hijacked" })),
    ).toMatchObject({ status: "error", message: /wasn’t found/i });
    expect(
      await deleteTripAction({ status: "idle" }, form({ id: aliceTrip })),
    ).toMatchObject({ status: "error", message: /wasn’t found/i });
    expect(
      await addTripStopAction({ status: "idle" }, form({ tripId: aliceTrip, slug: "trip-place-two" })),
    ).toMatchObject({ status: "error", message: /wasn’t found/i });
    expect(
      await removeTripStopAction({ status: "idle" }, form({ tripId: aliceTrip, stopId })),
    ).toMatchObject({ status: "error", message: /wasn’t found/i });
    expect(
      await reorderTripStopsAction({ status: "idle" }, form({ tripId: aliceTrip, order: [stopId] })),
    ).toMatchObject({ status: "error", message: /wasn’t found/i });

    // Alice's trip is untouched and Bob only ever sees his own trips.
    const unchanged = await prisma.trip.findUniqueOrThrow({
      where: { id: aliceTrip },
      include: { stops: true },
    });
    expect(unchanged).toMatchObject({ userId: alice.id, title: "Alice's trip" });
    expect(unchanged.stops).toHaveLength(1);

    await createTripFor(bob, "Bob's trip");
    expect((await listTrips(asCurrent(bob))).map((trip) => trip.title)).toEqual(["Bob's trip"]);
    const aliceTitles = (await listTrips(asCurrent(alice))).map((trip) => trip.title);
    expect(aliceTitles).toContain("Alice's trip");
    expect(aliceTitles).not.toContain("Bob's trip");
  });

  it("deletes a trip and its stops without touching the destinations", async () => {
    signedInAs(alice);
    const tripId = await createTripFor(alice, "To delete");
    const { addTripStop } = await service();
    await addTripStop(asCurrent(alice), tripId, "trip-place-one");

    const { deleteTripAction } = await actions();
    const redirect = await interruption(deleteTripAction({ status: "idle" }, form({ id: tripId })));
    expect(redirect).toMatch(/NEXT_REDIRECT.*\/trips/);

    expect(await prisma.trip.findUnique({ where: { id: tripId } })).toBeNull();
    expect(await prisma.tripStop.count({ where: { tripId } })).toBe(0);
    expect(await prisma.destination.count({ where: { slug: "trip-place-one" } })).toBe(1);
  });

  it("caps one account at the trip limit", async () => {
    const heavy = await makeUser("heavy@example.com");
    signedInAs(heavy);
    await prisma.trip.createMany({
      data: Array.from({ length: 20 }, (_, i) => ({ userId: heavy.id, title: `Trip ${i + 1}` })),
    });

    const { createTripAction } = await actions();
    const result = await createTripAction({ status: "idle" }, form({ title: "One more" }));
    expect(result).toMatchObject({ status: "error", message: /limit of 20 saved trips/i });
    expect(await prisma.trip.count({ where: { userId: heavy.id } })).toBe(20);
  });
});
