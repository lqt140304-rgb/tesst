import { describe, expect, it } from 'vitest';
import { TEST_NOW, loginAs, makeTestApi } from '../../testing';
import { createMockApi } from '..';
import { createKV, memoryStorage } from '../../store/kv';
import { createDb } from '../../store/db';
import { buildSeed } from '../../seed';
import { setLatency } from '../../latency';
import { ConflictError, ForbiddenError, type ValidationError } from '../../../contracts/errors';
import { DEFAULT_SETTINGS, FIXED_RULES, SETTINGS_MSG } from '../../../rules/app-settings';

const fieldsOf = async (p: Promise<unknown>) => ((await p.catch((e) => e)) as ValidationError).fields;

async function manager() {
  const t = makeTestApi();
  await loginAs(t.api, 'quanly_ha');
  return t;
}

describe('get', () => {
  it.each(['quanly_ha', 'bacsi_duc', 'bacsi_mai', 'spa_ngocanh'])('%s reads the defaults, the fixed rules and version 1', async (who) => {
    const { api } = makeTestApi();
    await loginAs(api, who);
    expect(await api.staff.settings.get()).toEqual({ version: 1, values: DEFAULT_SETTINGS, fixedRules: FIXED_RULES });
  });
  it('a customer and a signed-out visitor are refused, for reading and for writing', async () => {
    const t = makeTestApi();
    await expect(t.api.staff.settings.get()).rejects.toThrow(ForbiddenError);
    await expect(t.api.staff.settings.update(1, { stock_default_min: 8 })).rejects.toThrow(ForbiddenError);
    await loginAs(t.api, 'lan_nguyen');
    await expect(t.api.staff.settings.get()).rejects.toThrow(ForbiddenError);
    await expect(t.api.staff.settings.update(1, { stock_default_min: 8 })).rejects.toThrow(ForbiddenError);
  });
  it('a missing or empty settings table reads as the defaults and the first update creates the row', async () => {
    const { api, db } = await manager();
    db.transact('t', (d) => { d.t.app_settings = []; });
    expect(await api.staff.settings.get()).toMatchObject({ version: 1, values: DEFAULT_SETTINGS });
    expect(await api.staff.settings.update(1, { stock_default_min: 9 })).toMatchObject({ version: 2, values: { ...DEFAULT_SETTINGS, stock_default_min: 9 } });
    expect(db.read().t.app_settings).toHaveLength(1);
  });
});

describe('update rights', () => {
  it('only settings.manage may change: the manager yes, Bác sĩ and Spa no, a Bác sĩ with the extra capability yes', async () => {
    const t = makeTestApi();
    for (const who of ['bacsi_duc', 'spa_ngocanh']) {
      await loginAs(t.api, who);
      await expect(t.api.staff.settings.update(1, { stock_default_min: 8 })).rejects.toThrow(ForbiddenError);
    }
    t.db.transact('t', (d) => { d.t.staff_users.find((u) => u.username === 'bacsi_duc')!.extra_capabilities = ['settings.manage']; });
    await loginAs(t.api, 'bacsi_duc');
    expect((await t.api.staff.settings.update(1, { stock_default_min: 8 })).values.stock_default_min).toBe(8);
  });
});

