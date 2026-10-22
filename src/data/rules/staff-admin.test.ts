import { describe, expect, it } from 'vitest';
import {
  STAFF_MSG, hasActiveManager, normalizeExtraCaps, validateNameChange, validateNewStaff, validatePasswordChange, validateStaffInput,
} from './staff-admin';
import { MSG } from './validation';

const ok = { display_name: 'BS. Mới', title: 'Bác sĩ', preset_ids: ['bac_si'], extra_capabilities: [] } as const;
const input = (o: object) => ({ ...ok, preset_ids: [...ok.preset_ids], extra_capabilities: [], ...o }) as Parameters<typeof validateStaffInput>[0];

describe('validateStaffInput', () => {
  it('accepts a good input; spaces around name and title are ignored', () => {
    expect(validateStaffInput(input({}))).toEqual({});
    expect(validateStaffInput(input({ display_name: '  ', title: ' ' }))).toEqual({ display_name: STAFF_MSG.name, title: STAFF_MSG.title });
  });
  it('limits the length of name (60) and title (40)', () => {
    expect(validateStaffInput(input({ display_name: 'x'.repeat(61) })).display_name).toBe(STAFF_MSG.nameLong);
    expect(validateStaffInput(input({ title: 'x'.repeat(41) })).title).toBe(STAFF_MSG.titleLong);
    expect(validateStaffInput(input({ display_name: 'x'.repeat(60), title: 'x'.repeat(40) }))).toEqual({});
  });
  it('needs at least one known role and only known capabilities', () => {
    expect(validateStaffInput(input({ preset_ids: [] })).preset_ids).toBe(STAFF_MSG.presets);
    expect(validateStaffInput(input({ preset_ids: ['chu'] })).preset_ids).toBe(STAFF_MSG.presetUnknown);
    expect(validateStaffInput(input({ extra_capabilities: ['x.y'] })).extra_capabilities).toBe(STAFF_MSG.capUnknown);
  });
});

describe('validateNewStaff', () => {
  it('uses the sign-up rules for username and password', () => {
    expect(validateNewStaff({ ...input({}), username: 'bacsi_moi', password: 'matkhau-moi-1' })).toEqual({});
    expect(validateNewStaff({ ...input({}), username: 'ab', password: 'abc' })).toEqual({ username: MSG.usernameLength, password: MSG.passwordShort });
  });
});

describe('normalizeExtraCaps', () => {
  it('drops what the role already gives and duplicates, in capability order', () => {
    expect(normalizeExtraCaps(['bac_si'], ['stock.manage', 'appointments.view', 'stock.view', 'stock.view'])).toEqual(['stock.view', 'stock.manage']);
    expect(normalizeExtraCaps(['quan_ly'], ['stock.view'])).toEqual([]);
  });
});

describe('hasActiveManager', () => {
  it('needs an active user with the manager role', () => {
    expect(hasActiveManager([{ active: true, preset_ids: ['quan_ly'] }])).toBe(true);
    expect(hasActiveManager([{ active: false, preset_ids: ['quan_ly'] }, { active: true, preset_ids: ['bac_si'] }])).toBe(false);
    expect(hasActiveManager([{ active: true, preset_ids: ['bac_si', 'quan_ly'] }])).toBe(true);
    expect(hasActiveManager([])).toBe(false);
  });
});

describe('name and password change', () => {
  it('name: empty and over 60 are refused', () => {
    expect(validateNameChange(' ')).toBe(STAFF_MSG.name);
    expect(validateNameChange('x'.repeat(61))).toBe(STAFF_MSG.nameLong);
    expect(validateNameChange('  Hà  ')).toBeNull();
  });
  it('password: each error on its own field', () => {
    const good = { current: 'cu-matkhau-1', next: 'moi-matkhau-2', next2: 'moi-matkhau-2' };
    expect(validatePasswordChange(good, true)).toEqual({});
    expect(validatePasswordChange(good, false)).toEqual({ current: STAFF_MSG.currentWrong });
    expect(validatePasswordChange({ ...good, next: 'abc', next2: 'abc' }, true)).toEqual({ next: MSG.passwordShort });
    expect(validatePasswordChange({ ...good, next: good.current, next2: good.current }, true)).toEqual({ next: STAFF_MSG.samePassword });
    expect(validatePasswordChange({ ...good, next2: 'khac-hoan-toan' }, true)).toEqual({ next2: MSG.passwordMismatch });
  });
});
