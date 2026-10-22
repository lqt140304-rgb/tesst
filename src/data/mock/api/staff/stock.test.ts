import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../../contracts/errors';
import { STOCK_MSG } from '../../../rules/stock';
import type { StockRow } from '../../../contracts/staff';
import { summarizeStock } from './stock';

type Db = ReturnType<typeof makeTestApi>['db'];
const fieldsOf = async (p: Promise<unknown>) => ((await p.catch((e) => e)) as ValidationError).fields;
const byCode = (db: Db, code: string) => db.read().t.stock_items.find((i) => i.code === code)!;
const item = (db: Db, id: string) => db.read().t.stock_items.find((i) => i.id === id)!;
const moves = (db: Db, id: string) => db.read().t.stock_moves.filter((m) => m.item_id === id);

async function setup(as = 'quanly_ha') {
  const t = makeTestApi();
  await loginAs(t.api, as);
  return t;
}

describe('stock reads', () => {
  it('summary counts active items only', async () => {
    const { api } = await setup();
    expect(await api.staff.stock.summary()).toEqual({ total: 13, low: 3, out: 1, expiringSoon: 1, expired: 1 });
  });

  it('list puts out of stock first, then low, then expired, then expiring, then the rest by name', async () => {
    const { api } = await setup();
    const rows = await api.staff.stock.list();
    expect(rows).toHaveLength(13);
    expect(rows.slice(0, 6).map((r) => r.code)).toEqual(['KHO-0005', 'KHO-0012', 'KHO-0009', 'KHO-0002', 'KHO-0004', 'KHO-0003']);
    const rest = rows.slice(6).map((r) => r.name);
    expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b, 'vi')));
    expect(rows[0]).toMatchObject({ level: 'out', qty: 0, minQty: 5, active: true });
  });

  it('filters by status, kind and inactive flag', async () => {
    const { api } = await setup();
    const codes = async (f: Parameters<typeof api.staff.stock.list>[0]) => (await api.staff.stock.list(f)).map((r) => r.code).sort();
    expect(await codes({ status: 'low' })).toEqual(['KHO-0002', 'KHO-0009', 'KHO-0012']);
    expect(await codes({ status: 'out' })).toEqual(['KHO-0005']);
    expect(await codes({ status: 'expiring' })).toEqual(['KHO-0003', 'KHO-0004']);
    expect(await codes({ kind: 'vat_tu' })).toHaveLength(7);
    expect(await codes({ includeInactive: true })).toContain('KHO-0007');
    expect(await codes({})).not.toContain('KHO-0007');
  });

  it('search ignores accents, case and spaces around; matches name or code', async () => {
    const { api } = await setup();
    expect((await api.staff.stock.list({ q: ' NUOC muoi ' })).map((r) => r.code)).toEqual(['KHO-0001']);
    expect((await api.staff.stock.list({ q: 'BƠM' })).map((r) => r.code).sort()).toEqual(['KHO-0008', 'KHO-0009']);
    expect((await api.staff.stock.list({ q: 'kho-0010' })).map((r) => r.name)).toEqual(['Găng tay y tế']);
    expect(await api.staff.stock.list({ q: 'không có món này' })).toEqual([]);
  });

  it('get returns the item and its history newest first; unknown id is not found', async () => {
    const { api, db } = await setup();
    const id = db.read().t.stock_items.find((i) => i.code === 'KHO-0011')!.id;
    const d = await api.staff.stock.get(id);
    expect(d.item).toMatchObject({ code: 'KHO-0011', qty: 42, expiry: 'none', level: 'ok' });
    expect(d.moves).toHaveLength(4);
    expect(d.moves[0]).toMatchObject({ kind: 'adjust', delta: -3, qtyAfter: 42, reason: 'kiem_ke', byName: 'Nguyễn Thu Hà' });
    expect(d.moves.map((m) => m.at)).toEqual([...d.moves.map((m) => m.at)].sort().reverse());
    await expect(api.staff.stock.get('nope')).rejects.toThrow(NotFoundError);
  });
});

