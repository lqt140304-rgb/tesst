import { addDays, daysBetween } from '../../lib/dates';

export const REPORT_MAX_DAYS = 366;

export const RANGE_MSG = {
  date: 'Ngày cần đúng dạng năm-tháng-ngày, ví dụ 2026-10-19.',
  order: 'Ngày kết thúc cần sau hoặc bằng ngày bắt đầu.',
  span: 'Khoảng ngày tối đa 366 ngày.',
  years: 'Chỉ chọn ngày trong các năm 2000–2100.',
} as const;

/** "YYYY-MM-DD" that is a real calendar day. */
export function isRealDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

/** Number of days from `from` to `to`, both ends counted (`from ≤ to`, both real dates). */
export const daysInclusive = (from: string, to: string) => daysBetween(from, to) + 1;

/** The period right before: as long as `from..to` and ending the day before `from`. */
export function previousPeriod(from: string, to: string): { from: string; to: string } {
  return { from: addDays(from, -daysInclusive(from, to)), to: addDays(from, -1) };
}

export const inYears = (d: string) => Number(d.slice(0, 4)) >= 2000 && Number(d.slice(0, 4)) <= 2100;

export function validateRange(r: { from: string; to: string }): Record<string, string> {
  const e: Record<string, string> = {};
  if (!isRealDate(r.from)) e.from = RANGE_MSG.date;
  if (!isRealDate(r.to)) e.to = RANGE_MSG.date;
  if (e.from || e.to) return e;
  // Past year 9999 a date turns into "+010000-…" and day-by-day loops never end.
  if (!inYears(r.from)) e.from = RANGE_MSG.years;
  if (!inYears(r.to)) e.to = RANGE_MSG.years;
  if (e.from || e.to) return e;
  if (r.from > r.to) e.to = RANGE_MSG.order;
  else if (daysInclusive(r.from, r.to) > REPORT_MAX_DAYS) e.to = RANGE_MSG.span;
  return e;
}
