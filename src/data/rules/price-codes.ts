import type { PriceCategory } from '../contracts/enums';

const PREFIX: Record<PriceCategory, string> = { exam: 'KB', spa: 'SP', inpatient: 'LT', medicine: 'TH', supply: 'VT' };

/** Next code of the category: the highest number under its prefix + 1, at least two digits ("KB10"). */
export function nextPriceCode(category: PriceCategory, existing: string[]): string {
  const prefix = PREFIX[category];
  const top = existing.filter((c) => c.startsWith(prefix)).map((c) => Number(c.slice(prefix.length))).filter(Number.isFinite).reduce((m, n) => Math.max(m, n), 0);
  return `${prefix}${String(top + 1).padStart(2, '0')}`;
}
