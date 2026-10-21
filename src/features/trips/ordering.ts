/**
 * Pure ordering helpers for trip stops. Kept free of React and Prisma so they
 * can be unit-tested and reused by a future drag-and-drop or AI planner.
 */

export type StopOrderResult =
  | { ok: true; ids: string[] }
  | { ok: false; reason: "not_a_permutation" };

/**
 * Accepts a requested order only when it contains exactly the current stop
 * ids, each once. Anything else is rejected instead of silently dropping or
 * duplicating stops.
 */
export function applyStopOrder(
  currentIds: readonly string[],
  requestedIds: readonly string[],
): StopOrderResult {
  if (requestedIds.length !== currentIds.length) {
    return { ok: false, reason: "not_a_permutation" };
  }

  const current = new Set(currentIds);
  const seen = new Set<string>();
  for (const id of requestedIds) {
    if (!current.has(id) || seen.has(id)) {
      return { ok: false, reason: "not_a_permutation" };
    }
    seen.add(id);
  }

  return { ok: true, ids: [...requestedIds] };
}

/**
 * Moves one stop one place up or down. Returns null when the stop is not in
 * the list; returns the unchanged order at the edges, so the caller can still
 * persist a no-op safely.
 */
export function moveStop(
  ids: readonly string[],
  stopId: string,
  direction: "up" | "down",
): string[] | null {
  const index = ids.indexOf(stopId);
  if (index === -1) return null;

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= ids.length) return [...ids];

  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
