import type { Difficulty } from "@/generated/prisma/enums";

/**
 * Explore filters backed by practical information. They only ever match
 * destinations whose practical details are VERIFIED; filtering on
 * placeholder or unverified figures would present them as fact.
 */

export const DIFFICULTIES = [
  { slug: "easy", value: "EASY", label: "Easy" },
  { slug: "moderate", value: "MODERATE", label: "Moderate" },
  { slug: "challenging", value: "CHALLENGING", label: "Challenging" },
  { slug: "strenuous", value: "STRENUOUS", label: "Strenuous" },
] as const satisfies ReadonlyArray<{ slug: string; value: Difficulty; label: string }>;

export type DifficultySlug = (typeof DIFFICULTIES)[number]["slug"];
export const DIFFICULTY_SLUGS = DIFFICULTIES.map((d) => d.slug) as [DifficultySlug, ...DifficultySlug[]];

/**
 * Budget bands on the estimated per-person starting cost, in NPR. Only
 * destinations priced in NPR are matched; there's no currency conversion.
 */
export const BUDGETS = [
  { slug: "low", label: "Under NPR 15,000", min: 0, max: 14_999 },
  { slug: "mid", label: "NPR 15,000–50,000", min: 15_000, max: 50_000 },
  { slug: "high", label: "Over NPR 50,000", min: 50_001, max: null },
] as const;

export type BudgetSlug = (typeof BUDGETS)[number]["slug"];
export const BUDGET_SLUGS = BUDGETS.map((b) => b.slug) as [BudgetSlug, ...BudgetSlug[]];

export const SORTS = [
  { slug: "featured", label: "Featured first" },
  { slug: "name", label: "Name (A–Z)" },
] as const;

export type SortSlug = (typeof SORTS)[number]["slug"];
export const SORT_SLUGS = SORTS.map((s) => s.slug) as [SortSlug, ...SortSlug[]];

export const PAGE_SIZE = 12;

export const getDifficulty = (slug: string) => DIFFICULTIES.find((d) => d.slug === slug);
export const getBudget = (slug: string) => BUDGETS.find((b) => b.slug === slug);
