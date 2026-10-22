import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS as D, FIXED_RULES, SETTINGS_MSG, applySettingsPatch, changedSettings, describeSetting, isOverdue, validateSettingsPatch,
} from './app-settings';

describe('defaults', () => {
  it('are the demo defaults', () => {
    expect(D).toEqual({ stock_expiry_days: 30, stock_default_min: 5, default_duration_kham: 30, default_duration_spa: 60, calendar_start: '08:00', calendar_end: '21:00', payment_methods: ['cash', 'transfer', 'qr'], request_overdue_hours: 24 });
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
