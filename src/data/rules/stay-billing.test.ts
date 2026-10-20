import { describe, expect, it } from 'vitest';
import { billableDays, formatDaysVi, suggestDayItemCode } from './stay-billing';

const ADMIT = '2026-10-17T10:30:00+07:00';
const at = (h: number, m = 0, s = 0) => new Date(Date.parse(ADMIT) + ((h * 60 + m) * 60 + s) * 1000);

describe('stay billing', () => {
  it('rounds hours up to tenths of a day', () => {
    expect(billableDays(ADMIT, at(6))).toBe(0.3);
    expect(billableDays(ADMIT, at(12))).toBe(0.5);
    expect(billableDays(ADMIT, at(24))).toBe(1);
    expect(billableDays(ADMIT, at(30))).toBe(1.3);
    expect(billableDays(ADMIT, at(52))).toBe(2.2);
    expect(billableDays(ADMIT, at(0, 4))).toBe(0.1);
    expect(billableDays(ADMIT, at(0))).toBe(0.1);
  });
  it('ignores leftover seconds and offset differences', () => {
    expect(billableDays(ADMIT, at(24, 0, 30))).toBe(1);
    expect(billableDays('2026-10-17T03:30:00Z', '2026-10-18T10:30:00+07:00')).toBe(1);
  });
  it('suggests a day item only when the pet has a weight', () => {
    expect(suggestDayItemCode({ species: 'cat', weight_kg: 4 })).toBe('LT01');
    expect(suggestDayItemCode({ species: 'dog', weight_kg: 14.9 })).toBe('LT02');
    expect(suggestDayItemCode({ species: 'dog', weight_kg: 15 })).toBe('LT03');
    expect(suggestDayItemCode({ species: 'other', weight_kg: 3 })).toBe('LT02');
    expect(suggestDayItemCode({ species: 'cat' })).toBeUndefined();
    expect(suggestDayItemCode({ species: 'dog' })).toBeUndefined();
  });
  it('formats days the Vietnamese way', () => {
    expect(formatDaysVi(2.2)).toBe('2,2');
    expect(formatDaysVi(1)).toBe('1');
  });
});
