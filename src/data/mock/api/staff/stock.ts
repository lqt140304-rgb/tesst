import type { StaffStockApi, StockDetail, StockMoveRow, StockRow, StockSummary } from '../../../contracts/staff';
import { STOCK_EXPIRY_SOON_DAYS, expiryState, stockLevel } from '../../../rules/stock';
import { todayVN } from '../../../../lib/dates';
import type { Env } from '../../env';
import { sleepRead } from '../../latency';
import type { StockItem, StockMove } from '../../store/schema';
import { find, fold, staffActor } from './common';

export function toRow(i: StockItem, today: string): StockRow {
  return {
    id: i.id, code: i.code, name: i.name, kind: i.kind, unit: i.unit, qty: i.qty, minQty: i.min_qty, expiresOn: i.expires_on, active: i.active,
    level: stockLevel(i), expiry: expiryState(i.expires_on, today, STOCK_EXPIRY_SOON_DAYS), version: i.version,
  };
}

const toMoveRow = (m: StockMove): StockMoveRow => ({
  id: m.id, kind: m.kind, delta: m.delta, qtyAfter: m.qty_after, reason: m.reason, supplier: m.supplier, note: m.note, at: m.at, byName: m.by_name,
});

/** Warnings first: out of stock, low, expired, expiring; then by name. */
function rank(r: StockRow): number {
  const level = r.level === 'out' ? 0 : r.level === 'low' ? 1 : 4;
  const expiry = r.expiry === 'expired' ? 2 : r.expiry === 'soon' ? 3 : 4;
  return Math.min(level, expiry);
}

export function staffStockApi(env: Env): StaffStockApi {
  const readRows = () => {
    const today = todayVN(env.clock());
    return env.db.read().t.stock_items.map((i) => toRow(i, today));
  };

  return {
    async summary() {
      staffActor(env, 'stock.view');
      await sleepRead();
      const rows = readRows().filter((r) => r.active);
      const sum: StockSummary = {
        total: rows.length, low: rows.filter((r) => r.level === 'low').length, out: rows.filter((r) => r.level === 'out').length,
        expiringSoon: rows.filter((r) => r.expiry === 'soon').length, expired: rows.filter((r) => r.expiry === 'expired').length,
      };
      return sum;
    },

    async list(f) {
      staffActor(env, 'stock.view');
      await sleepRead();
      const q = fold((f?.q ?? '').trim());
      return readRows()
        .filter((r) => f?.includeInactive || r.active)
        .filter((r) => !f?.kind || r.kind === f.kind)
        .filter((r) => !f?.status || f.status === 'all' || (f.status === 'expiring' ? r.expiry !== 'none' : r.level === f.status))
        .filter((r) => !q || fold(r.name).includes(q) || fold(r.code).includes(q))
        .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'vi'));
    },

    async get(id): Promise<StockDetail> {
      staffActor(env, 'stock.view');
      await sleepRead();
      const { t } = env.db.read();
      const item = find(t.stock_items, id);
      const moves = t.stock_moves
        .map((m, order) => ({ m, order }))
        .filter((x) => x.m.item_id === id)
        .sort((a, b) => b.m.at.localeCompare(a.m.at) || b.order - a.order)
        .slice(0, 100)
        .map((x) => toMoveRow(x.m));
      return { item: toRow(item, todayVN(env.clock())), moves };
    },

    async create() { throw new Error('not implemented'); },
    async update() { throw new Error('not implemented'); },
    async receive() { throw new Error('not implemented'); },
    async issue() { throw new Error('not implemented'); },
    async adjust() { throw new Error('not implemented'); },
  };
}