describe('create and update', () => {
  const input = { name: 'Chỉ khâu', kind: 'vat_tu', unit: 'cuộn', qty: 12, min_qty: 4 } as const;
  it('creates with the next code, one opening movement and an audit line', async () => {
    const { api, db } = await setup();
    const id = await api.staff.stock.create(input);
    expect(item(db, id)).toMatchObject({ code: 'KHO-0015', qty: 12, min_qty: 4, active: true, version: 1, created_by: 'stf-ha' });
    expect(moves(db, id)).toMatchObject([{ kind: 'in', delta: 12, qty_after: 12, reason: 'nhap_hang', note: 'Tồn ban đầu' }]);
    expect(db.read().t.audit_events.at(-1)!.action).toBe('stock.create');
    const zero = await api.staff.stock.create({ ...input, name: 'Chỉ khâu 2', qty: 0 });
    expect(moves(db, zero)).toEqual([]);
  });
  it('a refused create changes nothing, not even the code counter', async () => {
    const { api, db } = await setup();
    const before = [db.read().t.stock_items.length, db.read().counters.KHO];
    await expect(api.staff.stock.create({ ...input, name: 'nuoc muoi sinh ly 0,9 %', kind: 'thuoc', unit: 'chai' })).rejects.toThrow(STOCK_MSG.duplicate);
    expect(await fieldsOf(api.staff.stock.create({ ...input, name: ' ', qty: -1 }))).toEqual({ name: STOCK_MSG.name, qty: STOCK_MSG.qty });
    expect([db.read().t.stock_items.length, db.read().counters.KHO]).toEqual(before);
  });
  it('the same name in the other kind is allowed', async () => {
    const { api } = await setup();
    await expect(api.staff.stock.create({ ...input, name: 'Gạc vô trùng', kind: 'thuoc' })).resolves.toBeTruthy();
  });
  it('update replaces name, unit, threshold and expiry, keeps the stock, bumps the version', async () => {
    const { api, db } = await setup();
    const i = byCode(db, 'KHO-0006');
    await api.staff.stock.update(i.id, i.version, { name: 'Thuốc bôi da 15 g (mẫu)', kind: 'thuoc', unit: 'tuýp', min_qty: 2 });
    expect(item(db, i.id)).toMatchObject({ name: 'Thuốc bôi da 15 g (mẫu)', min_qty: 2, qty: 8, expires_on: undefined, version: i.version + 1 });
  });
  it('update refuses a new kind or a stock figure, and a stale version', async () => {
    const { api, db } = await setup();
    const i = byCode(db, 'KHO-0006');
    const base = { name: i.name, kind: i.kind, unit: i.unit, min_qty: i.min_qty } as const;
    expect(await fieldsOf(api.staff.stock.update(i.id, i.version, { ...base, kind: 'vat_tu' }))).toEqual({ kind: STOCK_MSG.kindLocked });
    expect(await fieldsOf(api.staff.stock.update(i.id, i.version, { ...base, qty: 99 }))).toEqual({ qty: STOCK_MSG.qtyLocked });
    await api.staff.stock.update(i.id, i.version, base);
    await expect(api.staff.stock.update(i.id, i.version, base)).rejects.toThrow(ConflictError);
  });
  it('can switch an item off and on again', async () => {
    const { api, db } = await setup();
    const i = byCode(db, 'KHO-0006');
    await api.staff.stock.update(i.id, i.version, { name: i.name, kind: i.kind, unit: i.unit, min_qty: i.min_qty, active: false });
    expect((await api.staff.stock.list()).some((r) => r.code === 'KHO-0006')).toBe(false);
    const off = byCode(db, 'KHO-0006');
    await api.staff.stock.update(off.id, off.version, { name: off.name, kind: off.kind, unit: off.unit, min_qty: off.min_qty, active: true });
    expect((await api.staff.stock.list()).some((r) => r.code === 'KHO-0006')).toBe(true);
  });
});

