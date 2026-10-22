import { describe, expect, it } from 'vitest';
import { TEST_NOW, loginAs, makeTestApi } from '../../testing';
import { createMockApi } from '..';
import { createKV, memoryStorage } from '../../store/kv';
import { ForbiddenError, type ValidationError } from '../../../contracts/errors';
import { PREFS_MSG } from '../../../rules/staff-prefs';

const fieldsOf = async (p: Promise<unknown>) => ((await p.catch((e) => e)) as ValidationError).fields;

describe('defaults', () => {
  it.each([
    ['quanly_ha', { requests: true, reschedules: true, stock: true, drafts: true }],
    ['bacsi_duc', { requests: true, reschedules: true, stock: false, drafts: true }],
    ['bacsi_mai', { requests: false, reschedules: false, stock: false, drafts: true }],
    ['spa_ngocanh', { requests: false, reschedules: false, stock: false, drafts: false }],
  ])('%s starts with the defaults for their role', async (who, nudges) => {
    const { api } = makeTestApi();
    await loginAs(api, who);
    expect(await api.staff.prefs.get()).toMatchObject({ text_size: 'md', density: 'comfortable', motion: 'system', landing: 'home', appointments_view: 'week', page_size: 20, report_range: '7d', nudges, onboarding_done: [], onboarding_hidden: false });
  });
});

describe('save', () => {
  it('keeps only what was named, returns the merged result and survives a new session', async () => {
    const t = makeTestApi();
    await loginAs(t.api, 'bacsi_duc');
    const saved = await t.api.staff.prefs.save({ text_size: 'lg', nudges: { drafts: false }, onboarding_done: ['xem-lich', 'xem-lich'] });
    expect(saved).toMatchObject({ text_size: 'lg', density: 'comfortable', nudges: { requests: true, drafts: false }, onboarding_done: ['xem-lich'] });
    expect(t.db.read().t.staff_prefs).toEqual([{ staff_id: 'stf-duc', values: { text_size: 'lg', nudges: { drafts: false }, onboarding_done: ['xem-lich'] } }]);
    await t.api.auth.logout();
    await loginAs(t.api, 'bacsi_duc');
    expect((await t.api.staff.prefs.get()).text_size).toBe('lg');
  });
  it('two saves of different options in turn both stay', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    await api.staff.prefs.save({ page_size: 50 });
    await api.staff.prefs.save({ report_range: 'month' });
    expect(await api.staff.prefs.get()).toMatchObject({ page_size: 50, report_range: 'month' });
  });
  it('two saves at once of different options both land', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    await Promise.all([api.staff.prefs.save({ density: 'compact' }), api.staff.prefs.save({ motion: 'reduced' })]);
    expect(await api.staff.prefs.get()).toMatchObject({ density: 'compact', motion: 'reduced' });
  });
  it('a refused save writes nothing, even the good fields next to the bad one', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    const rev = db.read().rev;
    expect(await fieldsOf(api.staff.prefs.save({ text_size: 'lg', landing: 'invoices', nudges: { stock: true }, colour: 'red' } as never))).toEqual({ landing: PREFS_MSG.landingNoAccess, 'nudges.stock': PREFS_MSG.nudgeNoAccess, colour: PREFS_MSG.unknown });
    expect(db.read().rev).toBe(rev);
    expect((await api.staff.prefs.get()).text_size).toBe('md');
  });
  it('an empty patch writes nothing', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const rev = db.read().rev;
    await api.staff.prefs.save({});
    expect(db.read().rev).toBe(rev);
  });
  it("people do not see each other's options", async () => {
    const t = makeTestApi();
    const second = createMockApi({ db: t.db, sessionKV: createKV(memoryStorage()), rememberKV: createKV(memoryStorage()), clock: () => new Date(TEST_NOW) });
    await loginAs(t.api, 'quanly_ha');
    await loginAs(second, 'bacsi_mai');
    await t.api.staff.prefs.save({ text_size: 'lg' });
    expect((await second.staff.prefs.get()).text_size).toBe('md');
  });
});

describe('reset', () => {
  it('goes back to the defaults of the current role and removes the row; resetting twice is harmless', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    await api.staff.prefs.save({ text_size: 'lg' });
    expect((await api.staff.prefs.reset()).text_size).toBe('md');
    expect(db.read().t.staff_prefs).toEqual([]);
    const rev = db.read().rev;
    await api.staff.prefs.reset();
    expect(db.read().rev).toBe(rev);
  });
});

describe('rights', () => {
  it('losing a right later: the landing page reads home and the nudge reads off, the saved value stays', async () => {
    const t = makeTestApi();
    await loginAs(t.api, 'bacsi_duc');
    await t.api.staff.prefs.save({ landing: 'invoices', nudges: { requests: true } });
    t.db.transact('t', (d) => { const u = d.t.staff_users.find((x) => x.username === 'bacsi_duc')!; u.preset_ids = ['spa']; u.extra_capabilities = []; });
    expect(await t.api.staff.prefs.get()).toMatchObject({ landing: 'home', nudges: { requests: false } });
    expect(t.db.read().t.staff_prefs[0]!.values).toMatchObject({ landing: 'invoices', nudges: { requests: true } });
  });
  it('a customer, a signed-out visitor and a switched-off staff member are refused', async () => {
    const t = makeTestApi();
    await expect(t.api.staff.prefs.get()).rejects.toThrow(ForbiddenError);
    await loginAs(t.api, 'lan_nguyen');
    for (const call of [() => t.api.staff.prefs.get(), () => t.api.staff.prefs.save({ text_size: 'lg' }), () => t.api.staff.prefs.reset()]) await expect(call()).rejects.toThrow(ForbiddenError);
    await loginAs(t.api, 'bacsi_duc');
    t.db.transact('t', (d) => { d.t.staff_users.find((u) => u.username === 'bacsi_duc')!.active = false; });
    await expect(t.api.staff.prefs.get()).rejects.toThrow(ForbiddenError);
  });
});
