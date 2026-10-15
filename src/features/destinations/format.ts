import type { Currency, Difficulty } from "@/generated/prisma/enums";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: "Easy",
  MODERATE: "Moderate",
  CHALLENGING: "Challenging",
  STRENUOUS: "Strenuous",
};

/** "NPR 8,000–20,000" or "USD 40" when both ends match. */
export function formatCostRange(min: number, max: number, currency: Currency): string {
  const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const range = min === max ? number.format(min) : `${number.format(min)}–${number.format(max)}`;
  return `${currency} ${range}`;
}

export function formatElevation(metres: number): string {
  return `${new Intl.NumberFormat("en-US").format(metres)} m`;
}

export function formatDays(days: number): string {
  return `${days} day${days === 1 ? "" : "s"}`;
}

/** Dates shown in Nepal time, e.g. "15 October 2026". */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeZone: "Asia/Kathmandu",
  }).format(date);
}

/** Splits stored long-form text into paragraphs on blank lines. */
export function toParagraphs(text: string | null | undefined): string[] {
  return (text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
