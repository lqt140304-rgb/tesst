import { describe, expect, it } from 'vitest';
import { TEST_NOW, loginAs, makeTestApi } from '../../testing';
import { createMockApi } from '..';
import { createKV, memoryStorage } from '../../store/kv';
import { createDb } from '../../store/db';
import { buildSeed } from '../../seed';
import { setLatency } from '../../latency';
import { ConflictError, ForbiddenError, NotFoundError, type ValidationError } from '../../../contracts/errors';
import { SUPPORT_MSG } from '../../../rules/support';

const fieldsOf = async (p: Promise<unknown>) => ((await p.catch((e) => e)) as ValidationError).fields;
const input = { kind: 'bug', title: 'Nút lưu không bấm được', body: 'Mình bấm Lưu nháp nhưng không thấy gì.', screen: 'Hóa đơn' } as const;
const code = (db: ReturnType<typeof makeTestApi>['db'], c: string) => db.read().t.support_tickets.find((t) => t.code === c)!;

describe('submit', () => {
  it('each staff role can send; the ticket is new, version 1, in the sender\'s name, trimmed, and audited without its text', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    const c = await api.staff.support.submit({ ...input, title: `  ${input.title}  ` });
    expect(c).toBe('HT-0005');
    expect(code(db, c)).toMatchObject({ kind: 'bug', title: input.title, body: input.body, screen: 'Hóa đơn', status: 'new', version: 1, created_by: 'stf-ngocanh', created_by_name: 'Lê Ngọc Anh' });
    const lines = db.read().t.audit_events.filter((e) => e.action === 'support.submit');
    expect(lines).toHaveLength(1);
    expect(lines[0]!.summary_vi).toBe('Lê Ngọc Anh gửi phiếu HT-0005 (Báo lỗi)');
    expect(JSON.stringify(lines[0])).not.toContain(input.body);
    await loginAs(api, 'bacsi_mai');
    expect(await api.staff.support.submit({ kind: 'idea', title: 'A', body: 'B' })).toBe('HT-0006');
  });
  it('a customer and a signed-out visitor are refused', async () => {
    const t = makeTestApi();
    await expect(t.api.staff.support.submit(input)).rejects.toThrow(ForbiddenError);
    await loginAs(t.api, 'lan_nguyen');
    await expect(t.api.staff.support.submit(input)).rejects.toThrow(ForbiddenError);
    await expect(t.api.staff.support.mine()).rejects.toThrow(ForbiddenError);
  });
  it('a refused ticket writes nothing, with each wrong field named', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const rev = db.read().rev;
    expect(await fieldsOf(api.staff.support.submit({ kind: 'x', title: '', body: 'a'.repeat(1001), colour: 1 } as never)))
      .toEqual({ kind: SUPPORT_MSG.kind, title: SUPPORT_MSG.title, body: SUPPORT_MSG.body, colour: SUPPORT_MSG.unknown });
    expect(Object.keys(await fieldsOf(api.staff.support.submit(JSON.parse('{"kind":"bug","title":"a","body":"b","__proto__":{}}'))))).toEqual(['__proto__']);
    expect(await fieldsOf(api.staff.support.submit('x' as never))).toEqual({ support: SUPPORT_MSG.shape });
    expect(db.read().rev).toBe(rev);
  });
  it('the same ticket again while the first waits is refused, and allowed once it has been answered', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    const c = await api.staff.support.submit(input);
    const rev = db.read().rev;
    expect(await fieldsOf(api.staff.support.submit(input))).toEqual({ body: SUPPORT_MSG.duplicate });
    expect(db.read().rev).toBe(rev);
    await loginAs(api, 'quanly_ha');
    await api.staff.support.reply(code(db, c).id, 1, 'Đã sửa.');
    await loginAs(api, 'bacsi_duc');
    expect(await api.staff.support.submit(input)).toBe('HT-0006');
  });
});

