import type { PriceCategory } from '@/data/contracts/enums';
import type { StaffPriceItem } from '@/data/staff';

export type StatusFilter = 'active' | 'inactive' | 'all';

const fold = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();
const byStatus = (p: StaffPriceItem, s: StatusFilter) => s === 'all' || (s === 'active' ? p.active : !p.active);

export function filterPrices(items: StaffPriceItem[], f: { needle: string; category: PriceCategory | 'all'; status: StatusFilter }): StaffPriceItem[] {
  const needle = fold(f.needle.trim());
  return items.filter((p) => byStatus(p, f.status) && (f.category === 'all' || p.category === f.category) && (!needle || fold(`${p.code} ${p.name}`).includes(needle)));
}

export const statusCounts = (items: StaffPriceItem[]) => ({ active: items.filter((p) => p.active).length, inactive: items.filter((p) => !p.active).length, all: items.length });

export function categoryCounts(items: StaffPriceItem[], status: StatusFilter): Partial<Record<PriceCategory, number>> {
  const out: Partial<Record<PriceCategory, number>> = {};
  for (const p of items) if (byStatus(p, status)) out[p.category] = (out[p.category] ?? 0) + 1;
  return out;
}
