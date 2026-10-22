import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS as D, FIXED_RULES, SETTINGS_MSG, applySettingsPatch, changedSettings, describeSetting, findClosedDay, isOverdue, validateSettingsPatch,
} from './app-settings';

describe('defaults', () => {
  it('are the demo defaults', () => {
    expect(D).toEqual({ stock_expiry_days: 30, stock_default_min: 5, default_duration_kham: 30, default_duration_spa: 60, calendar_start: '08:00', calendar_end: '21:00', payment_methods: ['cash', 'transfer', 'qr'], request_overdue_hours: 24, closed_days: [] });
  });
  it('the fixed rules are read-only facts, not settings', () => {
    expect(FIXED_RULES).toEqual([
      { label: 'Video nội trú', value: 'Tối đa 15 giây và 20 MB, tự xóa sau 60 ngày' },
      { label: 'Thanh toán', value: 'Thanh toán tại quầy, không thanh toán trực tuyến' },
    ]);
  });
});

describe('validateSettingsPatch', () => {
  it('accepts every good value and the empty patch', () => {
    expect(validateSettingsPatch({}, D)).toEqual({});
    expect(validateSettingsPatch({ stock_expiry_days: 365, stock_default_min: 0, default_duration_kham: 240, default_duration_spa: 5, calendar_start: '00:00', calendar_end: '04:00', payment_methods: ['qr'], request_overdue_hours: 168 }, D)).toEqual({});
  });
  it.each([
    ['stock_expiry_days', SETTINGS_MSG.stock_expiry_days, [0, 366]],
    ['stock_default_min', SETTINGS_MSG.stock_default_min, [-1, 1001]],
    ['default_duration_kham', SETTINGS_MSG.duration, [4, 245, 32]],
    ['default_duration_spa', SETTINGS_MSG.duration, [0, 241, 7]],
    ['request_overdue_hours', SETTINGS_MSG.request_overdue_hours, [0, 169]],
  ] as const)('%s: integers in range only', (key, msg, bad) => {
    for (const v of [...bad, '30', 1.5, NaN, Infinity, null, true, undefined]) expect(validateSettingsPatch({ [key]: v }, D)).toEqual({ [key]: msg });
  });
  it('times: HH:MM only, and 4 hours apart', () => {
    expect(validateSettingsPatch({ calendar_start: '7:00' }, D)).toEqual({ calendar_start: SETTINGS_MSG.time });
    expect(validateSettingsPatch({ calendar_end: '24:00' }, D)).toEqual({ calendar_end: SETTINGS_MSG.time });
    expect(validateSettingsPatch({ calendar_start: 700 }, D)).toEqual({ calendar_start: SETTINGS_MSG.time });
    expect(validateSettingsPatch({ calendar_start: '18:30' }, D)).toEqual({ calendar_start: SETTINGS_MSG.span });
    expect(validateSettingsPatch({ calendar_end: '10:00' }, D)).toEqual({ calendar_end: SETTINGS_MSG.span });
    expect(validateSettingsPatch({ calendar_start: '21:00', calendar_end: '08:00' }, D)).toEqual({ calendar_end: SETTINGS_MSG.span });
    expect(validateSettingsPatch({ calendar_start: '08:00', calendar_end: '12:00' }, D)).toEqual({});
  });
  it('payment methods: a non-empty set of known methods', () => {
    // eslint-disable-next-line no-sparse-arrays
    for (const bad of [[], 'cash', ['cash', 'bank'], new Array(2), [, 'cash'], [5], null]) expect(validateSettingsPatch({ payment_methods: bad }, D)).toEqual({ payment_methods: SETTINGS_MSG.payment_methods });
    expect(validateSettingsPatch({ payment_methods: ['qr', 'qr', 'cash'] }, D)).toEqual({});
  });
  it('unknown keys, an own __proto__ key and a non-object', () => {
    const errs = validateSettingsPatch(JSON.parse('{"__proto__": {"x": 1}, "constructor": 2, "colour": 3}'), D);
    expect(Object.keys(errs).sort()).toEqual(['__proto__', 'colour', 'constructor']);
    expect(Object.values(errs)).toEqual([SETTINGS_MSG.unknown, SETTINGS_MSG.unknown, SETTINGS_MSG.unknown]);
    for (const bad of [null, [], 'x', 5]) expect(validateSettingsPatch(bad, D)).toEqual({ settings: SETTINGS_MSG.shape });
  });
});

