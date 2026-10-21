import { describe, expect, it } from 'vitest';
import { RANGE_MSG, daysInclusive, previousPeriod, validateRange } from './calendar';

describe('daysInclusive and previousPeriod', () => {
  it('counts both ends', () => {
    expect(daysInclusive('2026-10-19', '2026-10-19')).toBe(1);
    expect(daysInclusive('2026-10-19', '2026-10-25')).toBe(7);
    expect(daysInclusive('2024-01-01', '2024-12-31')).toBe(366);
  });
  it('the previous period is as long and ends the day before', () => {
    expect(previousPeriod('2026-10-19', '2026-10-25')).toEqual({ from: '2026-10-12', to: '2026-10-18' });
    expect(previousPeriod('2026-10-19', '2026-10-19')).toEqual({ from: '2026-10-18', to: '2026-10-18' });
    expect(previousPeriod('2026-11-01', '2026-11-30')).toEqual({ from: '2026-10-02', to: '2026-10-31' });
  });
});

describe('validateRange', () => {
  it('accepts a day, a week and a whole leap year', () => {
    for (const r of [{ from: '2026-10-19', to: '2026-10-19' }, { from: '2026-10-19', to: '2026-10-25' }, { from: '2024-01-01', to: '2024-12-31' }]) expect(validateRange(r)).toEqual({});
  });
  it('names the bad field for impossible or malformed dates', () => {
    expect(validateRange({ from: '2026-02-30', to: '2026-10-19' })).toEqual({ from: RANGE_MSG.date });
    expect(validateRange({ from: '2026-10-19', to: '26-1-1' })).toEqual({ to: RANGE_MSG.date });
    expect(validateRange({ from: '', to: '' })).toEqual({ from: RANGE_MSG.date, to: RANGE_MSG.date });
  });
  it('refuses years outside 2000–2100 (a day count past year 9999 would never end)', () => {
    const years = 'Chỉ chọn ngày trong các năm 2000–2100.';
    expect(validateRange({ from: '9999-12-31', to: '9999-12-31' })).toEqual({ from: years, to: years });
    expect(validateRange({ from: '1999-12-31', to: '2000-01-01' })).toEqual({ from: years });
    expect(validateRange({ from: '2100-12-31', to: '2101-01-01' })).toEqual({ to: years });
    expect(validateRange({ from: '2000-01-01', to: '2000-01-02' })).toEqual({});
    expect(validateRange({ from: '2100-12-30', to: '2100-12-31' })).toEqual({});
  });
  it('refuses a reversed range and one longer than 366 days', () => {
    expect(validateRange({ from: '2026-10-20', to: '2026-10-19' })).toEqual({ to: RANGE_MSG.order });
    expect(validateRange({ from: '2024-01-01', to: '2025-01-01' })).toEqual({ to: RANGE_MSG.span });
  });
});
