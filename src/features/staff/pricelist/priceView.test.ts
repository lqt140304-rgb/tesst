import { describe, expect, it } from 'vitest';
import type { StaffPriceItem } from '@/data/staff';
import { categoryCounts, filterPrices, statusCounts } from './priceView';

const item = (code: string, category: StaffPriceItem['category'], name: string, active = true): StaffPriceItem =>
  ({ id: `pi-${code}`, code, category, name, unit: 'lần', price: 1000, price_mode: 'fixed', active, customer_group: 'itemized', version: 1 });
const items = [item('KB01', 'exam', 'Khám lâm sàng'), item('SP06', 'spa', 'Cắt móng'), item('SP04', 'spa', 'Tắm sấy mèo', false), item('LT04', 'inpatient', 'Chăm sóc tăng cường')];
const all = { needle: '', category: 'all', status: 'all' } as const;

describe('filterPrices', () => {
  it('finds by name without accents or case, and by code', () => {
    expect(filterPrices(items, { ...all, needle: 'KHAM lam' }).map((i) => i.code)).toEqual(['KB01']);
    expect(filterPrices(items, { ...all, needle: 'sp06' }).map((i) => i.code)).toEqual(['SP06']);
    expect(filterPrices(items, { ...all, needle: 'xyz' })).toEqual([]);
  });
  it('combines category and status; "active" hides the switched-off ones', () => {
    expect(filterPrices(items, { ...all, status: 'active' }).map((i) => i.code)).toEqual(['KB01', 'SP06', 'LT04']);
    expect(filterPrices(items, { ...all, status: 'inactive' }).map((i) => i.code)).toEqual(['SP04']);
    expect(filterPrices(items, { needle: '', category: 'spa', status: 'active' }).map((i) => i.code)).toEqual(['SP06']);
  });
});

describe('counts', () => {
  it('counts by status and by category within a status', () => {
    expect(statusCounts(items)).toEqual({ active: 3, inactive: 1, all: 4 });
    expect(categoryCounts(items, 'active')).toEqual({ exam: 1, spa: 1, inpatient: 1 });
    expect(categoryCounts(items, 'all')).toEqual({ exam: 1, spa: 2, inpatient: 1 });
  });
});
