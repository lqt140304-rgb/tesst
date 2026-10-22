import { describe, expect, it } from 'vitest';
import { TEST_NOW, loginAs, makeTestApi } from '../../testing';
import { createMockApi } from '..';
import { createKV, memoryStorage } from '../../store/kv';
import { AuthError, ConflictError, ForbiddenError, type ValidationError } from '../../../contracts/errors';
import { STAFF_MSG } from '../../../rules/staff-admin';
import { MSG } from '../../../rules/validation';

type Api = ReturnType<typeof makeTestApi>['api'];
type Db = ReturnType<typeof makeTestApi>['db'];
const fieldsOf = async (p: Promise<unknown>) => ((await p.catch((e) => e)) as ValidationError).fields;
const row = (db: Db, username: string) => db.read().t.staff_users.find((u) => u.username === username)!;

async function setup() {
  const t = makeTestApi();
  await loginAs(t.api, 'quanly_ha');
  return t;
}

it('lists everyone with active people first, marks the caller, and never carries a password', async () => {
  const { api } = await setup();
  const rows = await api.staff.team.list();
  expect(rows.map((r) => r.username)).toEqual(['quanly_ha', 'bacsi_duc', 'bacsi_mai', 'spa_ngocanh']);
  expect(rows.find((r) => r.isSelf)!.username).toBe('quanly_ha');
  expect(rows[0]).toMatchObject({ name: 'Nguyễn Thu Hà', presets: ['quan_ly'], active: true, version: 1 });
  expect(JSON.stringify(rows)).not.toMatch(/password|salt|hash/i);
});

