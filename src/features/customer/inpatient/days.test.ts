import { describe, expect, it } from 'vitest';
import { clampDay, dayRange, isDay, stepDay } from './days';

describe('stay days (Vietnam dates as YYYY-MM-DD)', () => {
  it('lists every day from admission to the end, inclusive, across a month end', () => {
    expect(dayRange('2026-10-17', '2026-10-19')).toEqual(['2026-10-17', '2026-10-18', '2026-10-19']);
    expect(dayRange('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
  });
  it('a one-day stay is one day; an end before the start gives just the start', () => {
    expect(dayRange('2026-10-19', '2026-10-19')).toEqual(['2026-10-19']);
    expect(dayRange('2026-10-19', '2026-10-18')).toEqual(['2026-10-19']);
  });
  it('clamps a day into the range and falls back to the last day for junk', () => {
    expect(clampDay('2026-10-25', '2026-10-17', '2026-10-19')).toBe('2026-10-19');
    expect(clampDay('2026-10-01', '2026-10-17', '2026-10-19')).toBe('2026-10-17');
    expect(clampDay('2026-10-18', '2026-10-17', '2026-10-19')).toBe('2026-10-18');
    expect(clampDay('hôm qua', '2026-10-17', '2026-10-19')).toBe('2026-10-19');
    expect(clampDay(undefined, '2026-10-17', '2026-10-19')).toBe('2026-10-19');
  });
  it('steps by one day and stops at the ends', () => {
    expect(stepDay('2026-10-18', -1, '2026-10-17', '2026-10-19')).toBe('2026-10-17');
    expect(stepDay('2026-10-17', -1, '2026-10-17', '2026-10-19')).toBe('2026-10-17');
    expect(stepDay('2026-10-19', 1, '2026-10-17', '2026-10-19')).toBe('2026-10-19');
    expect(stepDay('2026-10-31', 1, '2026-10-30', '2026-11-02')).toBe('2026-11-01');
  });
  it('knows a real date from text that only looks like one', () => {
    expect(isDay('2026-10-18')).toBe(true);
    expect(isDay('2026-02-30')).toBe(false);
    expect(isDay('18/10/2026')).toBe(false);
  });
});
