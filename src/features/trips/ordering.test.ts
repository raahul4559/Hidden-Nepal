import { describe, expect, it } from "vitest";

import { applyStopOrder, moveStop } from "./ordering";

describe("applyStopOrder", () => {
  const current = ["a", "b", "c"];

  it("accepts exactly the current ids in any order", () => {
    expect(applyStopOrder(current, ["c", "a", "b"])).toEqual({ ok: true, ids: ["c", "a", "b"] });
    expect(applyStopOrder([], [])).toEqual({ ok: true, ids: [] });
  });

  it("rejects a missing, extra, duplicated or unknown id", () => {
    for (const requested of [
      ["a", "b"],
      ["a", "b", "c", "d"],
      ["a", "b", "b"],
      ["a", "b", "z"],
      ["a", "b", "c", "a"],
    ]) {
      expect(applyStopOrder(current, requested)).toEqual({
        ok: false,
        reason: "not_a_permutation",
      });
    }
  });

  it("does not mutate the input order", () => {
    const ids = [...current];
    applyStopOrder(current, ["b", "c", "a"]);
    expect(current).toEqual(ids);
  });
});

describe("moveStop", () => {
  const ids = ["a", "b", "c"];

  it("swaps a stop with its neighbour", () => {
    expect(moveStop(ids, "b", "up")).toEqual(["b", "a", "c"]);
    expect(moveStop(ids, "b", "down")).toEqual(["a", "c", "b"]);
  });

  it("returns the unchanged order at the edges", () => {
    expect(moveStop(ids, "a", "up")).toEqual(["a", "b", "c"]);
    expect(moveStop(ids, "c", "down")).toEqual(["a", "b", "c"]);
  });

  it("returns null when the stop is not in the trip", () => {
    expect(moveStop(ids, "missing", "up")).toBeNull();
  });

  it("never mutates the input array", () => {
    const order = [...ids];
    moveStop(order, "a", "down");
    expect(order).toEqual(ids);
  });
});
