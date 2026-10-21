import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { NotFoundError } from '../../../contracts/errors';

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
