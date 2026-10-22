import { describe, expect, it } from 'vitest';
import type { Cap } from '@/data/rules/capabilities';
import { defaultPrefs } from '@/data/rules/staff-prefs';
import { appearanceAttrs, landingChoices, landingPath, mergePrefs, nudgeChoices, reportPeriod, revertPatch, viewFromPref } from './prefsView';

const can = (...caps: Cap[]) => (c: Cap | Cap[]) => (Array.isArray(c) ? c : [c]).some((x) => caps.includes(x));

describe('landing pages', () => {
  it('map to the staff addresses', () => {
    expect(landingPath('home')).toBe('/nv');
    expect(landingPath('appointments')).toBe('/nv/lich-hen');
    expect(landingPath('inpatient')).toBe('/nv/noi-tru');
    expect(landingPath('invoices')).toBe('/nv/hoa-don');
  });
  it('offer only what the person may open, home always first', () => {
    expect(landingChoices(can())).toEqual(['home']);
    expect(landingChoices(can('appointments.view'))).toEqual(['home', 'appointments']);
    expect(landingChoices(can('payments.record', 'inpatient.view'))).toEqual(['home', 'inpatient', 'invoices']);
    expect(landingChoices(can('invoices.create'))).toContain('invoices');
  });
});

describe('nudge choices', () => {
  it('follow the rights of the kind', () => {
    expect(nudgeChoices(can('appointments.view', 'stock.view'))).toEqual([]);
    expect(nudgeChoices(can('requests.handle'))).toEqual(['requests', 'reschedules']);
    expect(nudgeChoices(can('requests.handle', 'stock.receive', 'invoices.create'))).toEqual(['requests', 'reschedules', 'stock', 'drafts']);
    expect(nudgeChoices(can('stock.items'))).toEqual(['stock']);
  });
});

describe('small mappings', () => {
  it('report range to period', () => {
    expect(reportPeriod('7d')).toBe('7d');
    expect(reportPeriod('30d')).toBe('30d');
    expect(reportPeriod('month')).toBe('month');
  });
  it('calendar view to the address word', () => {
    expect(viewFromPref('day')).toBe('ngay');
    expect(viewFromPref('week')).toBe('tuan');
  });
  it('appearance attributes', () => {
    expect(appearanceAttrs({ text_size: 'lg', density: 'compact', motion: 'reduced' })).toEqual({
      'data-staff-text': 'lg', 'data-staff-density': 'compact', 'data-staff-motion': 'reduced',
    });
    expect(appearanceAttrs({ text_size: 'md', density: 'comfortable', motion: 'system' })['data-staff-text']).toBe('md');
  });
});

describe('saving several choices in a row', () => {
  const base = defaultPrefs(new Set<Cap>(['requests.handle']));
  it('merges a patch, nudges one by one', () => {
    const next = mergePrefs(base, { text_size: 'lg', nudges: { requests: false } });
    expect(next.text_size).toBe('lg');
    expect(next.nudges).toEqual({ ...base.nudges, requests: false });
    expect(base.text_size).toBe('md');
  });
  it('a refused save takes back only its own keys, never a newer choice', () => {
    const shown = mergePrefs(mergePrefs(base, { text_size: 'lg' }), { density: 'compact' });
    const back = revertPatch(shown, base, { text_size: 'lg' });
    expect(back.text_size).toBe('md');
    expect(back.density).toBe('compact');
  });
  it('takes back one nudge without touching the others', () => {
    const shown = mergePrefs(base, { nudges: { requests: false, reschedules: false } });
    const back = revertPatch(shown, base, { nudges: { requests: false } });
    expect(back.nudges.requests).toBe(base.nudges.requests);
    expect(back.nudges.reschedules).toBe(false);
  });
});
