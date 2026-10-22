import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS as D } from '../rules/app-settings';
import { readSettings } from './settings';
import { emptyTables } from './store/schema';

const withRow = (row: unknown) => {
  const t = emptyTables();
  t.app_settings.push(row as never);
  return t;
};

describe('readSettings', () => {
  it('a missing row is the defaults at version 1', () => {
    expect(readSettings(emptyTables())).toEqual({ version: 1, values: D });
  });
  it('a row with no values at all reads as the defaults instead of crashing', () => {
    expect(readSettings(withRow({ id: 'main', version: 3 }))).toEqual({ version: 3, values: D });
    expect(readSettings(withRow({ id: 'main', version: 3, values: null }))).toEqual({ version: 3, values: D });
  });
  it('each stored value is kept only if it passes its own rule; the rest fall back; unknown keys are dropped', () => {
    const r = readSettings(withRow({ id: 'main', version: 2, values: { stock_expiry_days: 45, calendar_start: '7:00', payment_methods: [], request_overdue_hours: '24', colour: 1 } }));
    expect(r).toEqual({ version: 2, values: { ...D, stock_expiry_days: 45 } });
    expect(Object.keys(r.values)).toEqual(Object.keys(D));
  });
  it('good methods are kept in the fixed order without repeats', () => {
    expect(readSettings(withRow({ id: 'main', version: 2, values: { payment_methods: ['qr', 'cash', 'qr'] } })).values.payment_methods).toEqual(['cash', 'qr']);
  });
  it('the calendar hours are judged as a pair: a good pair is kept, a broken pair falls back together', () => {
    expect(readSettings(withRow({ id: 'main', version: 2, values: { calendar_start: '18:00', calendar_end: '23:00' } })).values).toMatchObject({ calendar_start: '18:00', calendar_end: '23:00' });
    expect(readSettings(withRow({ id: 'main', version: 2, values: { calendar_start: '10:00', calendar_end: '11:00' } })).values).toMatchObject({ calendar_start: '08:00', calendar_end: '21:00' });
    expect(readSettings(withRow({ id: 'main', version: 2, values: { calendar_start: '08:00' } })).values).toMatchObject({ calendar_start: '08:00', calendar_end: '21:00' });
  });
  it('the result never shares the stored array', () => {
    const t = withRow({ id: 'main', version: 2, values: { payment_methods: ['cash'] } });
    readSettings(t).values.payment_methods.push('qr');
    expect(t.app_settings[0]!.values.payment_methods).toEqual(['cash']);
  });
});
