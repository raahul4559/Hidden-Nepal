import { PublishStatus } from "@/generated/prisma/enums";

export type AdminListFilters = {
  q: string;
  status: PublishStatus | "ALL";
  page: number;
};

export function parseAdminListFilters(
  params: Record<string, string | string[] | undefined>,
): AdminListFilters {
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const rawStatus = first(params.status);
  const status =
    rawStatus && Object.values(PublishStatus).includes(rawStatus as PublishStatus)
      ? (rawStatus as PublishStatus)
      : "ALL";

  const rawPage = Number(first(params.page));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 10_000) : 1;

  return {
    q: (first(params.q) ?? "").trim().slice(0, 100),
    status,
    page,
  };
}

export function adminListHref(
  base: string,
  filters: AdminListFilters,
  overrides: Partial<AdminListFilters> = {},
) {
  const next = { ...filters, ...overrides };
  const query = new URLSearchParams();
  if (next.q) query.set("q", next.q);
  if (next.status !== "ALL") query.set("status", next.status);
  if (next.page > 1) query.set("page", String(next.page));
  const qs = query.toString();
  return qs ? `${base}?${qs}` : base;
}
