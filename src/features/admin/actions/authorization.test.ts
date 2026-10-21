import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ assertAdmin: vi.fn() }));

vi.mock("@/features/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth/session")>();
  return { ...actual, assertAdmin: mocks.assertAdmin };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { AuthorizationError } from "@/features/auth/session";

import { createDestinationAction, setDestinationStatusAction } from "./destinations";
import { createGuideAction } from "./guides";
import { uploadDestinationImage } from "./images";
import { updateCategoryAction } from "./categories";

const idle = { status: "idle" as const };

describe("admin server actions reject unauthorized callers", () => {
  beforeEach(() => {
    mocks.assertAdmin.mockRejectedValue(new AuthorizationError(403));
  });

  it("does not create a destination", async () => {
    const state = await createDestinationAction(idle, new FormData());
    expect(state.status).toBe("error");
    if (state.status === "error") expect(state.message).toMatch(/permission/i);
  });

  it("does not change destination status", async () => {
    const data = new FormData();
    data.set("id", "destination-1");
    data.set("intent", "publish");
    const state = await setDestinationStatusAction(idle, data);
    expect(state.status).toBe("error");
  });

  it("does not create a guide", async () => {
    const state = await createGuideAction(idle, new FormData());
    expect(state.status).toBe("error");
  });

  it("does not upload an image", async () => {
    const data = new FormData();
    data.set("destinationId", "destination-1");
    const state = await uploadDestinationImage(idle, data);
    expect(state.status).toBe("error");
    if (state.status === "error") expect(state.message).toMatch(/permission/i);
  });

  it("does not edit a category", async () => {
    const data = new FormData();
    data.set("id", "category-1");
    const state = await updateCategoryAction(idle, data);
    expect(state.status).toBe("error");
    if (state.status === "error") expect(state.message).toMatch(/permission/i);
  });
});
