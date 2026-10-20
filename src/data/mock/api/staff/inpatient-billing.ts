/** The stay's day charge on its invoice (§3.2, §3.5, §3.8). */
import type { DischargeResult, StayBilling } from '../../../contracts/staff';
import { invoiceTotals, lineTotal } from '../../../rules/invoice-math';
import { billableDays, DAY_ITEM_CODES, MIN_BILLABLE_DAYS } from '../../../rules/stay-billing';
import { newId } from '../../ids';
import type { Doc, Invoice, InvoiceLine, PriceItem, Stay } from '../../store/schema';

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

/**
 * The pet's LT01–LT03 line, found by item rather than by line id: re-saving a draft renews line ids, and staff may swap
 * LT02 for LT03 in the editor. A line staff removed stays removed.
 */
export function findDayLine(doc: Readonly<Doc>, invoiceId: string, petId: string): InvoiceLine | undefined {
  const codes: readonly string[] = DAY_ITEM_CODES;
  return doc.t.invoice_lines.find((l) => l.invoice_id === invoiceId && (!l.pet_id || l.pet_id === petId)
    && codes.includes(doc.t.price_items.find((p) => p.id === l.price_item_id)?.code ?? ''));
}

/** Discharge: the day line takes the hours actually stayed, on drafts only (an issued invoice never changes). */
export function settleDayLine(d: Doc, stay: Stay, until: string): DischargeResult {
  const days = billableDays(stay.admitted_at, until);
  const inv = stay.invoice_id ? d.t.invoices.find((i) => i.id === stay.invoice_id) : undefined;
  const line = inv?.status === 'draft' ? findDayLine(d, inv.id, stay.pet_id) : undefined;
  if (!inv || !line) return { days, invoiceUpdated: false };
  line.qty = days;
  line.line_total = lineTotal(line.unit_price, days);
  recomputeTotals(d, inv);
  inv.version += 1;
  return { days, invoiceUpdated: true };
}

export function stayBilling(doc: Readonly<Doc>, stay: Stay): StayBilling | undefined {
  const inv = stay.invoice_id ? doc.t.invoices.find((i) => i.id === stay.invoice_id) : undefined;
  if (!inv) return undefined;
  const line = findDayLine(doc, inv.id, stay.pet_id);
  return { invoiceId: inv.id, invoiceCode: inv.code, status: inv.status, dayItemName: line?.name_snapshot, dayPrice: line?.unit_price, dayQty: line?.qty };
}
