import type { StockIssueReason, StockKind } from '@/data/contracts/enums';
import type { StockAdjustInput, StockInput, StockIssueInput, StockReceiveInput, StockRow } from '@/data/staff';
import { validateAdjust, validateIssue, validateReceive, validateStockInput } from '@/data/rules/stock';

export type ItemFormValues = { name: string; kind: StockKind; unit: string; qty: string; minQty: string; expiresOn: string };
export type ReceiveFormValues = { qty: string; supplier: string; note: string; expiresOn: string };
export type IssueFormValues = { qty: string; reason: StockIssueReason; note: string };
export type AdjustFormValues = { counted: string; note: string };

/** A whole number typed the usual ways ("25", "1.000"); anything else is `undefined`, never NaN. A dot is a thousands mark, so it needs groups of three digits. */
export function parseQty(raw: string): number | undefined {
  const s = raw.trim();
  if (!/^\d+$/.test(s) && !/^\d{1,3}(\.\d{3})+$/.test(s)) return undefined;
  return Number(s.replace(/\./g, ''));
}

/** An item as form values: the edit form starts from it, and a switch-off sends it back unchanged apart from `active`. */
export const valuesOf = (item: StockRow): ItemFormValues => ({
  name: item.name, kind: item.kind, unit: item.unit, qty: '0', minQty: String(item.minQty), expiresOn: item.expiresOn ?? '',
});

/** An unreadable number is sent as NaN, which the rules reject with the sentence for that field. */
const num = (raw: string) => parseQty(raw) ?? Number.NaN;
const text = (raw: string) => raw.trim() || undefined;

export function toStockInput(v: ItemFormValues, mode: 'create' | 'update', active?: boolean): StockInput {
  const input: StockInput = { name: v.name.trim(), kind: v.kind, unit: v.unit.trim(), min_qty: num(v.minQty), expires_on: v.expiresOn.trim() };
  if (mode === 'create') input.qty = num(v.qty);
  if (active !== undefined) input.active = active;
  return input;
}

export function toReceiveInput(v: ReceiveFormValues): StockReceiveInput {
  const input: StockReceiveInput = { qty: num(v.qty) };
  const supplier = text(v.supplier);
  const note = text(v.note);
  const expires = text(v.expiresOn);
  if (supplier) input.supplier = supplier;
  if (note) input.note = note;
  if (expires) input.expires_on = expires;
  return input;
}

export function toIssueInput(v: IssueFormValues): StockIssueInput {
  const input: StockIssueInput = { qty: num(v.qty), reason: v.reason };
  const note = text(v.note);
  if (note) input.note = note;
  return input;
}

export function toAdjustInput(v: AdjustFormValues): StockAdjustInput {
  const input: StockAdjustInput = { counted_qty: num(v.counted) };
  const note = text(v.note);
  if (note) input.note = note;
  return input;
}

export const itemErrors = (v: ItemFormValues, mode: 'create' | 'update') => validateStockInput(toStockInput(v, mode), mode);
export const receiveErrors = (v: ReceiveFormValues, onHand: { qty: number }) => validateReceive(toReceiveInput(v), onHand);
export const issueErrors = (v: IssueFormValues, onHand: { qty: number; unit: string }) => validateIssue(toIssueInput(v), onHand);
export const adjustErrors = (v: AdjustFormValues, onHand: { qty: number }) => validateAdjust(toAdjustInput(v), onHand);

/** The "Mức báo hết" box starts at the system setting (stock_default_min); without a usable one, 5. */
export function suggestedMin(setting: number | undefined): string {
  return setting !== undefined && Number.isInteger(setting) && setting >= 0 ? String(setting) : '5';
}
