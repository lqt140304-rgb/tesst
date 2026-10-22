import { validateRange } from '@/data/rules/calendar';
import { addDays } from '@/lib/dates';

export type Period = 'today' | '7d' | 'month' | 'prev' | 'custom';
type Fixed = Exclude<Period, 'custom'>;
const FIXED: Fixed[] = ['today', '7d', 'month', 'prev'];

export function periodRange(p: Fixed, today: string): { from: string; to: string } {
  if (p === 'today') return { from: today, to: today };
  if (p === '7d') return { from: addDays(today, -6), to: today };
  const first = `${today.slice(0, 8)}01`;
  if (p === 'month') return { from: first, to: today };
  const prevLast = addDays(first, -1);
  return { from: `${prevLast.slice(0, 8)}01`, to: prevLast };
}

/** The period shown for an address like "?tu=…&den=…". A missing, broken or impossible range falls back to this month instead of an error page. */
export function readRange(search: string, today: string): { period: Period; from: string; to: string } {
  const q = new URLSearchParams(search.replace(/^\?/, ''));
  const from = q.get('tu') ?? '';
  const to = q.get('den') ?? '';
  if (from && to && Object.keys(validateRange({ from, to })).length === 0) {
    const same = FIXED.find((p) => { const r = periodRange(p, today); return r.from === from && r.to === to; });
    return { period: same ?? 'custom', from, to };
  }
  return { period: 'month', ...periodRange('month', today) };
}

export const writeRange = (from: string, to: string) => `?tu=${from}&den=${to}`;

/** Whole percents that add up to 100 (largest remainder); all zeros when there is nothing. */
export function shares(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return values.map(() => 0);
  const raw = values.map((v) => (v * 100) / total);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, rem: r - Math.floor(r) })).sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (const { i } of order) { if (left <= 0) break; out[i]!++; left--; }
  return out;
}

/** Label every N days on the daily chart so the axis never crowds. */
export const axisEvery = (days: number) => (days <= 10 ? 1 : days <= 31 ? 5 : 7);

/** Bars for the daily chart: one per day, or one per week once the range is too long to read day by day (more than 120 days). */
export function bucketDaily(daily: { date: string; amount: number }[]): { unit: 'day' | 'week'; bars: { date: string; amount: number }[] } {
  if (daily.length <= 120) return { unit: 'day', bars: daily };
  const bars: { date: string; amount: number }[] = [];
  for (let i = 0; i < daily.length; i += 7) bars.push({ date: daily[i]!.date, amount: daily.slice(i, i + 7).reduce((n, d) => n + d.amount, 0) });
  return { unit: 'week', bars };
}