describe('submit reads the input once', () => {
  it('a value that changes between the check and the save is never stored', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    let reads = 0;
    const sneaky = { kind: 'bug', body: 'B', screen: 'S', get title() { reads += 1; return reads === 1 ? 'ok' : 'x'.repeat(5000); } };
    const c = await api.staff.support.submit(sneaky as never);
    expect(code(db, c).title).toBe('ok');
    let kinds = 0;
    const kind = { title: 'T', body: 'B', get kind() { kinds += 1; return kinds === 1 ? 'bug' : 'evil'; } };
    expect(code(db, await api.staff.support.submit(kind as never)).kind).toBe('bug');
  });
  it('properties inherited from a prototype do not count', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const rev = db.read().rev;
    const inherited = Object.create({ kind: 'bug', title: 'T', body: 'B' });
    expect(await fieldsOf(api.staff.support.submit(inherited))).toMatchObject({ kind: SUPPORT_MSG.kind, title: SUPPORT_MSG.title, body: SUPPORT_MSG.body });
    expect(db.read().rev).toBe(rev);
  });
  it('the duplicate rule is per person: someone else may send the same words', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    await api.staff.support.submit(input);
    await loginAs(api, 'spa_ngocanh');
    expect(await api.staff.support.submit(input)).toBe('HT-0006');
  });
});

describe('mine', () => {
  it('holds only the sender\'s own tickets, newest first, and nothing of anyone else', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    const mine = await api.staff.support.mine();
    expect(mine.map((t) => t.code)).toEqual(['HT-0003', 'HT-0001']);
    expect(mine.map((t) => t.status)).toEqual(['new', 'answered']);
    expect(mine[1]).toMatchObject({ replyText: expect.any(String), repliedByName: 'Nguyễn Thu Hà', repliedAt: expect.any(String) });
    await loginAs(api, 'spa_ngocanh');
    await api.staff.support.submit(input);
    expect((await api.staff.support.mine()).map((t) => t.code)).toEqual(['HT-0005', 'HT-0004']);
    await loginAs(api, 'bacsi_duc');
    expect((await api.staff.support.mine()).map((t) => t.code)).toEqual(['HT-0003', 'HT-0001']);
  });
});

describe('inbox', () => {
  it('only support.inbox: the manager sees everything in order New, Seen, Answered (oldest first inside each); others are refused even for their own', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    expect((await api.staff.support.inbox()).map((t) => t.code)).toEqual(['HT-0003', 'HT-0004', 'HT-0002', 'HT-0001']);
    expect((await api.staff.support.inbox({ status: 'new' })).map((t) => t.code)).toEqual(['HT-0003', 'HT-0004']);
    for (const who of ['bacsi_duc', 'spa_ngocanh']) {
      await loginAs(api, who);
      await expect(api.staff.support.inbox()).rejects.toThrow(ForbiddenError);
      await expect(api.staff.support.setStatus(code(db, 'HT-0003').id, 1, 'seen')).rejects.toThrow(ForbiddenError);
      await expect(api.staff.support.reply(code(db, 'HT-0003').id, 1, 'x')).rejects.toThrow(ForbiddenError);
    }
    db.transact('t', (d) => { d.t.staff_users.find((u) => u.username === 'bacsi_duc')!.extra_capabilities = ['support.inbox']; });
    await loginAs(api, 'bacsi_duc');
    expect(await api.staff.support.inbox()).toHaveLength(4);
  });
  it('a filter that is not a status is refused', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    expect(await fieldsOf(api.staff.support.inbox({ status: 'x' as never }))).toEqual({ status: expect.any(String) });
  });
});

describe('setStatus', () => {
  async function manager() {
    const t = makeTestApi();
    await loginAs(t.api, 'quanly_ha');
    return t;
  }
  it('moves new to seen and back, one version each time', async () => {
    const { api, db } = await manager();
    const id = code(db, 'HT-0003').id;
    await api.staff.support.setStatus(id, 1, 'seen');
    expect(code(db, 'HT-0003')).toMatchObject({ status: 'seen', version: 2 });
    await api.staff.support.setStatus(id, 2, 'new');
    expect(code(db, 'HT-0003')).toMatchObject({ status: 'new', version: 3 });
  });
  it('answered cannot be set by hand, and an answered ticket cannot be moved', async () => {
    const { api, db } = await manager();
    const rev = db.read().rev;
    expect(await fieldsOf(api.staff.support.setStatus(code(db, 'HT-0003').id, 1, 'answered' as never))).toEqual({ status: SUPPORT_MSG.status });
    expect(await fieldsOf(api.staff.support.setStatus(code(db, 'HT-0001').id, 1, 'seen'))).toEqual({ status: SUPPORT_MSG.answered });
    expect(db.read().rev).toBe(rev);
  });
  it('an unknown id, an old version and a version that is not a whole number', async () => {
    const { api, db } = await manager();
    const id = code(db, 'HT-0003').id;
    await expect(api.staff.support.setStatus('nope', 1, 'seen')).rejects.toThrow(NotFoundError);
    await api.staff.support.setStatus(id, 1, 'seen');
    const rev = db.read().rev;
    await expect(api.staff.support.setStatus(id, 1, 'new')).rejects.toThrow(ConflictError);
    for (const v of [undefined, 1.5, '2', NaN]) await expect(api.staff.support.setStatus(id, v as never, 'new')).rejects.toThrow(ConflictError);
    expect(db.read().rev).toBe(rev);
  });
});

