import { describe, expect, it } from 'vitest';
import { axisEvery, bucketDaily, periodRange, readRange, shares, writePeriod, writeRange } from './revenueView';

const TODAY = '2026-10-22';

describe('periodRange', () => {
  it('today, 7 days and this month', () => {
    expect(periodRange('today', TODAY)).toEqual({ from: TODAY, to: TODAY });
    expect(periodRange('7d', TODAY)).toEqual({ from: '2026-10-16', to: TODAY });
    expect(periodRange('month', TODAY)).toEqual({ from: '2026-10-01', to: TODAY });
  });
  it('the previous whole month, across short months and the new year', () => {
    expect(periodRange('prev', TODAY)).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(periodRange('prev', '2026-03-15')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(periodRange('prev', '2026-01-10')).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  });
});

describe('readRange and writeRange', () => {
  it('a valid free range is "custom"', () => {
    expect(readRange('?tu=2026-10-01&den=2026-10-15', TODAY)).toEqual({ period: 'custom', from: '2026-10-01', to: '2026-10-15' });
  });
  it('a fixed period is named in the address, so it is the same period even when its dates equal another one', () => {
    expect(writePeriod('7d')).toBe('?ky=7-ngay');
    expect(readRange('?ky=7-ngay', TODAY)).toEqual({ period: '7d', from: '2026-10-16', to: TODAY });
    expect(readRange('?ky=thang-truoc', TODAY)).toEqual({ period: 'prev', from: '2026-09-01', to: '2026-09-30' });
    // On the 7th of a month "this month" and "7 days" cover the same days; the address still says which one was picked.
    expect(readRange(writePeriod('month'), '2026-11-07').period).toBe('month');
    expect(readRange(writePeriod('today'), '2026-11-01').period).toBe('today');
    expect(readRange(writePeriod('7d'), '2026-11-07').period).toBe('7d');
  });
  it('a written range stays a free range even when it equals a fixed period', () => {
    expect(readRange('?tu=2026-10-16&den=2026-10-22', TODAY).period).toBe('custom');
    expect(readRange('?tu=2026-10-22&den=2026-10-22', TODAY).period).toBe('custom');
  });
  it('nothing or something broken falls back to this month', () => {
    const month = { period: 'month', from: '2026-10-01', to: TODAY };
    for (const bad of ['', '?tu=2026-10-01', '?den=2026-10-01', '?tu=abc&den=2026-10-01', '?tu=2026-10-20&den=2026-10-01',
      '?tu=2024-01-01&den=2026-10-22', '?tu=1999-12-31&den=2000-01-02', '?tu=2026-02-30&den=2026-03-01', '?ky=khong-co']) {
      expect(readRange(bad, TODAY)).toEqual(month);
    }
  });
  it('writes what it reads', () => {
    expect(writeRange('2026-10-01', '2026-10-15')).toBe('?tu=2026-10-01&den=2026-10-15');
    expect(readRange(writeRange('2026-10-01', '2026-10-15'), TODAY).period).toBe('custom');
  });
});

describe('shares', () => {
  it('whole percents that add up to 100', () => {
    expect(shares([50, 30, 20])).toEqual([50, 30, 20]);
    expect(shares([1, 1, 1])).toEqual([34, 33, 33]);
    expect(shares([100])).toEqual([100]);
    expect(shares([3, 0, 7]).reduce((a, b) => a + b, 0)).toBe(100);
  });
  it('is all zeros when there is nothing', () => {
    expect(shares([0, 0])).toEqual([0, 0]);
    expect(shares([])).toEqual([]);
  });
});

describe('axisEvery', () => {
  it('thins the labels as the range grows', () => {
    expect([axisEvery(7), axisEvery(10), axisEvery(11), axisEvery(30), axisEvery(31), axisEvery(32), axisEvery(90)]).toEqual([1, 1, 5, 5, 5, 7, 7]);
  });
});

describe('bucketDaily', () => {
  const days = (n: number) => Array.from({ length: n }, (_, i) => ({ date: `2026-01-${String(i + 1).padStart(2, '0')}`, amount: 10 }));
  it('keeps days up to 120 of them', () => {
    expect(bucketDaily(days(30))).toEqual({ unit: 'day', bars: days(30) });
  });
  it('turns a long range into weeks that keep the total and start on the first day of each week', () => {
    const long = Array.from({ length: 365 }, (_, i) => ({ date: new Date(Date.UTC(2025, 9, 23 + i)).toISOString().slice(0, 10), amount: 1000 }));
    const { unit, bars } = bucketDaily(long);
    expect(unit).toBe('week');
    expect(bars).toHaveLength(53);
    expect(bars[0]!.date).toBe(long[0]!.date);
    expect(bars[1]!.date).toBe(long[7]!.date);
    expect(bars.reduce((n, b) => n + b.amount, 0)).toBe(365000);
    expect(bars[52]!.amount).toBe(1000); // 365 = 52 weeks + 1 day
  });
});
