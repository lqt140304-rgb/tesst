import { describe, expect, it } from 'vitest';
import { effectiveCaps } from './capabilities';
import { defaultPrefs, mergePatch, PREFS_MSG, resolvePrefs, validatePrefsPatch } from './staff-prefs';

const mgr = effectiveCaps({ preset_ids: ['quan_ly'], extra_capabilities: [] });
const doctor = effectiveCaps({ preset_ids: ['bac_si'], extra_capabilities: [] });
const spa = effectiveCaps({ preset_ids: ['spa'], extra_capabilities: [] });

describe('defaults follow the role', () => {
  it('the same visible defaults for everyone; nudges only for what the role can do', () => {
    expect(defaultPrefs(mgr)).toEqual({ text_size: 'md', density: 'comfortable', motion: 'system', landing: 'home', appointments_view: 'day', page_size: 20, report_range: '7d', nudges: { requests: true, reschedules: true, stock: true, drafts: true }, onboarding_done: [], onboarding_hidden: false });
    expect(defaultPrefs(doctor).nudges).toEqual({ requests: false, reschedules: false, stock: false, drafts: true });
    expect(defaultPrefs(spa).nudges).toEqual({ requests: false, reschedules: false, stock: false, drafts: false });
  });
});

describe('resolvePrefs', () => {
  it('stored values win over defaults; the rest stay default', () => {
    expect(resolvePrefs({ text_size: 'lg', page_size: 50, nudges: { drafts: false } }, doctor)).toMatchObject({ text_size: 'lg', page_size: 50, density: 'comfortable', nudges: { drafts: false } });
  });
  it('a landing page or a nudge the person has since lost the right to falls back, without being erased', () => {
    const stored = { landing: 'invoices' as const, nudges: { stock: true } };
    expect(resolvePrefs(stored, mgr)).toMatchObject({ landing: 'invoices', nudges: { stock: true } });
    expect(resolvePrefs(stored, spa)).toMatchObject({ landing: 'home', nudges: { stock: false } });
  });
});

describe('validatePrefsPatch', () => {
  it('accepts every good value and an empty patch', () => {
    expect(validatePrefsPatch({}, mgr)).toEqual({});
    expect(validatePrefsPatch({ text_size: 'lg', density: 'compact', motion: 'reduced', landing: 'inpatient', appointments_view: 'day', page_size: 50, report_range: 'month', nudges: { stock: false }, onboarding_done: ['xem-lich', 'lap_hoa_don'], onboarding_hidden: true }, mgr)).toEqual({});
  });
  it('wrong values are refused on their own field', () => {
    expect(validatePrefsPatch({ text_size: 'xl', density: 3, motion: null, appointments_view: 'month', report_range: '1y' }, mgr)).toEqual({ text_size: PREFS_MSG.text_size, density: PREFS_MSG.density, motion: PREFS_MSG.motion, appointments_view: PREFS_MSG.appointments_view, report_range: PREFS_MSG.report_range });
    expect(validatePrefsPatch({ page_size: '20' }, mgr)).toEqual({ page_size: PREFS_MSG.page_size });
    expect(validatePrefsPatch({ page_size: 25 }, mgr)).toEqual({ page_size: PREFS_MSG.page_size });
    expect(validatePrefsPatch({ landing: 'revenue' }, mgr)).toEqual({ landing: PREFS_MSG.landing });
  });
  it('unknown keys, including inherited names, and a patch that is not an object', () => {
    expect(validatePrefsPatch({ colour: 'red' }, mgr)).toEqual({ colour: PREFS_MSG.unknown });
    // `__proto__` from JSON is an own key; a plain `{}` would swallow the error assigned to it, so look at the keys themselves.
    const errs = validatePrefsPatch(JSON.parse('{"__proto__": {"x": 1}, "constructor": 2}'), mgr);
    expect(Object.keys(errs).sort()).toEqual(['__proto__', 'constructor']);
    expect(Object.values(errs)).toEqual([PREFS_MSG.unknown, PREFS_MSG.unknown]);
    for (const bad of [null, [], 'lg', 5]) expect(validatePrefsPatch(bad, mgr)).toEqual({ prefs: PREFS_MSG.shape });
  });
  it('nudges: only booleans, only known keys, and turning one on needs the right', () => {
    expect(validatePrefsPatch({ nudges: 'on' }, mgr)).toEqual({ nudges: PREFS_MSG.shape });
    expect(validatePrefsPatch({ nudges: { stock: 'yes', colour: true } }, mgr)).toEqual({ 'nudges.stock': PREFS_MSG.nudge, 'nudges.colour': PREFS_MSG.unknown });
    expect(validatePrefsPatch({ nudges: { stock: true } }, spa)).toEqual({ 'nudges.stock': PREFS_MSG.nudgeNoAccess });
    expect(validatePrefsPatch({ nudges: { stock: false } }, spa)).toEqual({});
  });
  it('a landing page needs the right to it', () => {
    expect(validatePrefsPatch({ landing: 'invoices' }, spa)).toEqual({ landing: PREFS_MSG.landingNoAccess });
    expect(validatePrefsPatch({ landing: 'home' }, spa)).toEqual({});
    expect(validatePrefsPatch({ landing: 'invoices' }, doctor)).toEqual({});
  });
  it('the done-list: strings of a safe shape, at most 50', () => {
    expect(validatePrefsPatch({ onboarding_done: ['Có Dấu'] }, mgr)).toEqual({ onboarding_done: PREFS_MSG.onboarding_done });
    expect(validatePrefsPatch({ onboarding_done: [5] }, mgr)).toEqual({ onboarding_done: PREFS_MSG.onboarding_done });
    expect(validatePrefsPatch({ onboarding_done: Array.from({ length: 51 }, (_, i) => `k${i}`) }, mgr)).toEqual({ onboarding_done: PREFS_MSG.onboarding_done });
    expect(validatePrefsPatch({ onboarding_done: Array.from({ length: 50 }, (_, i) => `k${i}`) }, mgr)).toEqual({});
    expect(validatePrefsPatch({ onboarding_done: new Array(3) }, mgr)).toEqual({ onboarding_done: PREFS_MSG.onboarding_done });
    // eslint-disable-next-line no-sparse-arrays
    expect(validatePrefsPatch({ onboarding_done: [, 'a'] }, mgr)).toEqual({ onboarding_done: PREFS_MSG.onboarding_done });
    expect(validatePrefsPatch({ onboarding_hidden: 'yes' }, mgr)).toEqual({ onboarding_hidden: PREFS_MSG.onboarding_hidden });
  });
});

describe('mergePatch', () => {
  it('overwrites only what the patch names, nudge by nudge, and drops repeats from the done-list', () => {
    expect(mergePatch({ text_size: 'lg', nudges: { stock: true, drafts: true } }, { density: 'compact', nudges: { stock: false }, onboarding_done: ['a', 'b', 'a'] }))
      .toEqual({ text_size: 'lg', density: 'compact', nudges: { stock: false, drafts: true }, onboarding_done: ['a', 'b'] });
  });
});

describe('mergePatch keeps only known keys', () => {
  it('drops symbols and an own __proto__ instead of copying them into the stored row', () => {
    const sym = Symbol('x');
    const merged = mergePatch({}, { text_size: 'lg', [sym]: 1, ...JSON.parse('{"__proto__": {"landing": "x"}}') } as never);
    expect(Reflect.ownKeys(merged)).toEqual(['text_size']);
  });
});
