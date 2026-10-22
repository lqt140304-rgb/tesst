import { ForbiddenError, ValidationError } from '../../../contracts/errors';
import type { StaffStockApi, StockDetail, StockInput, StockMoveRow, StockRow, StockSummary } from '../../../contracts/staff';
import {
  STOCK_MSG, expiryState, mergeExpiry, normalizeExpiry, stockLevel, validateAdjust, validateIssue, validateReceive, validateStockInput,
} from '../../../rules/stock';
import { todayVN, toIsoVN } from '../../../../lib/dates';
import type { Env } from '../../env';
import { newId, nextCode } from '../../ids';
import { sleepRead, sleepWrite } from '../../latency';
import { readSettings } from '../../settings';
import type { Doc, StockItem, StockMove } from '../../store/schema';
import { checkVersion } from '../../store/version';
import { audit, find, fold, staffActor, type StaffActor } from './common';

/** `soonDays` is the "stock_expiry_days" system setting. */
export function toRow(i: StockItem, today: string, soonDays: number): StockRow {
  return {
    id: i.id, code: i.code, name: i.name, kind: i.kind, unit: i.unit, qty: i.qty, minQty: i.min_qty, expiresOn: i.expires_on, active: i.active,
    level: stockLevel(i), expiry: expiryState(i.expires_on, today, soonDays), version: i.version,
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

/** Name for the duplicate check: no accents, no case, inner runs of spaces collapsed. */
const squash = (s: string) => fold(s.trim().replace(/\s+/g, ' '));

function checkInput(d: Readonly<Doc>, input: StockInput, mode: 'create' | 'update', self?: StockItem): Record<string, string> {
  const e = validateStockInput(input, mode);
  if (!e.name && d.t.stock_items.some((i) => i.id !== self?.id && i.kind === input.kind && squash(i.name) === squash(input.name))) e.name = STOCK_MSG.duplicate;
  if (self && !e.kind && input.kind !== self.kind) e.kind = STOCK_MSG.kindLocked;
  return e;
}

const assertActive = (i: StockItem) => {
  if (!i.active) throw new ValidationError({ item: STOCK_MSG.inactive });
};

const fail = (e: Record<string, string>) => {
  if (Object.keys(e).length) throw new ValidationError(e);
};

/** Counts active items only; `low` and `out` do not overlap, expiring soon and expired do not overlap. */
export function summarizeStock(rows: readonly StockRow[]): StockSummary {
  const live = rows.filter((r) => r.active);
  return {
    total: live.length, low: live.filter((r) => r.level === 'low').length, out: live.filter((r) => r.level === 'out').length,
    expiringSoon: live.filter((r) => r.expiry === 'soon').length, expired: live.filter((r) => r.expiry === 'expired').length,
  };
}

export function staffStockApi(env: Env): StaffStockApi {
  const { db } = env;

  /** Each way of writing has its own right (receive, issue, adjust, items), and all of them need the view right as well. */
  function writer(cap: 'stock.receive' | 'stock.issue' | 'stock.adjust' | 'stock.items'): StaffActor {
    const a = staffActor(env, cap);
    if (!a.caps.has('stock.view')) throw new ForbiddenError();
    return a;
  }

  /** One history line per change of quantity; the item's quantity, version and the line move together. */
  function record(d: Doc, a: StaffActor, i: StockItem, m: Pick<StockMove, 'kind' | 'delta' | 'reason' | 'supplier' | 'note'>, bump = true) {
    i.qty += m.delta;
    if (bump) i.version += 1;
    d.t.stock_moves.push({ id: newId(), item_id: i.id, ...m, qty_after: i.qty, at: toIsoVN(env.clock()), by: a.staff.id, by_name: a.staff.display_name });
  }

  const readRows = () => {
    const today = todayVN(env.clock());
    const { t } = env.db.read();
    const soonDays = readSettings(t).values.stock_expiry_days;
    return t.stock_items.map((i) => toRow(i, today, soonDays));
  };

  return {
    async summary() {
      staffActor(env, 'stock.view');
      await sleepRead();
      return summarizeStock(readRows());
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
      return { item: toRow(item, todayVN(env.clock()), readSettings(t).values.stock_expiry_days), moves };
    },

    async create(input) {
      const a = writer('stock.items');
      await sleepWrite();
      return db.transact('stock.create', (d) => {
        fail(checkInput(d, input, 'create'));
        const item: StockItem = {
          id: newId(), code: nextCode(d, 'KHO'), name: input.name.trim(), kind: input.kind, unit: input.unit.trim(), qty: 0, min_qty: input.min_qty,
          expires_on: normalizeExpiry(input.expires_on), active: input.active ?? true, version: 1, created_at: toIsoVN(env.clock()), created_by: a.staff.id,
        };
        d.t.stock_items.push(item);
        if ((input.qty ?? 0) > 0) record(d, a, item, { kind: 'in', delta: input.qty!, reason: 'nhap_hang', note: 'Tồn ban đầu' }, false);
        audit(d, env, a, 'stock.create', 'stock_item', item.id, `${a.staff.display_name} thêm món kho ${item.code} · ${item.name}`);
        return item.id;
      });
    },

    async update(id, version, input) {
      const a = writer('stock.items');
      await sleepWrite();
      db.transact('stock.update', (d) => {
        const item = find(d.t.stock_items, id);
        checkVersion(item, version);
        fail(checkInput(d, input, 'update', item));
        item.name = input.name.trim();
        item.unit = input.unit.trim();
        item.min_qty = input.min_qty;
        item.expires_on = normalizeExpiry(input.expires_on);
        item.active = input.active ?? item.active;
        item.version += 1;
        audit(d, env, a, 'stock.update', 'stock_item', id, `${a.staff.display_name} sửa món kho ${item.code} · ${item.name}`);
      });
    },

    async receive(id, version, input) {
      const a = writer('stock.receive');
      await sleepWrite();
      db.transact('stock.receive', (d) => {
        const item = find(d.t.stock_items, id);
        checkVersion(item, version);
        assertActive(item);
        fail(validateReceive(input, item));
        item.expires_on = mergeExpiry(item.expires_on, normalizeExpiry(input.expires_on), todayVN(env.clock()));
        record(d, a, item, { kind: 'in', delta: input.qty, reason: 'nhap_hang', supplier: input.supplier?.trim() || undefined, note: input.note?.trim() || undefined });
        audit(d, env, a, 'stock.receive', 'stock_item', id, `${a.staff.display_name} nhập thêm ${input.qty} ${item.unit} ${item.name} (${item.code})`);
      });
    },

    async issue(id, version, input) {
      const a = writer('stock.issue');
      await sleepWrite();
      db.transact('stock.issue', (d) => {
        const item = find(d.t.stock_items, id);
        checkVersion(item, version);
        assertActive(item);
        fail(validateIssue(input, item));
        record(d, a, item, { kind: 'out', delta: -input.qty, reason: input.reason, note: input.note?.trim() || undefined });
        audit(d, env, a, 'stock.issue', 'stock_item', id, `${a.staff.display_name} xuất kho ${input.qty} ${item.unit} ${item.name} (${item.code})`);
      });
    },

    async adjust(id, version, input) {
      const a = writer('stock.adjust');
      await sleepWrite();
      db.transact('stock.adjust', (d) => {
        const item = find(d.t.stock_items, id);
        checkVersion(item, version);
        assertActive(item);
        fail(validateAdjust(input, item));
        record(d, a, item, { kind: 'adjust', delta: input.counted_qty - item.qty, reason: 'kiem_ke', note: input.note?.trim() || undefined });
        audit(d, env, a, 'stock.adjust', 'stock_item', id, `${a.staff.display_name} kiểm kê ${item.name} (${item.code}): còn ${item.qty} ${item.unit}`);
      });
    },
  };
}