describe('receive', () => {
  it('adds stock, records supplier and note, bumps the version', async () => {
    const { api, db } = await setup();
    const i = byCode(db, 'KHO-0002');
    await api.staff.stock.receive(i.id, i.version, { qty: 10, supplier: 'Nhà cung cấp mẫu', note: 'Đợt 2' });
    expect(item(db, i.id)).toMatchObject({ qty: 15, version: i.version + 1 });
    expect(moves(db, i.id).at(-1)).toMatchObject({ kind: 'in', delta: 10, qty_after: 15, reason: 'nhap_hang', supplier: 'Nhà cung cấp mẫu', note: 'Đợt 2' });
    expect((await api.staff.stock.get(i.id)).item.level).toBe('ok');
  });
  it('keeps the earlier expiry, replaces a past one', async () => {
    const { api, db } = await setup();
    const soon = byCode(db, 'KHO-0003');
    const past = byCode(db, 'KHO-0004');
    await api.staff.stock.receive(soon.id, soon.version, { qty: 5, expires_on: '2027-08-01' });
    await api.staff.stock.receive(past.id, past.version, { qty: 5, expires_on: '2027-08-01' });
    expect(item(db, soon.id).expires_on).toBe(soon.expires_on);
    expect(item(db, past.id).expires_on).toBe('2027-08-01');
  });
  it('refuses garbage and an inactive item and writes nothing', async () => {
    const { api, db } = await setup();
    const i = byCode(db, 'KHO-0002');
    const off = byCode(db, 'KHO-0007');
    const n = db.read().t.stock_moves.length;
    for (const qty of [0, -1, 1.5, NaN, Infinity, 1_000_001]) expect((await fieldsOf(api.staff.stock.receive(i.id, i.version, { qty }))).qty, String(qty)).toBe(STOCK_MSG.moveQty);
    expect(await fieldsOf(api.staff.stock.receive(off.id, off.version, { qty: 1 }))).toEqual({ item: STOCK_MSG.inactive });
    expect(db.read().t.stock_moves).toHaveLength(n);
  });
});

describe('issue', () => {
  it('takes stock out with a reason; to exactly zero is allowed and reads as out', async () => {
    const { api, db } = await setup();
    const i = byCode(db, 'KHO-0004');
    await api.staff.stock.issue(i.id, i.version, { qty: 5, reason: 'het_han', note: 'Hủy lô hết hạn' });
    expect(moves(db, i.id).at(-1)).toMatchObject({ kind: 'out', delta: -5, qty_after: 0, reason: 'het_han' });
    expect((await api.staff.stock.get(i.id)).item.level).toBe('out');
  });
  it('refuses more than is on hand, naming what is left, and a reason that is not an issue reason', async () => {
    const { api, db } = await setup();
    const i = byCode(db, 'KHO-0004');
    expect(await fieldsOf(api.staff.stock.issue(i.id, i.version, { qty: 6, reason: 'hu_hong' }))).toEqual({ qty: 'Kho chỉ còn 5 chai.' });
    expect(await fieldsOf(api.staff.stock.issue(i.id, i.version, { qty: 1, reason: 'kiem_ke' as never }))).toEqual({ reason: STOCK_MSG.issueReason });
    expect(item(db, i.id).qty).toBe(5);
  });
  it('two issues on the same version: the second is told its screen is old', async () => {
    const { api, db } = await setup();
    const i = byCode(db, 'KHO-0001');
    const rs = await Promise.allSettled([api.staff.stock.issue(i.id, i.version, { qty: 1, reason: 'khac' }), api.staff.stock.issue(i.id, i.version, { qty: 1, reason: 'khac' })]);
    expect(rs.map((r) => (r.status === 'fulfilled' ? 'ok' : (r.reason as Error).name)).sort()).toEqual(['ConflictError', 'ok']);
    expect(item(db, i.id).qty).toBe(24);
  });
  it('two issues one after the other can never take the stock below zero', async () => {
    const { api, db } = await setup();
    const i = byCode(db, 'KHO-0004');
    await api.staff.stock.issue(i.id, i.version, { qty: 3, reason: 'khac' });
    const again = byCode(db, 'KHO-0004');
    expect(await fieldsOf(api.staff.stock.issue(again.id, again.version, { qty: 3, reason: 'khac' }))).toEqual({ qty: 'Kho chỉ còn 2 chai.' });
    expect(item(db, i.id).qty).toBe(2);
  });
  it('refuses an inactive item', async () => {
    const { api, db } = await setup();
    const off = byCode(db, 'KHO-0007');
    expect(await fieldsOf(api.staff.stock.issue(off.id, off.version, { qty: 1, reason: 'khac' }))).toEqual({ item: STOCK_MSG.inactive });
  });
});

