import { ForbiddenError, ValidationError } from '../../../contracts/errors';
import type { CustomerGroup } from '../../../contracts/enums';
import type { PriceInput, StaffPriceItem, StaffPricesApi } from '../../../contracts/staff';
import { toIsoVN } from '../../../../lib/dates';
import { nextPriceCode } from '../../../rules/price-codes';
import { DAY_ITEM_CODES } from '../../../rules/stay-billing';
import type { Env } from '../../env';
import { currentActor } from '../../guard';
import { newId } from '../../ids';
import { sleepRead, sleepWrite } from '../../latency';
import type { Doc, PriceItem } from '../../store/schema';
import { checkVersion } from '../../store/version';
import { audit, find, fold, staffActor, type StaffActor } from './common';

const MSG = {
  name: 'Vui lòng nhập tên mục.',
  duplicate: 'Mục này đã có trong bảng giá.',
  unit: 'Vui lòng nhập đơn vị, ví dụ: lần, mũi, ngày.',
  price: 'Giá cần là số từ 1 ₫ trở lên.',
  reference: 'Giá tham khảo cần là số từ 1 ₫ trở lên.',
  category: 'Không đổi được danh mục của mục này.',
  dayOff: 'Mục này dùng để tính tiền nội trú nên không tắt được.',
  activeFlag: 'Dùng nút bật/tắt để đổi trạng thái mục này.',
  dayOpen: 'Mục này dùng để tính tiền nội trú nên phải giữ giá cố định.',
} as const;

/** Name for the duplicate check: no accents, no case, inner runs of spaces collapsed. */
const squash = (s: string) => fold(s.trim().replace(/\s+/g, ' '));
const isDayItem = (code: string) => (DAY_ITEM_CODES as readonly string[]).includes(code);
const wholeVnd = (n: number | undefined) => n !== undefined && Number.isInteger(n) && n >= 1;

/**
 * Medicines and supplies are one combined line for customers (R7); other categories show each line; exam can choose.
 * An edit that does not say keeps the item's current group — dropping a procedure to "itemized" would show its name to customers.
 */
function groupFor(input: PriceInput, current?: CustomerGroup): CustomerGroup {
  if (input.category === 'medicine' || input.category === 'supply') return 'treatment';
  return input.category === 'exam' ? input.customer_group ?? current ?? 'itemized' : 'itemized';
}

function check(doc: Readonly<Doc>, input: PriceInput, self?: PriceItem): Record<string, string> {
  const e: Record<string, string> = {};
  if (!input.name.trim()) e.name = MSG.name;
  else if (doc.t.price_items.some((p) => p.id !== self?.id && p.category === input.category && squash(p.name) === squash(input.name))) e.name = MSG.duplicate;
  if (!input.unit.trim()) e.unit = MSG.unit;
  if (input.price_mode === 'fixed' && !wholeVnd(input.price)) e.price = MSG.price;
  if (input.price_mode === 'open' && input.reference_price !== undefined && !wholeVnd(input.reference_price)) e.reference_price = MSG.reference;
  if (self) {
    if (input.category !== self.category) e.category = MSG.category;
    if (isDayItem(self.code) && input.price_mode !== 'fixed') e.price_mode = MSG.dayOpen;
    if (input.active !== undefined && input.active !== self.active) e.active = MSG.activeFlag;
  }
  return e;
}

export function staffPricesApi(env: Env): StaffPricesApi {
  const { db } = env;

  function write(a: StaffActor, p: PriceItem, input: PriceInput) {
    p.name = input.name.trim();
    p.unit = input.unit.trim();
    p.price_mode = input.price_mode;
    p.price = input.price_mode === 'fixed' ? input.price! : 0;
    p.reference_price = input.price_mode === 'open' ? input.reference_price : undefined;
    p.customer_group = groupFor(input, p.customer_group);
    p.updated_at = toIsoVN(env.clock());
    p.updated_by = a.staff.id;
  }

  return {
    async list() {
      if (currentActor(env.db, env.session.get()).type !== 'staff') throw new ForbiddenError();
      await sleepRead();
      return env.db.read().t.price_items.map((p): StaffPriceItem => ({
        id: p.id, code: p.code, category: p.category, name: p.name, unit: p.unit, price: p.price, price_mode: p.price_mode, active: p.active,
        customer_group: p.customer_group, version: p.version, reference_price: p.reference_price,
      }));
    },

    async create(input) {
      const a = staffActor(env, 'pricelist.edit');
      await sleepWrite();
      return db.transact('prices.create', (d) => {
        const fields = check(d, input);
        if (Object.keys(fields).length) throw new ValidationError(fields);
        const id = newId();
        const p: PriceItem = {
          id, code: nextPriceCode(input.category, d.t.price_items.map((x) => x.code)), category: input.category, customer_group: groupFor(input), name: '', unit: '',
          price: 0, price_mode: input.price_mode, active: input.active ?? true, updated_at: '', updated_by: a.staff.id, version: 1,
        };
        write(a, p, input);
        d.t.price_items.push(p);
        audit(d, env, a, 'price.create', 'price_item', id, `${a.staff.display_name} thêm mục giá ${p.code} · ${p.name}`);
        return id;
      });
    },

    async update(id, version, input) {
      const a = staffActor(env, 'pricelist.edit');
      await sleepWrite();
      db.transact('prices.update', (d) => {
        const p = find(d.t.price_items, id);
        checkVersion(p, version);
        const fields = check(d, input, p);
        if (Object.keys(fields).length) throw new ValidationError(fields);
        write(a, p, input);
        p.version += 1;
        audit(d, env, a, 'price.update', 'price_item', id, `${a.staff.display_name} sửa mục giá ${p.code} · ${p.name}`);
      });
    },

    async setActive(id, version, active) {
      const a = staffActor(env, 'pricelist.edit');
      await sleepWrite();
      db.transact('prices.setActive', (d) => {
        const p = find(d.t.price_items, id);
        checkVersion(p, version);
        if (!active && isDayItem(p.code)) throw new ValidationError({ active: MSG.dayOff });
        p.active = active;
        p.updated_at = toIsoVN(env.clock());
        p.updated_by = a.staff.id;
        p.version += 1;
        audit(d, env, a, active ? 'price.activate' : 'price.deactivate', 'price_item', id, `${a.staff.display_name} ${active ? 'bật' : 'tắt'} mục giá ${p.code} · ${p.name}`);
      });
    },
  };
}
