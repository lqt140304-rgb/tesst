import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { ConflictError, ForbiddenError, NotFoundError, type ValidationError } from '../../../contracts/errors';

const fieldsOf = async (p: Promise<unknown>) => ((await p.catch((e) => e)) as ValidationError).fields;
async function as(username: string) {
  const t = makeTestApi();
  await loginAs(t.api, username);
  return t;
}
const idOf = (t: ReturnType<typeof makeTestApi>, code: string) => t.db.read().t.inquiries.find((q) => q.code === code)!.id;

describe('who may use staff.inquiries', () => {
  it('the manager and the doctor (requests.handle) may; the spa, a customer and a visitor may not', async () => {
    for (const u of ['quanly_ha', 'bacsi_duc']) expect((await (await as(u)).api.staff.inquiries.list()).length).toBe(3);
    const spa = await as('spa_ngocanh');
    await expect(spa.api.staff.inquiries.list()).rejects.toThrow(ForbiddenError);
    await expect(spa.api.staff.inquiries.markCalled('x', 1)).rejects.toThrow(ForbiddenError);
    const g = makeTestApi();
    await expect(g.api.staff.inquiries.list()).rejects.toThrow(ForbiddenError);
    await loginAs(g.api, 'lan_nguyen');
    await expect(g.api.staff.inquiries.list()).rejects.toThrow(ForbiddenError);
  });
});

describe('list', () => {
  it('waiting messages first (newest first), then called back; the phone is the stored E.164 number', async () => {
    const { api } = await as('quanly_ha');
    const rows = await api.staff.inquiries.list();
    expect(rows.map((r) => r.code)).toEqual(['LN-0001', 'LN-0002', 'LN-0003']);
    expect(rows[0]).toMatchObject({ status: 'new', phone: '+84901234501', about: 'Thức ăn hạt cho chó trưởng thành (mẫu)', overdue: false, version: 1 });
    expect(rows[2]).toMatchObject({ status: 'called', handledByName: 'Nguyễn Thu Hà' });
    expect(rows[2]!.overdue).toBe(false);
  });
  it('filters by status and refuses an unknown filter', async () => {
    const { api } = await as('quanly_ha');
    expect((await api.staff.inquiries.list({ status: 'new' })).map((r) => r.code)).toEqual(['LN-0001', 'LN-0002']);
    expect((await api.staff.inquiries.list({ status: 'called' })).map((r) => r.code)).toEqual(['LN-0003']);
    expect(Object.keys(await fieldsOf(api.staff.inquiries.list({ status: 'x' } as never)))).toEqual(['status']);
  });
  it('a waiting message is overdue after the setting hours (24 by default) and not before', async () => {
    const t = await as('quanly_ha');
    const rows = await t.api.staff.inquiries.list({ status: 'new' });
    expect(rows.find((r) => r.code === 'LN-0001')!.overdue).toBe(false);   // 3 h
    expect(rows.find((r) => r.code === 'LN-0002')!.overdue).toBe(true);    // 30 h
    await t.api.staff.settings.update(1, { request_overdue_hours: 48 });
    expect((await t.api.staff.inquiries.list({ status: 'new' })).find((r) => r.code === 'LN-0002')!.overdue).toBe(false);
  });
  it('a damaged stored message reads as a plain default instead of crashing', async () => {
    const t = await as('quanly_ha');
    t.db.transact('damage', (d) => { Object.assign(d.t.inquiries[0]!, { status: 'weird', name: undefined, text: 5, version: 'x', created_at: undefined }); });
    const row = (await t.api.staff.inquiries.list()).find((r) => r.code === 'LN-0001')!;
    expect(row).toMatchObject({ status: 'new', name: '', text: '', version: 1, overdue: false });
  });
});

describe('markCalled', () => {
  it('sets Đã gọi lại with the caller and the time, bumps the version, and audits without the text', async () => {
    const t = await as('bacsi_duc');
    await t.api.staff.inquiries.markCalled(idOf(t, 'LN-0001'), 1);
    const row = (await t.api.staff.inquiries.list()).find((r) => r.code === 'LN-0001')!;
    expect(row).toMatchObject({ status: 'called', handledByName: 'BS. Trần Minh Đức', version: 2 });
    expect(Date.parse(row.handledAt!)).not.toBeNaN();
    const line = t.db.read().t.audit_events.find((e) => e.action === 'inquiry.called')!;
    expect(line.summary_vi).toBe('BS. Trần Minh Đức đánh dấu đã gọi lại lời nhắn LN-0001');
    expect(JSON.stringify(line)).not.toContain('còn hàng');
  });
  it('an old or odd version is refused and nothing is written', async () => {
    const t = await as('quanly_ha');
    const id = idOf(t, 'LN-0001');
    const rev = t.db.read().rev;
    for (const v of [2, 1.5, '1', undefined, Number.NaN]) await expect(t.api.staff.inquiries.markCalled(id, v as never)).rejects.toThrow(ConflictError);
    await expect(t.api.staff.inquiries.markCalled('nope', 1)).rejects.toThrow(NotFoundError);
    expect(t.db.read().rev).toBe(rev);
  });
  it('a message already called back cannot be called back twice', async () => {
    const t = await as('quanly_ha');
    const id = idOf(t, 'LN-0003');
    expect(Object.keys(await fieldsOf(t.api.staff.inquiries.markCalled(id, 1)))).toEqual(['status']);
  });
  it('two people pressing at once on the same version: one wins, one gets a conflict', async () => {
    const t = await as('quanly_ha');
    const id = idOf(t, 'LN-0002');
    const results = await Promise.allSettled([t.api.staff.inquiries.markCalled(id, 1), t.api.staff.inquiries.markCalled(id, 1)]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
  });
});

describe('what visitors and customers can see', () => {
  it('no output of theirs carries anyone\'s message', async () => {
    const t = makeTestApi();
    const keys = JSON.stringify([await t.api.public.featured.products(), await t.api.public.featured.cases(), await t.api.public.bookings.holidays()]);
    for (const w of ['phone_e164', 'handled_by_name', 'inquir', 'LN-0']) expect(keys).not.toContain(w);
    const reply = await t.api.public.inquiries.submit({ name: 'A', phone: '0987654321', text: 'B' });
    expect(reply).toEqual({ ok: true });
  });
});