describe('adjust (stock-take)', () => {
  it('records the difference both ways and to zero', async () => {
    const { api, db } = await setup();
    const i = byCode(db, 'KHO-0001');
    await api.staff.stock.adjust(i.id, i.version, { counted_qty: 30, note: 'Đếm lại' });
    expect(moves(db, i.id).at(-1)).toMatchObject({ kind: 'adjust', delta: 5, qty_after: 30, reason: 'kiem_ke', note: 'Đếm lại' });
    const j = byCode(db, 'KHO-0001');
    await api.staff.stock.adjust(j.id, j.version, { counted_qty: 0 });
    expect(moves(db, i.id).at(-1)).toMatchObject({ delta: -30, qty_after: 0 });
  });
  it('refuses a count equal to the stock, a negative count and an inactive item', async () => {
    const { api, db } = await setup();
    const i = byCode(db, 'KHO-0001');
    const off = byCode(db, 'KHO-0007');
    expect(await fieldsOf(api.staff.stock.adjust(i.id, i.version, { counted_qty: 25 }))).toEqual({ counted_qty: STOCK_MSG.countedSame });
    expect(await fieldsOf(api.staff.stock.adjust(i.id, i.version, { counted_qty: -1 }))).toEqual({ counted_qty: STOCK_MSG.counted });
    expect(await fieldsOf(api.staff.stock.adjust(off.id, off.version, { counted_qty: 9 }))).toEqual({ item: STOCK_MSG.inactive });
  });
});

describe('bookkeeping', () => {
  it('every write leaves one audit line with its action name, and the quantity always equals the latest movement', async () => {
    const { api, db } = await setup();
    const i = byCode(db, 'KHO-0001');
    await api.staff.stock.receive(i.id, i.version, { qty: 2 });
    await api.staff.stock.issue(i.id, i.version + 1, { qty: 1, reason: 'khac' });
    await api.staff.stock.adjust(i.id, i.version + 2, { counted_qty: 7 });
    expect(db.read().t.audit_events.slice(-3).map((e) => e.action)).toEqual(['stock.receive', 'stock.issue', 'stock.adjust']);
    for (const it of db.read().t.stock_items) expect(it.qty).toBe(moves(db, it.id).at(-1)!.qty_after);
  });
});

