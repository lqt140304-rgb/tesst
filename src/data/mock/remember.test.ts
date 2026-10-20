import { describe, expect, it } from 'vitest';
import { makeTestApi } from './testing';
import { createMockApi } from './api';
import { createKV, memoryStorage } from './store/kv';
import { REMEMBER_KEY, SESSION_KEY } from './env';

/** Part 2 §4.2: "Ghi nhớ đăng nhập" keeps a customer signed in for 30 days in every tab of this browser. */
describe('remember me', () => {
  const login = (api: ReturnType<typeof makeTestApi>['api'], identifier: string, remember?: boolean) =>
    api.auth.login({ identifier, password: 'leson-demo', remember });
  /** Another tab of the same browser: same localStorage and data, its own sessionStorage. */
  const newTab = (t: ReturnType<typeof makeTestApi>) => createMockApi({ db: t.db, sessionKV: createKV(memoryStorage()), rememberKV: t.rememberKV, clock: t.db.clock });

  it('a remembered customer stays signed in in a new tab', async () => {
    const t = makeTestApi();
    await login(t.api, 'lan_nguyen', true);
    expect(t.sessionKV.get(SESSION_KEY)).toBeNull();
    expect(JSON.parse(t.rememberKV.get(REMEMBER_KEY)!)).toMatchObject({ session: { kind: 'customer', accountId: 'acc-lan_nguyen' }, expires_at: '2026-11-18T09:00:00+07:00' });
    expect(newTab(t).auth.current()).toEqual({ kind: 'customer', accountId: 'acc-lan_nguyen' });
  });

  it('without the tick the session stays in this tab only', async () => {
    const t = makeTestApi();
    await login(t.api, 'lan_nguyen');
    expect(t.api.auth.current()).toEqual({ kind: 'customer', accountId: 'acc-lan_nguyen' });
    expect(t.rememberKV.get(REMEMBER_KEY)).toBeNull();
    expect(newTab(t).auth.current()).toBeNull();
  });

  it('staff are never remembered', async () => {
    const t = makeTestApi();
    await login(t.api, 'bacsi_mai', true);
    expect(t.rememberKV.get(REMEMBER_KEY)).toBeNull();
    expect(t.api.auth.current()).toEqual({ kind: 'staff', staffId: 'stf-mai' });
  });

  it('after 30 days the customer is signed out', async () => {
    const t = makeTestApi();
    await login(t.api, 'lan_nguyen', true);
    t.setNow('2026-11-18T08:59:00+07:00');
    expect(t.api.auth.current()).not.toBeNull();
    t.setNow('2026-11-18T09:00:00+07:00');
    expect(t.api.auth.current()).toBeNull();
    expect(t.rememberKV.get(REMEMBER_KEY)).toBeNull();
  });

  it('a later login without the tick forgets the remembered one', async () => {
    const t = makeTestApi();
    await login(t.api, 'lan_nguyen', true);
    await login(t.api, 'thuy_pham');
    expect(t.rememberKV.get(REMEMBER_KEY)).toBeNull();
    expect(t.api.auth.current()).toEqual({ kind: 'customer', accountId: 'acc-thuy_pham' });
  });

  it('logout and "Khôi phục dữ liệu mẫu" clear both places', async () => {
    const t = makeTestApi();
    await login(t.api, 'lan_nguyen', true);
    await t.api.auth.logout();
    expect([t.sessionKV.get(SESSION_KEY), t.rememberKV.get(REMEMBER_KEY)]).toEqual([null, null]);
    await login(t.api, 'lan_nguyen', true);
    await t.api.system.resetDemo();
    expect([t.sessionKV.get(SESSION_KEY), t.rememberKV.get(REMEMBER_KEY)]).toEqual([null, null]);
  });
});
