import { describe, expect, it } from 'vitest';
import { cashChange, invoiceTotals, lineTotal, paymentState } from './invoice-math';

describe('invoice maths', () => {
  it('computes line and invoice totals with a percent discount', () => {
    expect(lineTotal(150000, 3)).toBe(450000);
    expect(invoiceTotals([{ unit_price: 500000, qty: 2 }], { type: 'percent', value: 10 })).toEqual({ subtotal: 1000000, discountAmount: 100000, total: 900000 });
  });
  it('caps an amount discount at the subtotal', () => {
    expect(invoiceTotals([{ unit_price: 100000, qty: 1 }], { type: 'amount', value: 150000 }).total).toBe(0);
  });
  it('derives payment state, ignoring reversed payments', () => {
    expect(paymentState(450000, [])).toEqual({ state: 'unpaid', paid: 0, remaining: 450000 });
    expect(paymentState(450000, [{ amount: 200000 }])).toEqual({ state: 'partial', paid: 200000, remaining: 250000 });
    expect(paymentState(450000, [{ amount: 450000, reversed_at: '2026-10-19T09:00:00+07:00' }])).toEqual({ state: 'unpaid', paid: 0, remaining: 450000 });
    expect(paymentState(450000, [{ amount: 200000 }, { amount: 250000 }]).state).toBe('paid');
  });
  it('computes cash change, never negative', () => {
    expect(cashChange(100000, 200000)).toBe(100000);
    expect(cashChange(100000, 50000)).toBe(0);
  });
});
