import { describe, expect, it } from 'vitest';
import { formatKg, formatQty } from './units';

describe('formatKg (owner standard: decimal comma, no-break space before the unit)', () => {
  it('uses a comma and a no-break space', () => {
    expect(formatKg(4.2)).toBe('4,2\u00A0kg');
  });
  it('drops a trailing .0 and keeps one decimal at most', () => {
    expect(formatKg(12)).toBe('12\u00A0kg');
    expect(formatKg(5.5)).toBe('5,5\u00A0kg');
    expect(formatKg(4.25)).toBe('4,3\u00A0kg');
  });
});

describe('formatQty (a quantity on an invoice line: decimal comma, up to two decimals)', () => {
  it('writes whole numbers plainly and fractions with a comma', () => {
    expect(formatQty(2)).toBe('2');
    expect(formatQty(0.1)).toBe('0,1');
    expect(formatQty(2.2)).toBe('2,2');
    expect(formatQty(1.25)).toBe('1,25');
  });
});
