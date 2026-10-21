import { dayOf, formatDayVi, relativeDayVi } from '@/lib/dates';

/** Groups items (already newest first) by their Vietnam calendar day, keeping the order. */
export function groupByDay<T extends { at: string }>(items: T[], now: Date): { day: string; label: string; items: T[] }[] {
  const groups: { day: string; label: string; items: T[] }[] = [];
  for (const it of items) {
    const day = dayOf(it.at);
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(it);
    else groups.push({ day, label: relativeDayVi(it.at, now) ?? formatDayVi(it.at), items: [it] });
  }
  return groups;
}
