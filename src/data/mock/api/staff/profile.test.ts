import { describe, expect, it } from 'vitest';
import { TEST_NOW, loginAs, makeTestApi } from '../../testing';
import { createMockApi } from '..';
import { createKV, memoryStorage } from '../../store/kv';
import { AuthError, ConflictError, ForbiddenError, type ValidationError } from '../../../contracts/errors';
import { HOSPITAL_INFO } from '../../../rules/hospital';
import { STAFF_MSG } from '../../../rules/staff-admin';
import { MSG } from '../../../rules/validation';

const fieldsOf = async (p: Promise<unknown>) => ((await p.catch((e) => e)) as ValidationError).fields;

it.each(['quanly_ha', 'bacsi_duc', 'spa_ngocanh'])('%s reads their own profile: what me() says, with role ids instead of role labels', async (who) => {
  const { api, db } = makeTestApi();
  await loginAs(api, who);
  const p = await api.staff.profile.get();
  const me = (await api.auth.me()) as { username: string; name: string; title: string; caps: string[] };
  expect(p).toEqual({ username: me.username, name: me.name, title: me.title, presets: db.read().t.staff_users.find((u) => u.username === who)!.preset_ids, caps: me.caps });
  expect(JSON.stringify(p)).not.toMatch(/password|salt|hash/i);
});

describe('updateName', () => {
  it('trims, saves, bumps the version, and old audit lines keep the old name', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    const v = db.read().t.staff_users.find((u) => u.username === 'bacsi_duc')!.version;
    await api.staff.profile.updateName('  BS. Đức Minh  ');
    expect((await api.staff.profile.get()).name).toBe('BS. Đức Minh');
    expect(db.read().t.staff_users.find((u) => u.username === 'bacsi_duc')!.version).toBe(v + 1);
    expect(db.read().t.audit_events.at(-1)).toMatchObject({ action: 'staff.rename', sensitive: false });
    expect(db.read().t.audit_events.filter((e) => e.actor_id === 'stf-duc').some((e) => e.actor_name_snapshot === 'BS. Trần Minh Đức')).toBe(true);
  });
  it('refuses blank and over-long names and writes nothing', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    const rev = db.read().rev;
    expect(await fieldsOf(api.staff.profile.updateName(' '))).toEqual({ name: STAFF_MSG.name });
    expect(await fieldsOf(api.staff.profile.updateName('x'.repeat(61)))).toEqual({ name: STAFF_MSG.nameLong });
    expect(db.read().rev).toBe(rev);
  });
});

describe('changePassword', () => {
  const good = { current: 'leson-demo', next: 'mat-khau-moi-7', next2: 'mat-khau-moi-7' };
  it('each mistake is reported on its own field and nothing changes', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    const rev = db.read().rev;
    expect(await fieldsOf(api.staff.profile.changePassword({ ...good, current: 'sai-mat-khau' }))).toEqual({ current: STAFF_MSG.currentWrong });
    expect(await fieldsOf(api.staff.profile.changePassword({ ...good, next: 'abc', next2: 'abc' }))).toEqual({ next: MSG.passwordShort });
    expect(await fieldsOf(api.staff.profile.changePassword({ current: 'leson-demo', next: 'leson-demo', next2: 'leson-demo' }))).toEqual({ next: STAFF_MSG.samePassword });
    expect(await fieldsOf(api.staff.profile.changePassword({ ...good, next2: 'khac-hoan-toan' }))).toEqual({ next2: MSG.passwordMismatch });
    expect(db.read().rev).toBe(rev);
  });
  it('success: the session stays, the old password stops working, the new works, audit is sensitive without any password', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    await api.staff.profile.changePassword(good);
    expect(((await api.auth.me()) as { username: string }).username).toBe('spa_ngocanh');
    const audit = db.read().t.audit_events.at(-1)!;
    expect(audit).toMatchObject({ action: 'staff.password_change', sensitive: true });
    expect(JSON.stringify(audit)).not.toMatch(/leson-demo|mat-khau-moi-7/);
    await api.auth.logout();
    await expect(api.auth.login({ identifier: 'spa_ngocanh', password: 'leson-demo' })).rejects.toThrow(AuthError);
    await expect(api.auth.login({ identifier: 'spa_ngocanh', password: 'mat-khau-moi-7' })).resolves.toBeTruthy();
  });
  it('two changes at once: only one lands, the other is told the current password is no longer right', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    const rs = await Promise.allSettled([
      api.staff.profile.changePassword({ current: 'leson-demo', next: 'mat-khau-moi-1', next2: 'mat-khau-moi-1' }),
      api.staff.profile.changePassword({ current: 'leson-demo', next: 'mat-khau-moi-2', next2: 'mat-khau-moi-2' }),
    ]);
    expect(rs.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
    const lost = rs.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect((lost.reason as ValidationError).fields).toEqual({ current: STAFF_MSG.currentWrong });
    await api.auth.logout();
    const winner = rs[0]!.status === 'fulfilled' ? 'mat-khau-moi-1' : 'mat-khau-moi-2';
    await expect(api.auth.login({ identifier: 'spa_ngocanh', password: winner })).resolves.toBeTruthy();
  });
  it('a name change makes the version the manager screen holds stale', async () => {
    const t = makeTestApi();
    const second = createMockApi({ db: t.db, sessionKV: createKV(memoryStorage()), rememberKV: createKV(memoryStorage()), clock: () => new Date(TEST_NOW) });
    await loginAs(t.api, 'quanly_ha');
    const u = t.db.read().t.staff_users.find((x) => x.username === 'spa_ngocanh')!;
    await loginAs(second, 'spa_ngocanh');
    await second.staff.profile.updateName('Ngọc Anh Spa');
    await expect(t.api.staff.team.setActive(u.id, u.version, false)).rejects.toThrow(ConflictError);
  });
});

describe('hospital information', () => {
  it.each(['quanly_ha', 'bacsi_duc', 'spa_ngocanh'])('%s can read it, equal to the fixed constant', async (who) => {
    const { api } = makeTestApi();
    await loginAs(api, who);
    expect(await api.staff.settings.hospital()).toEqual(HOSPITAL_INFO);
  });
});

describe('who may call profile and hospital', () => {
  it('a customer is refused', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'lan_nguyen');
    await expect(api.staff.profile.get()).rejects.toThrow(ForbiddenError);
    await expect(api.staff.profile.updateName('X')).rejects.toThrow(ForbiddenError);
    await expect(api.staff.profile.changePassword({ current: 'a', next: 'b', next2: 'b' })).rejects.toThrow(ForbiddenError);
    await expect(api.staff.settings.hospital()).rejects.toThrow(ForbiddenError);
  });
  it('a signed-out visitor is refused, and a staff member switched off mid-session is too', async () => {
    const t = makeTestApi();
    await expect(t.api.staff.profile.get()).rejects.toThrow(ForbiddenError);
    await loginAs(t.api, 'bacsi_duc');
    t.db.transact('t', (d) => { d.t.staff_users.find((u) => u.username === 'bacsi_duc')!.active = false; });
    await expect(t.api.staff.profile.get()).rejects.toThrow(ForbiddenError);
    await expect(t.api.staff.settings.hospital()).rejects.toThrow(ForbiddenError);
  });
});