describe('permissions', () => {
  type Api = ReturnType<typeof makeTestApi>['api'];
  type Op = 'create' | 'update' | 'receive' | 'issue' | 'adjust';
  const reads = (api: Api, id: string) => [() => api.staff.stock.summary(), () => api.staff.stock.list(), () => api.staff.stock.get(id)];
  const write = (api: Api, op: Op, id: string, v: number) => ({
    create: () => api.staff.stock.create({ name: 'Mới', kind: 'vat_tu', unit: 'cái', min_qty: 0 }),
    update: () => api.staff.stock.update(id, v, { name: 'Đổi', kind: 'thuoc', unit: 'chai', min_qty: 1 }),
    receive: () => api.staff.stock.receive(id, v, { qty: 1 }),
    issue: () => api.staff.stock.issue(id, v, { qty: 1, reason: 'khac' }),
    adjust: () => api.staff.stock.adjust(id, v, { counted_qty: 1 }),
  })[op]();
  const OPS: Op[] = ['create', 'update', 'receive', 'issue', 'adjust'];
  const NEEDS: Record<Op, string> = { create: 'stock.items', update: 'stock.items', receive: 'stock.receive', issue: 'stock.issue', adjust: 'stock.adjust' };

  it.each(['bacsi_duc', 'bacsi_mai', 'spa_ngocanh'])('%s may read the stock, and may not write it', async (who) => {
    const { api, db } = makeTestApi();
    await loginAs(api, who);
    const i = byCode(db, 'KHO-0001');
    for (const call of reads(api, i.id)) await expect(call()).resolves.toBeDefined();
    for (const op of OPS) await expect(write(api, op, i.id, i.version)).rejects.toThrow(ForbiddenError);
  });
  it('a customer and a signed-out visitor are refused every stock function', async () => {
    const { api, db } = makeTestApi();
    const i = byCode(db, 'KHO-0001');
    const all = () => [...reads(api, i.id), ...OPS.map((op) => () => write(api, op, i.id, i.version))];
    for (const call of all()) await expect(call()).rejects.toThrow(ForbiddenError);
    await loginAs(api, 'lan_nguyen');
    for (const call of all()) await expect(call()).rejects.toThrow(ForbiddenError);
  });
  it('refused calls change nothing', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    const i = byCode(db, 'KHO-0001');
    const rev = db.read().rev;
    for (const op of OPS) await write(api, op, i.id, i.version).catch(() => undefined);
    expect(db.read().rev).toBe(rev);
    expect(db.read().t.stock_moves).toHaveLength(52);
  });
  describe.each(['stock.items', 'stock.receive', 'stock.issue', 'stock.adjust'] as const)('a person given only %s', (cap) => {
    it.each(OPS)('may %s only if that is the right it carries', async (op) => {
      const { api, db } = makeTestApi();
      db.transact('t', (d) => { d.t.staff_users.find((u) => u.id === 'stf-duc')!.extra_capabilities = [cap]; });
      await loginAs(api, 'bacsi_duc');
      const i = byCode(db, 'KHO-0001');
      const call = write(api, op, i.id, i.version);
      if (NEEDS[op] === cap) await expect(call).resolves.not.toThrow();
      else await expect(call).rejects.toThrow(ForbiddenError);
    });
  });
  it('the old stock.manage still opens all four (it stands for them until the screens use the new rights)', async () => {
    const { api, db } = makeTestApi();
    db.transact('t', (d) => { d.t.staff_users.find((u) => u.id === 'stf-duc')!.extra_capabilities = ['stock.manage']; });
    await loginAs(api, 'bacsi_duc');
    expect(((await api.auth.me()) as { caps: string[] }).caps).toEqual(expect.arrayContaining(['stock.receive', 'stock.issue', 'stock.adjust', 'stock.items']));
    const id = byCode(db, 'KHO-0001').id;
    await api.staff.stock.receive(id, byCode(db, 'KHO-0001').version, { qty: 1 });
    await api.staff.stock.issue(id, byCode(db, 'KHO-0001').version, { qty: 1, reason: 'khac' });
    await api.staff.stock.adjust(id, byCode(db, 'KHO-0001').version, { counted_qty: 9 });
    await api.staff.stock.update(id, byCode(db, 'KHO-0001').version, { name: 'Đổi tên', kind: 'thuoc', unit: 'chai', min_qty: 1 });
  });
  it('a write right without the view right is not enough', async () => {
    const { api, db } = makeTestApi();
    db.transact('t', (d) => { const u = d.t.staff_users.find((x) => x.id === 'stf-duc')!; u.preset_ids = []; u.extra_capabilities = ['stock.receive']; });
    await loginAs(api, 'bacsi_duc');
    const i = byCode(db, 'KHO-0001');
    await expect(api.staff.stock.receive(i.id, i.version, { qty: 1 })).rejects.toThrow(ForbiddenError);
  });
  it('me() lists the view right for every staff role, and the write rights only for the manager', async () => {
    const { api } = makeTestApi();
    const capsOf = async (who: string) => { await loginAs(api, who); return ((await api.auth.me()) as { caps: string[] }).caps; };
    for (const who of ['bacsi_duc', 'bacsi_mai', 'spa_ngocanh']) {
      const c = await capsOf(who);
      expect(c).toContain('stock.view');
      expect(c.filter((x) => x.startsWith('stock.') && x !== 'stock.view')).toEqual([]);
    }
    expect(await capsOf('quanly_ha')).toEqual(expect.arrayContaining(['stock.view', 'stock.receive', 'stock.issue', 'stock.adjust', 'stock.items']));
  });
});

