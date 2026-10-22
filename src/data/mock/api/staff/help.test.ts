import { describe, expect, it } from 'vitest';
import { TEST_NOW, loginAs, makeTestApi } from '../../testing';
import { createMockApi } from '..';
import { createKV, memoryStorage } from '../../store/kv';
import { createDb } from '../../store/db';
import { buildSeed } from '../../seed';
import { setLatency } from '../../latency';
import { ForbiddenError, type ValidationError } from '../../../contracts/errors';

const fieldsOf = async (p: Promise<unknown>) => ((await p.catch((e) => e)) as ValidationError).fields;
const ids = (list: { id: string }[]) => list.map((a) => a.id);

describe('articles and search', () => {
  it('each role reads the articles that fit its rights', async () => {
    const t = makeTestApi();
    await loginAs(t.api, 'spa_ngocanh');
    expect(ids(await t.api.staff.help.articles())).toEqual(['tong-quan', 'lich-hen', 'ho-so-khach', 'noi-tru-bang-chuong', 'noi-tru-nhat-ky', 'bang-gia', 'quyen-cua-toi']);
    await loginAs(t.api, 'bacsi_duc');   // has the extra right to handle requests
    const doctor = ids(await t.api.staff.help.articles());
    expect(doctor).toContain('yeu-cau-dat-lich');
    expect(doctor).not.toContain('thu-tien');
    await loginAs(t.api, 'quanly_ha');
    expect(await t.api.staff.help.articles()).toHaveLength(13);
  });
  it('search is filtered the same way and refuses a non-string', async () => {
    const t = makeTestApi();
    await loginAs(t.api, 'spa_ngocanh');
    const found = ids(await t.api.staff.help.search('hoa don'));
    expect(found).not.toContain('hoa-don-lap-phat-hanh');
    expect(found).not.toContain('thu-tien');
    expect(ids(await t.api.staff.help.search('nhat ky'))).toContain('noi-tru-nhat-ky');
    expect(await fieldsOf(t.api.staff.help.search(5 as never))).toEqual({ q: expect.any(String) });
  });
  it('a customer and a signed-out visitor are refused everywhere', async () => {
    const t = makeTestApi();
    const calls = (api: typeof t.api) => [() => api.staff.help.articles(), () => api.staff.help.search('x'), () => api.staff.help.whyNot('requests.handle'), () => api.staff.help.checklist(), () => api.staff.help.markDone('xem-lich')];
    for (const call of calls(t.api)) await expect(call()).rejects.toThrow(ForbiddenError);
    await loginAs(t.api, 'lan_nguyen');
    for (const call of calls(t.api)) await expect(call()).rejects.toThrow(ForbiddenError);
  });
});

describe('whyNot', () => {
  it('answers for the person asking', async () => {
    const t = makeTestApi();
    await loginAs(t.api, 'spa_ngocanh');
    expect(await t.api.staff.help.whyNot('appointments.manage')).toEqual({ allowed: false, missing: ['appointments.manage'], missingLabels: ['Sắp xếp lịch hẹn'], hint: 'Bạn chưa có quyền "Sắp xếp lịch hẹn", nhờ Quản lý cấp.' });
    expect((await t.api.staff.help.whyNot('inpatient.admit')).allowed).toBe(true);
    await loginAs(t.api, 'quanly_ha');
    expect((await t.api.staff.help.whyNot('stock.write')).allowed).toBe(true);
  });
  it('an unknown feature is refused', async () => {
    const t = makeTestApi();
    await loginAs(t.api, 'quanly_ha');
    expect(await fieldsOf(t.api.staff.help.whyNot('khong.co' as never))).toEqual({ feature: expect.any(String) });
    expect(await fieldsOf(t.api.staff.help.whyNot(JSON.parse('"__proto__"')))).toEqual({ feature: expect.any(String) });
  });
});

describe('checklist and markDone', () => {
  it('starts empty, marks an item once, and a repeat writes nothing', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    expect(await api.staff.help.checklist()).toMatchObject({ doneCount: 0, hidden: false });
    const c = await api.staff.help.markDone('xem-lich');
    expect(c).toMatchObject({ doneCount: 1 });
    expect(c.items.find((i) => i.key === 'xem-lich')!.done).toBe(true);
    expect(db.read().t.staff_prefs).toEqual([{ staff_id: 'stf-duc', values: { onboarding_done: ['xem-lich'] } }]);
    const rev = db.read().rev;
    await api.staff.help.markDone('xem-lich');
    expect(db.read().rev).toBe(rev);
  });
  it('an item that is not on the person\'s list is refused and nothing is written', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    const rev = db.read().rev;
    expect(await fieldsOf(api.staff.help.markDone('thu-tien'))).toEqual({ key: expect.any(String) });
    expect(await fieldsOf(api.staff.help.markDone('khong-co'))).toEqual({ key: expect.any(String) });
    expect(await fieldsOf(api.staff.help.markDone(5 as never))).toEqual({ key: expect.any(String) });
    expect(db.read().rev).toBe(rev);
  });
  it('shares the list with the personal options: other options keep it, a full save replaces it, hiding is read from there', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    await api.staff.prefs.save({ text_size: 'lg', nudges: { stock: false } });
    await api.staff.help.markDone('xem-lich');
    expect(await api.staff.prefs.get()).toMatchObject({ text_size: 'lg', nudges: { stock: false }, onboarding_done: ['xem-lich'] });
    await api.staff.prefs.save({ density: 'compact' });
    expect((await api.staff.help.checklist()).doneCount).toBe(1);
    await api.staff.prefs.save({ onboarding_hidden: true });
    expect((await api.staff.help.checklist()).hidden).toBe(true);
    await api.staff.prefs.save({ onboarding_done: [] });
    expect((await api.staff.help.checklist()).doneCount).toBe(0);
  });
  it('two tabs marking different items at once both keep theirs', async () => {
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
    await Promise.all([a.api.staff.help.markDone('xem-lich'), b.api.staff.help.markDone('xem-bang-gia')]);
    a.db.reloadFromStorage();
    const done = (await a.api.staff.help.checklist()).items.filter((i) => i.done).map((i) => i.key).sort();
    expect(done).toEqual(['xem-bang-gia', 'xem-lich']);
  });
  it('losing a right hides the item but keeps what was marked', async () => {
    const t = makeTestApi();
    await loginAs(t.api, 'bacsi_duc');
    await t.api.staff.help.markDone('lap-hoa-don-nhap');
    t.db.transact('t', (d) => { const u = d.t.staff_users.find((x) => x.username === 'bacsi_duc')!; u.preset_ids = ['spa']; u.extra_capabilities = []; });
    const c = await t.api.staff.help.checklist();
    expect(c.items.map((i) => i.key)).not.toContain('lap-hoa-don-nhap');
    expect(c.doneCount).toBe(0);
    expect(t.db.read().t.staff_prefs[0]!.values.onboarding_done).toEqual(['lap-hoa-don-nhap']);
  });
  it('a damaged stored row does not crash the checklist', async () => {
    const t = makeTestApi();
    await loginAs(t.api, 'quanly_ha');
    t.db.transact('t', (d) => { d.t.staff_prefs.push({ staff_id: 'stf-ha', values: { onboarding_done: 5, onboarding_hidden: 'x' } as never }); });
    expect(await t.api.staff.help.checklist()).toMatchObject({ doneCount: 0, hidden: false });
    expect((await t.api.staff.help.markDone('xem-lich')).doneCount).toBe(1);
  });
});