describe('applySettingsPatch', () => {
  it('keeps known keys only, dedupes and orders the methods, and does not touch the input', () => {
    const sym = Symbol('x');
    const next = applySettingsPatch(D, { payment_methods: ['qr', 'cash', 'qr'], stock_expiry_days: 60, [sym]: 1, ...JSON.parse('{"__proto__": {"a": 1}}') } as never);
    expect(next).toEqual({ ...D, payment_methods: ['cash', 'qr'], stock_expiry_days: 60 });
    expect(Reflect.ownKeys(next)).toEqual(Reflect.ownKeys(D));
    expect(D.payment_methods).toEqual(['cash', 'transfer', 'qr']);
  });
});

describe('changedSettings and describeSetting', () => {
  it('lists only real changes, in the order of the keys; methods compare as a set', () => {
    expect(changedSettings(D, { ...D })).toEqual([]);
    expect(changedSettings(D, { ...D, payment_methods: ['qr', 'transfer', 'cash'] })).toEqual([]);
    expect(changedSettings(D, { ...D, request_overdue_hours: 48, stock_expiry_days: 60 })).toEqual(['stock_expiry_days', 'request_overdue_hours']);
  });
  it('describes each value in plain words', () => {
    const v = { ...D, payment_methods: ['cash', 'qr'] as typeof D.payment_methods };
    expect(describeSetting('stock_expiry_days', v)).toBe('30 ngày');
    expect(describeSetting('stock_default_min', v)).toBe('5');
    expect(describeSetting('default_duration_kham', v)).toBe('30 phút');
    expect(describeSetting('default_duration_spa', v)).toBe('60 phút');
    expect(describeSetting('calendar_start', v)).toBe('08:00');
    expect(describeSetting('calendar_end', v)).toBe('21:00');
    expect(describeSetting('payment_methods', v)).toBe('Tiền mặt, QR ngân hàng');
    expect(describeSetting('request_overdue_hours', v)).toBe('24 giờ');
  });
});

describe('isOverdue', () => {
  const now = new Date('2026-10-22T12:00:00+07:00');
  it('is strictly more than N hours, and never for a time in the future', () => {
    expect(isOverdue('2026-10-21T12:00:00+07:00', now, 24)).toBe(false);
    expect(isOverdue('2026-10-21T11:59:00+07:00', now, 24)).toBe(true);
    expect(isOverdue('2026-10-22T13:00:00+07:00', now, 1)).toBe(false);
  });
});

