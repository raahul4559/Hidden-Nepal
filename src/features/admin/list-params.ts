import { PublishStatus } from "@/generated/prisma/enums";

/**
 * Shared shape for admin queue filters. `S` is the status enum of the queue;
 * destinations and guides use PublishStatus, submissions use SubmissionStatus.
 */
export type AdminListFilters<S extends string = PublishStatus> = {
  q: string;
  status: S | "ALL";
  page: number;
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export function parseAdminListFilters<S extends string = PublishStatus>(
  params: Record<string, string | string[] | undefined>,
  allowedStatuses?: readonly S[],
  defaultStatus: S | "ALL" = "ALL",
): AdminListFilters<S> {
  const statuses = (allowedStatuses ?? Object.values(PublishStatus)) as readonly string[];

  const rawStatus = first(params.status);
  const status: S | "ALL" =
    rawStatus && statuses.includes(rawStatus) ? (rawStatus as S) : defaultStatus;

  const rawPage = Number(first(params.page));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 10_000) : 1;

  return {
    q: (first(params.q) ?? "").trim().slice(0, 100),
    status,
    page,
  };
}

export function adminListHref<S extends string>(
  base: string,
  filters: AdminListFilters<S>,
  overrides: Partial<AdminListFilters<S>> = {},
) {
  const next = { ...filters, ...overrides };
  const query = new URLSearchParams();
  if (next.q) query.set("q", next.q);
  if (next.status !== "ALL") query.set("status", next.status);
  if (next.page > 1) query.set("page", String(next.page));
  const qs = query.toString();
  return qs ? `${base}?${qs}` : base;
}