describe('reply', () => {
  async function manager() {
    const t = makeTestApi();
    await loginAs(t.api, 'quanly_ha');
    return t;
  }
  it('answers the ticket, names who answered, and the audit line has no text', async () => {
    const { api, db } = await manager();
    await api.staff.support.reply(code(db, 'HT-0003').id, 1, '  Cảm ơn bạn, đã ghi nhận.  ');
    expect(code(db, 'HT-0003')).toMatchObject({ status: 'answered', reply_text: 'Cảm ơn bạn, đã ghi nhận.', replied_by_name: 'Nguyễn Thu Hà', replied_at: expect.any(String), version: 2 });
    const line = db.read().t.audit_events.filter((e) => e.action === 'support.reply').at(-1)!;
    expect(line.summary_vi).toBe('Nguyễn Thu Hà trả lời phiếu HT-0003');
    expect(JSON.stringify(line)).not.toContain('ghi nhận');
    await loginAs(api, 'bacsi_duc');
    expect((await api.staff.support.mine())[0]).toMatchObject({ code: 'HT-0003', status: 'answered', replyText: 'Cảm ơn bạn, đã ghi nhận.' });
  });
  it('an empty or too long reply, an unknown id and an old version are refused without writing', async () => {
    const { api, db } = await manager();
    const id = code(db, 'HT-0003').id;
    const rev = db.read().rev;
    for (const text of ['', '   ', 'a'.repeat(501), 5]) expect(await fieldsOf(api.staff.support.reply(id, 1, text as never))).toEqual({ reply: SUPPORT_MSG.reply });
    await expect(api.staff.support.reply('nope', 1, 'x')).rejects.toThrow(NotFoundError);
    await expect(api.staff.support.reply(id, 7, 'x')).rejects.toThrow(ConflictError);
    await expect(api.staff.support.reply(id, undefined as never, 'x')).rejects.toThrow(ConflictError);
    expect(db.read().rev).toBe(rev);
  });
  it('an answered ticket can be answered again with the new version, replacing the text', async () => {
    const { api, db } = await manager();
    const id = code(db, 'HT-0001').id;
    await api.staff.support.reply(id, 1, 'Bản trả lời mới.');
    expect(code(db, 'HT-0001')).toMatchObject({ reply_text: 'Bản trả lời mới.', version: 2 });
  });
  it('two people answering the same version: one wins, the other is told it is out of date', async () => {
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
    const id = code(a.db, 'HT-0003').id;
    const results = await Promise.allSettled([a.api.staff.support.reply(id, 1, 'Một'), b.api.staff.support.reply(id, 1, 'Hai')]);
    expect(results.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect((results.find((r) => r.status === 'rejected') as PromiseRejectedResult).reason).toBeInstanceOf(ConflictError);
  });
});

describe('a damaged stored ticket', () => {
  it('does not crash mine or inbox', async () => {
    const t = makeTestApi();
    t.db.transact('t', (d) => { d.t.support_tickets.push({ id: 'bad', code: 'HT-0099', kind: 'x', status: 'y', created_by: 'stf-duc', version: 1 } as never); });
    await loginAs(t.api, 'bacsi_duc');
    expect((await t.api.staff.support.mine()).find((r) => r.code === 'HT-0099')).toMatchObject({ kind: 'howto', status: 'new', title: '', body: '' });
    await loginAs(t.api, 'quanly_ha');
    expect(await t.api.staff.support.inbox()).toHaveLength(5);
  });
});
