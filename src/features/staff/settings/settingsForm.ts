/** A whole number typed plainly ("45"); anything else ("7,5", "-3", "1e3", "") is `undefined`, never NaN. */
export function parseWhole(raw: string): number | undefined {
  const s = raw.trim();
  return /^\d+$/.test(s) ? Number(s) : undefined;
}

/** `HH:MM`, 00:00 to 23:59. */
export const isTime = (raw: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(raw);

/** `YYYY-MM-DD` that is a real day (2026-02-30 is not). */
export function isRealDay(raw: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}
