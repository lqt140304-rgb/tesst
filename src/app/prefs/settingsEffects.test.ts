import { describe, expect, it } from 'vitest';
import { enabledMethods, holidayMark, holidayNotice, hoursOf, minutesFor } from './settingsEffects';

describe('hoursOf', () => {
  it('rounds outwards to whole hours', () => {
    expect(hoursOf({ calendar_start: '08:00', calendar_end: '21:00' })).toEqual({ startH: 8, endH: 21 });
    expect(hoursOf({ calendar_start: '08:30', calendar_end: '20:30' })).toEqual({ startH: 8, endH: 21 });
    expect(hoursOf({ calendar_start: '07:00', calendar_end: '19:00' })).toEqual({ startH: 7, endH: 19 });
  });
});

describe('minutesFor', () => {
  const s = { default_duration_kham: 45, default_duration_spa: 90 };
  it('follows the settings for exam and spa, inpatient stays at 30', () => {
    expect(minutesFor('kham', s)).toBe(45);
    expect(minutesFor('spa', s)).toBe(90);
    expect(minutesFor('noi_tru', s)).toBe(30);
  });
});

describe('enabledMethods', () => {
  it('keeps the fixed order and never comes back empty', () => {
    expect(enabledMethods({ payment_methods: ['qr', 'cash'] })).toEqual(['cash', 'qr']);
    expect(enabledMethods({ payment_methods: ['qr'] })).toEqual(['qr']);
    expect(enabledMethods({ payment_methods: [] })).toEqual(['cash']);
  });
});

describe('holidays', () => {
  const days = [{ date: '2026-12-25', note: 'Noel' }];
  it('marks the day', () => {
    expect(holidayMark('2026-12-25', days)).toEqual(days[0]);
    expect(holidayMark('2026-12-26', days)).toBeUndefined();
  });
  it('warns only when the visit ends after 19:00 on a holiday', () => {
    expect(holidayNotice('2026-12-25', '19:30', days)).toBe('Ngày lễ: bệnh viện làm đến 19:00.');
    expect(holidayNotice('2026-12-25', '19:00', days)).toBeUndefined();
    expect(holidayNotice('2026-12-26', '20:00', days)).toBeUndefined();
    expect(holidayNotice('2026-12-25', undefined, days)).toBeUndefined();
  });
});
