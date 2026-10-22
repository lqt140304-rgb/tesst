import { describe, expect, it } from 'vitest';
import { axisEvery, periodRange, readRange, shares, writeRange } from './revenueView';

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
  it('a range that equals a fixed period comes back as that period', () => {
    expect(readRange('?tu=2026-10-16&den=2026-10-22', TODAY).period).toBe('7d');
    expect(readRange('?tu=2026-10-22&den=2026-10-22', TODAY).period).toBe('today');
    expect(readRange('tu=2026-10-01&den=2026-10-22', TODAY).period).toBe('month');
    expect(readRange('?tu=2026-09-01&den=2026-09-30', TODAY).period).toBe('prev');
  });
  it('nothing or something broken falls back to this month', () => {
    const month = { period: 'month', from: '2026-10-01', to: TODAY };
    for (const bad of ['', '?tu=2026-10-01', '?den=2026-10-01', '?tu=abc&den=2026-10-01', '?tu=2026-10-20&den=2026-10-01',
      '?tu=2024-01-01&den=2026-10-22', '?tu=1999-12-31&den=2000-01-02', '?tu=2026-02-30&den=2026-03-01']) {
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
