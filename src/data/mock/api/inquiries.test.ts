import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../testing';
import { ForbiddenError, type ValidationError } from '../../contracts/errors';
import { INQUIRY_DAILY_MAX, INQUIRY_MSG } from '../../rules/inquiry';

const fieldsOf = async (p: Promise<unknown>) => ((await p.catch((e) => e)) as ValidationError).fields;
const input = { name: 'Hoàng Minh', phone: '0987 654 321', text: 'Mình muốn hỏi giá cát vệ sinh.', about: 'Cát vệ sinh cho mèo (mẫu)' };
const rows = (t: ReturnType<typeof makeTestApi>) => t.db.read().t.inquiries;

describe('public.inquiries.submit', () => {
  it('a visitor leaves a message: one new row, the phone in +84 form, the next LN code, and an audit line without the text', async () => {
    const t = makeTestApi();
    expect(await t.api.public.inquiries.submit(input)).toEqual({ ok: true });
    const row = rows(t).at(-1)!;
    expect(row).toMatchObject({ code: 'LN-0004', name: 'Hoàng Minh', phone_e164: '+84987654321', text: input.text, about: input.about, status: 'new', version: 1 });
    expect(row.created_by_account).toBeUndefined();
    const line = t.db.read().t.audit_events.filter((e) => e.action === 'inquiry.submit');
    expect(line).toHaveLength(1);
    expect(line[0]).toMatchObject({ actor_type: 'guest', summary_vi: 'Khách để lại lời nhắn LN-0004' });
    expect(JSON.stringify(line[0])).not.toContain('cát vệ sinh');
  });

  it('works outside opening hours (22:30) and without a product', async () => {
    const t = makeTestApi('2026-10-19T22:30:00+07:00');
    await t.api.public.inquiries.submit({ name: 'A', phone: '0987654321', text: 'Nhờ gọi lại.' });
    expect(rows(t).at(-1)!.about).toBeUndefined();
  });

  it('a signed-in customer can leave one too, and the row remembers the account', async () => {
    const t = makeTestApi();
    await loginAs(t.api, 'lan_nguyen');
    await t.api.public.inquiries.submit(input);
    expect(rows(t).at(-1)!.created_by_account).toBeTruthy();
    expect(t.db.read().t.audit_events.find((e) => e.action === 'inquiry.submit')!.actor_type).toBe('customer');
  });

  it('a staff member is refused and nothing is written', async () => {
    const t = makeTestApi();
    await loginAs(t.api, 'quanly_ha');
    const rev = t.db.read().rev;
    await expect(t.api.public.inquiries.submit(input)).rejects.toThrow(ForbiddenError);
    expect(t.db.read().rev).toBe(rev);
  });

  it('a refused message writes nothing and names each wrong field', async () => {
    const t = makeTestApi();
    const rev = t.db.read().rev;
    expect(await fieldsOf(t.api.public.inquiries.submit({ name: '', phone: '123', text: 'a'.repeat(501), colour: 1 } as never)))
      .toEqual({ name: INQUIRY_MSG.name, phone: INQUIRY_MSG.phone, text: INQUIRY_MSG.text, colour: INQUIRY_MSG.unknown });
    expect(Object.keys(await fieldsOf(t.api.public.inquiries.submit(JSON.parse('{"name":"A","phone":"0987654321","text":"B","__proto__":{}}'))))).toEqual(['__proto__']);
    expect(t.db.read().rev).toBe(rev);
  });

  it('the same message again while the first waits creates nothing, however it is spaced or cased, and still says ok', async () => {
    const t = makeTestApi();
    await t.api.public.inquiries.submit(input);
    const n = rows(t).length;
    expect(await t.api.public.inquiries.submit({ ...input, phone: '+84 987 654 321', text: `  ${input.text.toUpperCase()}  ` })).toEqual({ ok: true });
    expect(rows(t)).toHaveLength(n);
  });

  it('once it has been called back, the same message is a new one', async () => {
    const t = makeTestApi();
    await t.api.public.inquiries.submit(input);
    t.db.transact('test', (d) => { d.t.inquiries.at(-1)!.status = 'called'; });
    const n = rows(t).length;
    await t.api.public.inquiries.submit(input);
    expect(rows(t)).toHaveLength(n + 1);
  });

  it('a different text from the same number is a new message', async () => {
    const t = makeTestApi();
    await t.api.public.inquiries.submit(input);
    const n = rows(t).length;
    await t.api.public.inquiries.submit({ ...input, text: 'Câu hỏi khác.' });
    expect(rows(t)).toHaveLength(n + 1);
  });

  it(`a number can leave ${INQUIRY_DAILY_MAX} messages a day; the next is refused with the hotline, other numbers and the next day are fine`, async () => {
    const t = makeTestApi('2026-10-19T09:00:00+07:00');
    for (let i = 0; i < INQUIRY_DAILY_MAX; i++) await t.api.public.inquiries.submit({ ...input, text: `Câu hỏi số ${i}` });
    const n = rows(t).length;
    const rev = t.db.read().rev;
    expect(await fieldsOf(t.api.public.inquiries.submit({ ...input, text: 'Câu hỏi thêm' }))).toEqual({ text: INQUIRY_MSG.daily });
    expect(INQUIRY_MSG.daily).toContain('097 355 51 05');
    expect(t.db.read().rev).toBe(rev);
    await t.api.public.inquiries.submit({ ...input, phone: '0987654322', text: 'Câu hỏi thêm' });
    t.setNow('2026-10-20T00:05:00+07:00');
    await t.api.public.inquiries.submit({ ...input, text: 'Câu hỏi thêm' });
    expect(rows(t)).toHaveLength(n + 2);
  });

  it('a repeat of a waiting message does not use up the daily allowance and is never refused for it', async () => {
    const t = makeTestApi();
    for (let i = 0; i < INQUIRY_DAILY_MAX; i++) await t.api.public.inquiries.submit({ ...input, text: `Câu hỏi số ${i}` });
    expect(await t.api.public.inquiries.submit({ ...input, text: 'Câu hỏi số 0' })).toEqual({ ok: true });
  });

  it('the day is counted in Vietnam time (23:50 and 00:10 are different days)', async () => {
    const t = makeTestApi('2026-10-19T23:50:00+07:00');
    for (let i = 0; i < INQUIRY_DAILY_MAX; i++) await t.api.public.inquiries.submit({ ...input, text: `Câu ${i}` });
    t.setNow('2026-10-20T00:10:00+07:00');
    await t.api.public.inquiries.submit({ ...input, text: 'Câu mới' });
    expect(rows(t).filter((r) => r.phone_e164 === '+84987654321')).toHaveLength(INQUIRY_DAILY_MAX + 1);
  });
});

describe('a damaged stored message', () => {
  it('does not stop a visitor from leaving a new one', async () => {
    const t = makeTestApi();
    t.db.transact('damage', (d) => { Object.assign(d.t.inquiries[0]!, { created_at: undefined, text: 5, phone_e164: '+84987654321' }); });
    expect(await t.api.public.inquiries.submit(input)).toEqual({ ok: true });
  });
});
