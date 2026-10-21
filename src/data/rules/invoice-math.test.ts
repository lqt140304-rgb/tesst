import { describe, expect, it } from 'vitest';
import { cashChange, invoiceTotals, lineTotal, netLineTotals, paymentState } from './invoice-math';

describe('invoice maths', () => {
  it('computes line and invoice totals with a percent discount', () => {
    expect(lineTotal(150000, 3)).toBe(450000);
    expect(invoiceTotals([{ unit_price: 500000, qty: 2 }], { type: 'percent', value: 10 })).toEqual({ subtotal: 1000000, discountAmount: 100000, total: 900000 });
  });
  it('line totals round to whole đồng', () => {
    expect(lineTotal(150000, 0.3)).toBe(45000);
    expect(lineTotal(180000, 2.2)).toBe(396000);
    expect(lineTotal(12345, 0.1)).toBe(1235);
    expect(lineTotal(60000, 2)).toBe(120000);
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
  it('shares an invoice total over its lines and always adds up to the total', () => {
    expect(netLineTotals([100, 100, 100], 200)).toEqual([67, 66, 67]);
    expect(netLineTotals([150000, 50000], 200000)).toEqual([150000, 50000]);
    expect(netLineTotals([0, 0], 0)).toEqual([0, 0]);
    expect(netLineTotals([], 0)).toEqual([]);
    const parts = netLineTotals([45000, 12345, 99999, 1], 150000 - 10001);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(139999);
  });
});