describe('create', () => {
  const input = { username: 'bacsi_moi', password: 'matkhau-moi-1', display_name: 'BS. Mới', title: 'Bác sĩ' } as const;
  const bacSi = { preset_ids: ['bac_si' as const], extra_capabilities: [] };
  it('adds the person, drops capabilities the role already has, audits without the password, and they can sign in', async () => {
    const { api, db } = await setup();
    const id = await api.staff.team.create({ ...input, preset_ids: ['bac_si'], extra_capabilities: ['stock.receive', 'appointments.view'] });
    expect(row(db, 'bacsi_moi')).toMatchObject({ id, display_name: 'BS. Mới', title: 'Bác sĩ', preset_ids: ['bac_si'], extra_capabilities: ['stock.receive'], active: true, is_sample: true, version: 1 });
    expect(row(db, 'bacsi_moi').password_hash).not.toBe(input.password);
    const audit = db.read().t.audit_events.at(-1)!;
    expect(audit).toMatchObject({ action: 'staff.create', sensitive: true });
    expect(JSON.stringify(audit)).not.toContain(input.password);
    await api.auth.logout();
    await api.auth.login({ identifier: 'bacsi_moi', password: input.password });
    expect(((await api.auth.me()) as { caps: string[] }).caps).toContain('stock.receive');
  });
  it('refuses a username used by staff or by a customer, a bad one, a weak password and a blank name — and writes nothing', async () => {
    const { api, db } = await setup();
    const n = db.read().t.staff_users.length;
    expect(await fieldsOf(api.staff.team.create({ ...input, ...bacSi, username: 'bacsi_duc' }))).toEqual({ username: MSG.usernameTaken });
    expect(await fieldsOf(api.staff.team.create({ ...input, ...bacSi, username: 'lan_nguyen' }))).toEqual({ username: MSG.usernameTaken });
    expect(await fieldsOf(api.staff.team.create({ ...input, ...bacSi, username: 'ab', password: 'abc', display_name: ' ' }))).toEqual({ username: MSG.usernameLength, password: MSG.passwordShort, display_name: STAFF_MSG.name });
    expect(db.read().t.staff_users).toHaveLength(n);
  });
  it('two creates of the same username at once: one wins, the other is told the name is taken', async () => {
    const { api, db } = await setup();
    const rs = await Promise.allSettled([api.staff.team.create({ ...input, ...bacSi }), api.staff.team.create({ ...input, ...bacSi })]);
    expect(rs.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(((rs.find((r) => r.status === 'rejected') as PromiseRejectedResult).reason as ValidationError).fields).toEqual({ username: MSG.usernameTaken });
    expect(db.read().t.staff_users.filter((u) => u.username === 'bacsi_moi')).toHaveLength(1);
  });
});

describe('update', () => {
  it('changes name, title, role and extra capabilities and bumps the version; a stale version is refused', async () => {
    const { api, db } = await setup();
    const u = row(db, 'bacsi_mai');
    await api.staff.team.update(u.id, u.version, { display_name: 'BS. Mai Lan', title: 'Bác sĩ nội trú', preset_ids: ['bac_si'], extra_capabilities: ['stock.receive'] });
    expect(row(db, 'bacsi_mai')).toMatchObject({ display_name: 'BS. Mai Lan', title: 'Bác sĩ nội trú', extra_capabilities: ['stock.receive'], version: u.version + 1 });
    expect(db.read().t.audit_events.at(-1)).toMatchObject({ action: 'staff.update', sensitive: true });
    await expect(api.staff.team.update(u.id, u.version, { display_name: 'X', title: 'Y', preset_ids: ['bac_si'], extra_capabilities: [] })).rejects.toThrow(ConflictError);
  });
  it('the last manager cannot lose the role; with a second manager it can', async () => {
    const { api, db } = await setup();
    const me = row(db, 'quanly_ha');
    const demote = { display_name: me.display_name, title: me.title, preset_ids: ['bac_si' as const], extra_capabilities: [] };
    expect(await fieldsOf(api.staff.team.update(me.id, me.version, demote))).toEqual({ preset_ids: STAFF_MSG.lastManager });
    await api.staff.team.create({ username: 'quanly_hai', password: 'matkhau-moi-1', display_name: 'Quản lý Hai', title: 'Quản lý', preset_ids: ['quan_ly'], extra_capabilities: [] });
    await expect(api.staff.team.update(me.id, me.version, demote)).resolves.toBeUndefined();
  });
});

describe('setActive', () => {
  it('cannot switch off yourself', async () => {
    const { api, db } = await setup();
    const me = row(db, 'quanly_ha');
    expect(await fieldsOf(api.staff.team.setActive(me.id, me.version, false))).toEqual({ active: STAFF_MSG.selfOff });
  });
  it('switching a person off stops sign-in and moves them to the end; switching on again restores it', async () => {
    const { api, db } = await setup();
    const u = row(db, 'bacsi_duc');
    await api.staff.team.setActive(u.id, u.version, false);
    expect((await api.staff.team.list()).at(-1)).toMatchObject({ username: 'bacsi_duc', active: false });
    expect(db.read().t.audit_events.at(-1)).toMatchObject({ action: 'staff.deactivate', sensitive: true });
    await api.auth.logout();
    await expect(api.auth.login({ identifier: 'bacsi_duc', password: 'leson-demo' })).rejects.toThrow(AuthError);
    await loginAs(api, 'quanly_ha');
    const off = row(db, 'bacsi_duc');
    await api.staff.team.setActive(off.id, off.version, true);
    await api.auth.logout();
    await expect(api.auth.login({ identifier: 'bacsi_duc', password: 'leson-demo' })).resolves.toBeTruthy();
  });
  it('a non-manager who holds staff.manage cannot switch off a manager account', async () => {
    const { api, db } = makeTestApi();
    db.transact('t', (d) => { d.t.staff_users.find((u) => u.username === 'bacsi_duc')!.extra_capabilities = ['staff.manage']; });
    await loginAs(api, 'bacsi_duc');
    const boss = row(db, 'quanly_ha');
    expect(await fieldsOf(api.staff.team.setActive(boss.id, boss.version, false))).toEqual({ active: STAFF_MSG.managerOnly });
    expect(row(db, 'quanly_ha').active).toBe(true);
  });
});

describe('resetPassword', () => {
  it('sets a new password for someone else: the old one stops working, nothing leaks, audit is sensitive', async () => {
    const { api, db } = await setup();
    const u = row(db, 'spa_ngocanh');
    await api.staff.team.resetPassword(u.id, u.version, { password: 'mat-khau-tam-9' });
    const audit = db.read().t.audit_events.at(-1)!;
    expect(audit).toMatchObject({ action: 'staff.password_reset', sensitive: true });
    expect(JSON.stringify(audit)).not.toContain('mat-khau-tam-9');
    await api.auth.logout();
    await expect(api.auth.login({ identifier: 'spa_ngocanh', password: 'leson-demo' })).rejects.toThrow(AuthError);
    await expect(api.auth.login({ identifier: 'spa_ngocanh', password: 'mat-khau-tam-9' })).resolves.toBeTruthy();
  });
  it('refuses your own account, a weak password and a stale version', async () => {
    const { api, db } = await setup();
    const me = row(db, 'quanly_ha');
    const u = row(db, 'spa_ngocanh');
    expect(await fieldsOf(api.staff.team.resetPassword(me.id, me.version, { password: 'mat-khau-tam-9' }))).toEqual({ password: STAFF_MSG.selfPassword });
    expect(await fieldsOf(api.staff.team.resetPassword(u.id, u.version, { password: 'abc' }))).toEqual({ password: MSG.passwordShort });
    await api.staff.team.resetPassword(u.id, u.version, { password: 'mat-khau-tam-9' });
    await expect(api.staff.team.resetPassword(u.id, u.version, { password: 'mat-khau-tam-8' })).rejects.toThrow(ConflictError);
  });
});

describe('staff.manage alone is not the manager role', () => {
  async function asDoctorAdmin(extra: ('staff.manage' | 'stock.receive')[] = ['staff.manage']) {
    const t = makeTestApi();
    t.db.transact('t', (d) => { d.t.staff_users.find((u) => u.username === 'bacsi_duc')!.extra_capabilities = ['requests.handle', ...extra]; });
    await loginAs(t.api, 'bacsi_duc');
    return t;
  }
  it('cannot give themselves or anyone the manager role', async () => {
    const { api, db } = await asDoctorAdmin();
    const me = row(db, 'bacsi_duc');
    const mai = row(db, 'bacsi_mai');
    expect(await fieldsOf(api.staff.team.update(me.id, me.version, { display_name: me.display_name, title: me.title, preset_ids: ['bac_si', 'quan_ly'], extra_capabilities: ['staff.manage'] }))).toEqual({ preset_ids: STAFF_MSG.beyondYou });
    expect(await fieldsOf(api.staff.team.update(mai.id, mai.version, { display_name: mai.display_name, title: mai.title, preset_ids: ['quan_ly'], extra_capabilities: [] }))).toEqual({ preset_ids: STAFF_MSG.beyondYou });
    expect(row(db, 'bacsi_duc').preset_ids).toEqual(['bac_si']);
  });
  it('cannot grant a capability they do not hold, but can grant one they hold', async () => {
    const { api, db } = await asDoctorAdmin(['staff.manage', 'stock.receive']);
    const mai = row(db, 'bacsi_mai');
    const base = { display_name: mai.display_name, title: mai.title, preset_ids: ['bac_si' as const] };
    expect(await fieldsOf(api.staff.team.update(mai.id, mai.version, { ...base, extra_capabilities: ['reports.revenue'] }))).toEqual({ extra_capabilities: STAFF_MSG.beyondYou });
    await expect(api.staff.team.update(mai.id, mai.version, { ...base, extra_capabilities: ['stock.receive'] })).resolves.toBeUndefined();
  });
  it('cannot create a manager, but can create a person within what they hold', async () => {
    const { api } = await asDoctorAdmin();
    const who = { password: 'matkhau-moi-1', display_name: 'A', title: 'B', extra_capabilities: [] };
    expect(await fieldsOf(api.staff.team.create({ ...who, username: 'quanly_ba', preset_ids: ['quan_ly'] }))).toEqual({ preset_ids: STAFF_MSG.beyondYou });
    await expect(api.staff.team.create({ ...who, username: 'bacsi_ba', preset_ids: ['bac_si'] })).resolves.toBeTruthy();
  });
  it('cannot change, reset or switch off a manager account', async () => {
    const { api, db } = await asDoctorAdmin();
    const boss = row(db, 'quanly_ha');
    expect(await fieldsOf(api.staff.team.update(boss.id, boss.version, { display_name: 'Chị Hà', title: boss.title, preset_ids: ['quan_ly'], extra_capabilities: [] }))).toEqual({ preset_ids: STAFF_MSG.managerOnly });
    expect(await fieldsOf(api.staff.team.resetPassword(boss.id, boss.version, { password: 'mat-khau-tam-9' }))).toEqual({ password: STAFF_MSG.managerOnly });
    expect(await fieldsOf(api.staff.team.setActive(boss.id, boss.version, false))).toEqual({ active: STAFF_MSG.managerOnly });
    expect(row(db, 'quanly_ha')).toMatchObject({ display_name: 'Nguyễn Thu Hà', active: true, version: boss.version });
  });
  it('a manager can do all of these', async () => {
    const { api, db } = await setup();
    const mai = row(db, 'bacsi_mai');
    await expect(api.staff.team.update(mai.id, mai.version, { display_name: mai.display_name, title: mai.title, preset_ids: ['bac_si', 'quan_ly'], extra_capabilities: [] })).resolves.toBeUndefined();
  });
});

describe('audit and input hygiene', () => {
  it('the sensitive update line says what changed: role and capability labels before and after', async () => {
    const { api, db } = await setup();
    const mai = row(db, 'bacsi_mai');
    await api.staff.team.update(mai.id, mai.version, { display_name: mai.display_name, title: mai.title, preset_ids: ['bac_si'], extra_capabilities: ['staff.manage'] });
    const line = db.read().t.audit_events.at(-1)!.summary_vi;
    expect(line).toContain('Quản lý tài khoản nhân viên');
    expect(line).toContain('Bác sĩ');
  });
  it('a role listed twice is stored once, and an unknown role name is refused', async () => {
    const { api, db } = await setup();
    await api.staff.team.create({ username: 'bacsi_hai', password: 'matkhau-moi-1', display_name: 'A', title: 'B', preset_ids: ['bac_si', 'bac_si'], extra_capabilities: [] });
    expect(row(db, 'bacsi_hai').preset_ids).toEqual(['bac_si']);
    expect(await fieldsOf(api.staff.team.create({ username: 'bacsi_ba', password: 'matkhau-moi-1', display_name: 'A', title: 'B', preset_ids: ['constructor' as never], extra_capabilities: [] }))).toEqual({ preset_ids: STAFF_MSG.presetUnknown });
  });
});

describe('a change takes effect on the person already signed in', () => {
  it('extra capabilities and switching off apply on their next call', async () => {
    const t = makeTestApi();
    const second = createMockApi({ db: t.db, sessionKV: createKV(memoryStorage()), rememberKV: createKV(memoryStorage()), clock: () => new Date(TEST_NOW) });
    await loginAs(t.api, 'quanly_ha');
    await loginAs(second, 'bacsi_duc');
    const item = () => t.db.read().t.stock_items.find((i) => i.code === 'KHO-0001')!;
    await expect(second.staff.stock.receive(item().id, item().version, { qty: 1 })).rejects.toThrow(ForbiddenError);
    const u = row(t.db, 'bacsi_duc');
    await t.api.staff.team.update(u.id, u.version, { display_name: u.display_name, title: u.title, preset_ids: ['bac_si'], extra_capabilities: ['stock.receive'] });
    await expect(second.staff.stock.receive(item().id, item().version, { qty: 1 })).resolves.toBeUndefined();
    const again = row(t.db, 'bacsi_duc');
    await t.api.staff.team.setActive(again.id, again.version, false);
    await expect(second.staff.stock.receive(item().id, item().version, { qty: 1 })).rejects.toThrow(ForbiddenError);
  });
});

describe('permissions', () => {
  const calls = (api: Api, id: string, v: number) => [
    () => api.staff.team.list(),
    () => api.staff.team.create({ username: 'ai_do', password: 'matkhau-moi-1', display_name: 'A', title: 'B', preset_ids: ['spa'], extra_capabilities: [] }),
    () => api.staff.team.update(id, v, { display_name: 'A', title: 'B', preset_ids: ['spa'], extra_capabilities: [] }),
    () => api.staff.team.setActive(id, v, false),
    () => api.staff.team.resetPassword(id, v, { password: 'matkhau-moi-1' }),
  ];
  it.each(['bacsi_duc', 'bacsi_mai', 'spa_ngocanh', 'lan_nguyen'])('%s is refused every team function and nothing changes', async (who) => {
    const { api, db } = makeTestApi();
    await loginAs(api, who);
    const u = row(db, 'spa_ngocanh');
    const rev = db.read().rev;
    for (const call of calls(api, u.id, u.version)) await expect(call()).rejects.toThrow(ForbiddenError);
    expect(db.read().rev).toBe(rev);
  });
  it('a signed-out visitor is refused every team function', async () => {
    const { api, db } = makeTestApi();
    const u = row(db, 'spa_ngocanh');
    for (const call of calls(api, u.id, u.version)) await expect(call()).rejects.toThrow(ForbiddenError);
  });
});
