import type { PaymentState } from '../contracts/enums';

export type Discount = { type: 'percent' | 'amount'; value: number };

export const lineTotal = (unitPrice: number, qty: number) => unitPrice * qty;

export function invoiceTotals(lines: { unit_price: number; qty: number }[], discount?: Discount) {
  const subtotal = lines.reduce((s, l) => s + lineTotal(l.unit_price, l.qty), 0);
  const raw = !discount ? 0 : discount.type === 'percent' ? Math.round((subtotal * discount.value) / 100) : discount.value;
  const discountAmount = Math.min(Math.max(raw, 0), subtotal);
  return { subtotal, discountAmount, total: subtotal - discountAmount };
}

/** Payment state is derived from the payments, never stored, so it cannot drift. */
export function paymentState(total: number, payments: { amount: number; reversed_at?: string | null }[]) {
  const paid = payments.filter((p) => !p.reversed_at).reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(total - paid, 0);
  const state: PaymentState = paid <= 0 ? 'unpaid' : remaining > 0 ? 'partial' : 'paid';
  return { state, paid, remaining };
}

export const cashChange = (due: number, given: number) => Math.max(given - due, 0);