describe('update', () => {
  it('returns the new view, bumps the version once, and audits one line per changed setting', async () => {
    const { api, db } = await manager();
    const r = await api.staff.settings.update(1, { stock_expiry_days: 60, payment_methods: ['qr', 'cash'], stock_default_min: 5 });
    expect(r).toMatchObject({ version: 2, values: { stock_expiry_days: 60, payment_methods: ['cash', 'qr'], stock_default_min: 5 } });
    expect(await api.staff.settings.get()).toEqual(r);
    const lines = db.read().t.audit_events.filter((e) => e.action === 'settings.update').map((e) => e.summary_vi);
    expect(lines).toEqual([
      'Nguyễn Thu Hà đổi "Số ngày báo sắp hết hạn" từ 30 ngày sang 60 ngày',
      'Nguyễn Thu Hà đổi "Phương thức thanh toán đang dùng" từ Tiền mặt, Chuyển khoản, QR ngân hàng sang Tiền mặt, QR ngân hàng',
    ]);
    expect(db.read().t.audit_events.at(-1)).toMatchObject({ entity_type: 'app_settings', entity_id: 'main', sensitive: false });
  });
  it('a patch that changes nothing writes nothing, even with an old version', async () => {
    const { api, db } = await manager();
    const rev = db.read().rev;
    expect((await api.staff.settings.update(1, {})).version).toBe(1);
    expect((await api.staff.settings.update(99, { stock_expiry_days: 30, payment_methods: ['qr', 'transfer', 'cash'] })).version).toBe(1);
    expect(db.read().rev).toBe(rev);
  });
  it('an old version is a conflict and writes nothing', async () => {
    const { api, db } = await manager();
    await api.staff.settings.update(1, { stock_default_min: 8 });
    const rev = db.read().rev;
    await expect(api.staff.settings.update(1, { stock_expiry_days: 60 })).rejects.toThrow(ConflictError);
    expect(db.read().rev).toBe(rev);
  });
  it('two tabs with the same version: one wins, the other is told it is out of date', async () => {
    setLatency(0);
    const kv = createKV(memoryStorage());
    const clock = () => new Date(TEST_NOW);
    const mk = () => {
      const db = createDb({ kv, clock, seed: buildSeed });
      return { db, api: createMockApi({ db, sessionKV: createKV(memoryStorage()), rememberKV: createKV(memoryStorage()), clock }) };
    };
    const a = mk();
    const b = mk();
    await loginAs(a.api, 'quanly_ha');
    await loginAs(b.api, 'quanly_ha');
    const results = await Promise.allSettled([a.api.staff.settings.update(1, { stock_expiry_days: 60 }), b.api.staff.settings.update(1, { request_overdue_hours: 48 })]);
    expect(results.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect((results.find((r) => r.status === 'rejected') as PromiseRejectedResult).reason).toBeInstanceOf(ConflictError);
    b.db.reloadFromStorage();
    const view = await b.api.staff.settings.get();
    expect(view.version).toBe(2);
    expect(view.values.stock_expiry_days === 60 || view.values.request_overdue_hours === 48).toBe(true);
    expect(view.values.stock_expiry_days === 60 && view.values.request_overdue_hours === 48).toBe(false);
  });
});

describe('a tab that missed another tab\'s save', () => {
  it('judges "nothing changed" on the latest values, so asking for what is already there is not a conflict', async () => {
    setLatency(0);
    const kv = createKV(memoryStorage());
    const clock = () => new Date(TEST_NOW);
    const mk = () => {
      const db = createDb({ kv, clock, seed: buildSeed });
      return { db, api: createMockApi({ db, sessionKV: createKV(memoryStorage()), rememberKV: createKV(memoryStorage()), clock }) };
    };
    const a = mk();
    const b = mk();
    await loginAs(a.api, 'quanly_ha');
    await loginAs(b.api, 'quanly_ha');
    await b.api.staff.settings.update(1, { stock_expiry_days: 60 });
    const r = await a.api.staff.settings.update(1, { stock_expiry_days: 60 });
    expect(r).toMatchObject({ version: 2, values: { stock_expiry_days: 60 } });
  });
});

describe('refused patches write nothing', () => {
  it('good fields next to bad ones, unknown keys, wrong types', async () => {
    const { api, db } = await manager();
    const rev = db.read().rev;
    expect(await fieldsOf(api.staff.settings.update(1, { stock_expiry_days: 60, stock_default_min: -1, colour: 1, request_overdue_hours: '24' } as never)))
      .toEqual({ stock_default_min: SETTINGS_MSG.stock_default_min, colour: SETTINGS_MSG.unknown, request_overdue_hours: SETTINGS_MSG.request_overdue_hours });
    expect(await fieldsOf(api.staff.settings.update(1, 'x' as never))).toEqual({ settings: SETTINGS_MSG.shape });
    expect(db.read().rev).toBe(rev);
    expect((await api.staff.settings.get()).values.stock_expiry_days).toBe(30);
  });
  it('an own __proto__ key and a sparse methods list', async () => {
    const { api, db } = await manager();
    const rev = db.read().rev;
    expect(Object.keys(await fieldsOf(api.staff.settings.update(1, JSON.parse('{"__proto__": {"x": 1}}'))))).toEqual(['__proto__']);
    expect(await fieldsOf(api.staff.settings.update(1, { payment_methods: new Array(2) } as never))).toEqual({ payment_methods: SETTINGS_MSG.payment_methods });
    expect(await fieldsOf(api.staff.settings.update(1, { payment_methods: [] }))).toEqual({ payment_methods: SETTINGS_MSG.payment_methods });
    expect(db.read().rev).toBe(rev);
  });
  it('calendar hours are checked together with the stored value', async () => {
    const { api } = await manager();
    expect((await api.staff.settings.update(1, { calendar_end: '12:00' })).values.calendar_end).toBe('12:00');
    expect(await fieldsOf(api.staff.settings.update(2, { calendar_start: '09:00' }))).toEqual({ calendar_start: SETTINGS_MSG.span });
    expect((await api.staff.settings.update(2, { calendar_start: '06:00', calendar_end: '18:00' })).values).toMatchObject({ calendar_start: '06:00', calendar_end: '18:00' });
  });
});
