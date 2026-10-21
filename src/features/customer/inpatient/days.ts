/** Day helpers for "Chọn ngày": plain YYYY-MM-DD strings in Vietnam time, no time zone maths. */
const MS = 86_400_000;
const toMs = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const fromMs = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** A real calendar date written as YYYY-MM-DD (rejects 2026-02-30 and other shapes). */
export function isDay(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && fromMs(toMs(s)) === s;
}

/** Every day from `start` to `end`, inclusive; an end before the start gives just the start. */
export function dayRange(start: string, end: string): string[] {
  const out: string[] = [];
  for (let t = toMs(start); t <= toMs(end); t += MS) out.push(fromMs(t));
  return out.length ? out : [start];
}

/** `day` inside [start, end]; anything that is not a date falls back to the last day (today, or the discharge day). */
export function clampDay(day: string | null | undefined, start: string, end: string): string {
  if (!isDay(day)) return end;
  return day < start ? start : day > end ? end : day;
}

export function stepDay(day: string, dir: -1 | 1, start: string, end: string): string {
  return clampDay(fromMs(toMs(day) + dir * MS), start, end);
}
