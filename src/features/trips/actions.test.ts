import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createTrip: vi.fn(),
  updateTrip: vi.fn(),
  deleteTrip: vi.fn(),
  addTripStop: vi.fn(),
  removeTripStop: vi.fn(),
  reorderTripStops: vi.fn(),
  updateTripStop: vi.fn(),
}));

vi.mock("@/features/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("./service", () => ({
  createTrip: mocks.createTrip,
  updateTrip: mocks.updateTrip,
  deleteTrip: mocks.deleteTrip,
  addTripStop: mocks.addTripStop,
  removeTripStop: mocks.removeTripStop,
  reorderTripStops: mocks.reorderTripStops,
  updateTripStop: mocks.updateTripStop,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import {
  addTripStopAction,
  createTripAction,
  deleteTripAction,
  removeTripStopAction,
  reorderTripStopsAction,
  updateTripAction,
  updateTripStopAction,
} from "./actions";

const idle = { status: "idle" as const };
const user = { id: "user-1", email: "traveller@example.com", name: null, role: "USER" as const };

function form(fields: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) for (const entry of value) data.append(key, entry);
    else data.set(key, value);
  }
  return data;
}

const service = () => [
  mocks.createTrip,
  mocks.updateTrip,
  mocks.deleteTrip,
  mocks.addTripStop,
  mocks.removeTripStop,
  mocks.reorderTripStops,
  mocks.updateTripStop,
];

describe("trip server actions", () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockReset();
    for (const mock of service()) mock.mockReset();
  });

  it("refuses every mutation when signed out", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const results = await Promise.all([
      createTripAction(idle, form({ title: "A trip" })),
      updateTripAction(idle, form({ id: "trip-1", title: "A trip" })),
      deleteTripAction(idle, form({ id: "trip-1" })),
      addTripStopAction(idle, form({ tripId: "trip-1", slug: "rara-lake" })),
      removeTripStopAction(idle, form({ tripId: "trip-1", stopId: "stop-1" })),
      reorderTripStopsAction(idle, form({ tripId: "trip-1", order: ["stop-1"] })),
      updateTripStopAction(idle, form({ tripId: "trip-1", stopId: "stop-1", notes: "Note" })),
    ]);

    for (const result of results) {
      expect(result).toMatchObject({ status: "error", message: /sign in/i });
    }
    // Nothing reached the database layer.
    for (const mock of service()) expect(mock).not.toHaveBeenCalled();
  });

  it("validates input before calling the service", async () => {
    mocks.getCurrentUser.mockResolvedValue(user);

    const create = await createTripAction(idle, form({ title: "x" }));
    expect(create).toMatchObject({ status: "error", fieldErrors: { title: expect.any(String) } });

    const update = await updateTripAction(idle, form({ id: "trip-1", title: "x" }));
    expect(update).toMatchObject({ status: "error", fieldErrors: { title: expect.any(String) } });

    const add = await addTripStopAction(idle, form({ tripId: "trip-1", slug: "Bad Slug" }));
    expect(add).toMatchObject({ status: "error", fieldErrors: { slug: expect.any(String) } });

    const order = await reorderTripStopsAction(
      idle,
      form({ order: ["stop-1", "stop-2"] }),
    );
    expect(order).toMatchObject({ status: "error", message: /order/i });

    for (const mock of service()) expect(mock).not.toHaveBeenCalled();
  });

  it("reports a missing trip instead of pretending the change worked", async () => {
    mocks.getCurrentUser.mockResolvedValue(user);
    mocks.updateTrip.mockResolvedValue({ status: "not_found" });

    const result = await updateTripAction(idle, form({ id: "trip-1", title: "A real trip" }));
    expect(result).toEqual({
      status: "error",
      message: "That trip wasn’t found.",
      fieldErrors: {},
      values: {},
    });
    expect(mocks.updateTrip).toHaveBeenCalledWith(user, "trip-1", {
      title: "A real trip",
      notes: undefined,
    });
  });

  it("maps ordering and duplicate-stop conflicts to friendly errors", async () => {
    mocks.getCurrentUser.mockResolvedValue(user);
    mocks.reorderTripStops.mockResolvedValue({ status: "invalid_order" });
    mocks.addTripStop.mockResolvedValue({ status: "already_added" });

    expect(
      await reorderTripStopsAction(idle, form({ tripId: "trip-1", order: ["stop-1", "stop-2"] })),
    ).toMatchObject({ status: "error", message: /changed since this page loaded/i });

    expect(
      await addTripStopAction(idle, form({ tripId: "trip-1", slug: "rara-lake" })),
    ).toMatchObject({ status: "error", message: "That place is already in this trip." });
  });
});
