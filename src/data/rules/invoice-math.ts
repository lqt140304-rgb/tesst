import type { PaymentState } from '../contracts/enums';

export type Discount = { type: 'percent' | 'amount'; value: number };

/** Rounded to whole đồng: quantities may be fractional (nội trú 2,2 ngày). */
export const lineTotal = (unitPrice: number, qty: number) => Math.round(unitPrice * qty);

/** Each line's share of an invoice total (after discount), proportional to its line total; rounded on the running sum so the parts add up to `total` exactly. */
export function netLineTotals(lineTotals: number[], total: number): number[] {
  const sum = lineTotals.reduce((a, b) => a + b, 0);
  if (sum <= 0) return lineTotals.map(() => 0);
  let cum = 0;
  let prev = 0;
  return lineTotals.map((n) => {
    cum += n;
    const upTo = Math.round((cum * total) / sum);
    const part = upTo - prev;
    prev = upTo;
    return part;
  });
}

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
