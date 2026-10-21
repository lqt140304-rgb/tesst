import { describe, expect, it } from 'vitest';
import { formatDayVi } from '@/lib/dates';
import { groupByDay } from './groupByDay';

const NOW = new Date('2026-10-21T05:00:00Z'); // 12:00 on 21/10 in Vietnam

describe('groupByDay', () => {
  it('puts items of the same Vietnam day in one group and keeps their order', () => {
    const items = [{ at: '2026-10-21T04:00:00Z', n: 1 }, { at: '2026-10-21T01:00:00Z', n: 2 }, { at: '2026-10-20T04:00:00Z', n: 3 }];
    const groups = groupByDay(items, NOW);
    expect(groups.map((g) => g.items.map((i) => i.n))).toEqual([[1, 2], [3]]);
    expect(groups.map((g) => g.day)).toEqual(['2026-10-21', '2026-10-20']);
  });
  it('uses the Vietnam day, not the UTC day', () => {
    const [g] = groupByDay([{ at: '2026-10-20T20:00:00Z' }], NOW); // 03:00 on 21/10 in Vietnam
    expect(g!.day).toBe('2026-10-21');
  });
  it('labels today and yesterday in words and older days with the date', () => {
    const groups = groupByDay([{ at: '2026-10-21T01:00:00Z' }, { at: '2026-10-20T01:00:00Z' }, { at: '2026-10-15T01:00:00Z' }], NOW);
    expect(groups.map((g) => g.label)).toEqual(['Hôm nay', 'Hôm qua', formatDayVi('2026-10-15T01:00:00Z')]);
  });
  it('is empty for no items', () => {
    expect(groupByDay([], NOW)).toEqual([]);
  });
});