describe('review follow-ups', () => {
  it('an empty expiry means none: create stores none, update clears the date, receive leaves the date alone', async () => {
    const { api, db } = await setup();
    const id = await api.staff.stock.create({ name: 'Chỉ khâu', kind: 'vat_tu', unit: 'cuộn', min_qty: 1, expires_on: '' });
    expect(item(db, id).expires_on).toBeUndefined();
    const a = byCode(db, 'KHO-0006');
    await api.staff.stock.update(a.id, a.version, { name: a.name, kind: a.kind, unit: a.unit, min_qty: a.min_qty, expires_on: '' });
    expect(item(db, a.id).expires_on).toBeUndefined();
    const b = byCode(db, 'KHO-0003');
    await api.staff.stock.receive(b.id, b.version, { qty: 1, expires_on: '' });
    expect(item(db, b.id).expires_on).toBe(b.expires_on);
  });
  it('receive refuses an impossible date and writes nothing', async () => {
    const { api, db } = await setup();
    const i = byCode(db, 'KHO-0002');
    const n = db.read().t.stock_moves.length;
    for (const expires_on of ['2026-02-30', '2026-13-01', '26-1-1']) expect(await fieldsOf(api.staff.stock.receive(i.id, i.version, { qty: 1, expires_on }))).toEqual({ expires_on: STOCK_MSG.expires });
    expect(db.read().t.stock_moves).toHaveLength(n);
  });
  it('issue and adjust refuse a huge or non-numeric quantity and write nothing', async () => {
    const { api, db } = await setup();
    const i = byCode(db, 'KHO-0001');
    const n = db.read().t.stock_moves.length;
    for (const qty of [1e9, '3' as never]) {
      expect(await fieldsOf(api.staff.stock.issue(i.id, i.version, { qty, reason: 'khac' }))).toEqual({ qty: STOCK_MSG.moveQty });
      expect(await fieldsOf(api.staff.stock.adjust(i.id, i.version, { counted_qty: qty }))).toEqual({ counted_qty: STOCK_MSG.counted });
    }
    expect(db.read().t.stock_moves).toHaveLength(n);
  });
  it('update refuses a name another item of the same kind already has, but accepts its own name', async () => {
    const { api, db } = await setup();
    const i = byCode(db, 'KHO-0006');
    const base = { kind: i.kind, unit: i.unit, min_qty: i.min_qty } as const;
    expect(await fieldsOf(api.staff.stock.update(i.id, i.version, { ...base, name: 'nuoc muoi sinh ly 0,9 %' }))).toEqual({ name: STOCK_MSG.duplicate });
    await expect(api.staff.stock.update(i.id, i.version, { ...base, name: i.name })).resolves.toBeUndefined();
  });
});

describe('summarizeStock', () => {
  it('counts active rows only', () => {
    const row = (o: Partial<StockRow>): StockRow => ({ id: 'x', code: 'K', name: 'x', kind: 'vat_tu', unit: 'cái', qty: 5, minQty: 1, active: true, level: 'ok', expiry: 'none', version: 1, ...o });
    expect(summarizeStock([row({}), row({ level: 'low' }), row({ level: 'out' }), row({ expiry: 'soon' }), row({ expiry: 'expired' }), row({ active: false, level: 'out', expiry: 'expired' })]))
      .toEqual({ total: 5, low: 1, out: 1, expiringSoon: 1, expired: 1 });
  });
});