describe('closed days', () => {
  const day = (n: number) => `2027-01-${String((n % 28) + 1).padStart(2, '0')}`;
  const many = (n: number) => Array.from({ length: n }, (_, i) => ({ date: `${2000 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}-05`, note: '' }));
  it('accepts an empty list, a note or none, the limits exactly', () => {
    expect(validateSettingsPatch({ closed_days: [] }, D)).toEqual({});
    expect(validateSettingsPatch({ closed_days: [{ date: day(1), note: 'Nghỉ lễ' }, { date: day(2) }] }, D)).toEqual({});
    expect(validateSettingsPatch({ closed_days: [{ date: '2027-01-01', note: 'a'.repeat(60) }] }, D)).toEqual({});
    expect(validateSettingsPatch({ closed_days: many(120) }, D)).toEqual({});
    expect(validateSettingsPatch({ closed_days: [{ date: '2000-01-01' }, { date: '2100-12-31' }] }, D)).toEqual({});
  });
  it('the list itself: an array of at most 120', () => {
    for (const bad of ['x', {}, null, 5]) expect(validateSettingsPatch({ closed_days: bad }, D)).toEqual({ closed_days: SETTINGS_MSG.closed_days });
    expect(validateSettingsPatch({ closed_days: many(121) }, D)).toEqual({ closed_days: SETTINGS_MSG.closed_days });
    expect(validateSettingsPatch({ closed_days: new Array(2) }, D)).toEqual({ 'closed_days.0': SETTINGS_MSG.closed_row, 'closed_days.1': SETTINGS_MSG.closed_row });
  });
  it('each row is judged on its own index', () => {
    const r = validateSettingsPatch({ closed_days: [
      { date: day(1) }, { date: '2026-02-30' }, { date: '1999-12-31' }, { date: '2101-01-01' }, { date: 5 }, 'x', null,
      { date: day(3), note: 'a'.repeat(61) }, { date: day(4), note: 5 }, { date: day(5), colour: 1 },
    ] }, D);
    expect(r).toEqual({
      'closed_days.1': SETTINGS_MSG.closed_date, 'closed_days.2': SETTINGS_MSG.closed_date, 'closed_days.3': SETTINGS_MSG.closed_date, 'closed_days.4': SETTINGS_MSG.closed_date,
      'closed_days.5': SETTINGS_MSG.closed_row, 'closed_days.6': SETTINGS_MSG.closed_row, 'closed_days.7': SETTINGS_MSG.closed_note, 'closed_days.8': SETTINGS_MSG.closed_note, 'closed_days.9': SETTINGS_MSG.closed_row,
    });
  });
  it('an own __proto__ key in a row and a repeated date are refused (the later row carries the error)', () => {
    expect(validateSettingsPatch({ closed_days: [JSON.parse('{"date":"2027-01-01","__proto__":{"x":1}}')] }, D)).toEqual({ 'closed_days.0': SETTINGS_MSG.closed_row });
    expect(validateSettingsPatch({ closed_days: [{ date: day(1) }, { date: day(2) }, { date: day(1), note: 'khác' }] }, D)).toEqual({ 'closed_days.2': SETTINGS_MSG.closed_twice });
  });
  it('applySettingsPatch trims notes, fills a missing note and sorts by date', () => {
    const next = applySettingsPatch(D, { closed_days: [{ date: '2027-02-01', note: '  Tết  ' }, { date: '2027-01-01' } as never] });
    expect(next.closed_days).toEqual([{ date: '2027-01-01', note: '' }, { date: '2027-02-01', note: 'Tết' }]);
    expect(D.closed_days).toEqual([]);
  });
  it('changedSettings looks at the content, not the order sent', () => {
    const a = { ...D, closed_days: [{ date: '2027-01-01', note: 'a' }, { date: '2027-02-01', note: 'b' }] };
    expect(changedSettings(a, { ...a, closed_days: [...a.closed_days].reverse() })).toEqual([]);
    expect(changedSettings(a, { ...a, closed_days: [{ date: '2027-01-01', note: 'a' }, { date: '2027-02-01', note: 'c' }] })).toEqual(['closed_days']);
  });
  it('describeSetting: none, a few, and many', () => {
    const v = (n: number) => ({ ...D, closed_days: Array.from({ length: n }, (_, i) => ({ date: `2027-01-0${i + 1}`, note: 'ghi chú riêng' })) });
    expect(describeSetting('closed_days', v(0))).toBe('Chưa có ngày nghỉ');
    expect(describeSetting('closed_days', v(2))).toBe('2 ngày nghỉ: 01/01/2027, 02/01/2027');
    expect(describeSetting('closed_days', v(5))).toBe('5 ngày nghỉ: 01/01/2027, 02/01/2027, 03/01/2027 và 2 ngày khác');
  });
  it('findClosedDay finds a date or nothing', () => {
    const days = [{ date: '2027-01-01', note: 'Tết dương lịch' }];
    expect(findClosedDay(days, '2027-01-01')).toEqual({ date: '2027-01-01', note: 'Tết dương lịch' });
    expect(findClosedDay(days, '2027-01-02')).toBeUndefined();
    expect(findClosedDay([], '2027-01-01')).toBeUndefined();
  });
});
