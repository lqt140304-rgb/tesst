import { describe, expect, it } from 'vitest';
import { isRealDay, isTime, parseWhole } from './settingsForm';

describe('parseWhole', () => {
  it('reads whole numbers with spaces around', () => {
    expect(parseWhole('45')).toBe(45);
    expect(parseWhole('  0 ')).toBe(0);
  });
  it('refuses everything else', () => {
    for (const bad of ['', '  ', 'abc', '7,5', '7.5', '-3', '1e3', '+4', '1 2']) expect(parseWhole(bad)).toBeUndefined();
  });
});

describe('isTime', () => {
  it('accepts HH:MM within a day', () => {
    for (const ok of ['00:00', '07:00', '21:00', '23:59']) expect(isTime(ok)).toBe(true);
  });
  it('refuses the rest', () => {
    for (const bad of ['24:00', '7:00', '07:60', '0700', '', '07:00:00']) expect(isTime(bad)).toBe(false);
  });
});

describe('isRealDay', () => {
  it('accepts real calendar days', () => {
    expect(isRealDay('2026-12-25')).toBe(true);
    expect(isRealDay('2028-02-29')).toBe(true);
  });
  it('refuses days that do not exist or are badly written', () => {
    for (const bad of ['2026-02-30', '2026-13-01', '2026-00-10', '2027-02-29', '26-12-25', '2026-1-5', '']) expect(isRealDay(bad)).toBe(false);
  });
});
