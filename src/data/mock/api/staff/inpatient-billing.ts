/** The stay's day charge on its invoice (§3.2, §3.5, §3.8). */
import { invoiceTotals, lineTotal } from '../../../rules/invoice-math';
import { DAY_ITEM_CODES, MIN_BILLABLE_DAYS } from '../../../rules/stay-billing';
import { newId } from '../../ids';
import type { Doc, Invoice, PriceItem } from '../../store/schema';

/** LT01–LT03, in code order. */
export function dayItems(doc: Readonly<Doc>): PriceItem[] {
  return DAY_ITEM_CODES.map((code) => doc.t.price_items.find((p) => p.code === code && p.active)).filter((p): p is PriceItem => !!p);
}

export function recomputeTotals(d: Doc, inv: Invoice): void {
  const totals = invoiceTotals(d.t.invoice_lines.filter((l) => l.invoice_id === inv.id), inv.discount);
  inv.subtotal = totals.subtotal;
  inv.total = totals.total;
}

/** Admission adds the minimum (0,1 day); discharge sets the real number. Bumps the version so an open editor elsewhere reloads. */
export function addDayLine(d: Doc, inv: Invoice, item: PriceItem, petId: string): void {
  d.t.invoice_lines.push({
    id: newId(), invoice_id: inv.id, price_item_id: item.id, pet_id: petId, name_snapshot: item.name, category_snapshot: item.category,
    customer_group_snapshot: item.customer_group, unit_snapshot: item.unit, unit_price: item.price, qty: MIN_BILLABLE_DAYS, line_total: lineTotal(item.price, MIN_BILLABLE_DAYS),
  });
  recomputeTotals(d, inv);
  inv.version += 1;
}
