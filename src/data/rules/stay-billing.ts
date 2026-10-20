import type { Species } from '../contracts/enums';

/** Price-list items used as the inpatient day charge (§3.2). */
export const DAY_ITEM_CODES = ['LT01', 'LT02', 'LT03'] as const;
export type DayItemCode = (typeof DAY_ITEM_CODES)[number];

export const MIN_BILLABLE_DAYS = 0.1;
/** 0,1 day = 144 minutes. */
const TENTH_MINUTES = 144;

/** Hours in hospital ÷ 24, rounded up to 0,1 day, at least 0,1. Whole minutes first, so exactly 24 h is 1, not 1,1. */
export function billableDays(admittedAt: string | Date, until: string | Date): number {
  const minutes = Math.floor((new Date(until).getTime() - new Date(admittedAt).getTime()) / 60_000);
  return Math.max(1, Math.ceil(minutes / TENTH_MINUTES)) / 10;
}

/** Default day charge; no weight on file → none (staff choose themselves). */
export function suggestDayItemCode(pet: { species: Species; weight_kg?: number }): DayItemCode | undefined {
  if (pet.weight_kg === undefined) return undefined;
  if (pet.species === 'cat') return 'LT01';
  return pet.species === 'dog' && pet.weight_kg >= 15 ? 'LT03' : 'LT02';
}

/** 2.2 → "2,2" */
export const formatDaysVi = (days: number) => days.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
