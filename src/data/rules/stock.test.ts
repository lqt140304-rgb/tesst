import { describe, expect, it } from 'vitest';
import { STOCK_MSG, expiryState, isRealDate, mergeExpiry, stockLevel, validateAdjust, validateIssue, validateReceive, validateStockInput } from './stock';

describe('stockLevel', () => {
  it('out at zero, low at or under the threshold, ok above', () => {
    expect(stockLevel({ qty: 0, min_qty: 5 })).toBe('out');
    expect(stockLevel({ qty: 5, min_qty: 5 })).toBe('low');
    expect(stockLevel({ qty: 6, min_qty: 5 })).toBe('ok');
  });
  it('a zero threshold never says low, but zero stock is still out', () => {
    expect(stockLevel({ qty: 1, min_qty: 0 })).toBe('ok');
    expect(stockLevel({ qty: 0, min_qty: 0 })).toBe('out');
  });
});

describe('isRealDate', () => {
  it.each([['2026-02-30', false], ['2026-13-01', false], ['26-1-1', false], ['2026-02-29', false], ['2028-02-29', true], ['2026-10-19', true]])('%s → %s', (s, want) => {
    expect(isRealDate(s)).toBe(want);
  });
});

describe('expiryState (today 2026-10-19, 30 days)', () => {
  it.each([[undefined, 'none'], ['2026-10-18', 'expired'], ['2026-10-19', 'soon'], ['2026-11-18', 'soon'], ['2026-11-19', 'none']])('%s → %s', (d, want) => {
    expect(expiryState(d, '2026-10-19', 30)).toBe(want);
  });
});

describe('mergeExpiry (today 2026-10-19)', () => {
  it('keeps the earlier of two future dates', () => {
    expect(mergeExpiry('2026-12-01', '2027-03-01', '2026-10-19')).toBe('2026-12-01');
    expect(mergeExpiry('2026-12-01', '2026-11-01', '2026-10-19')).toBe('2026-11-01');
  });
  it('takes the new date when the old one is missing or already past; today is not past', () => {
    expect(mergeExpiry(undefined, '2027-01-01', '2026-10-19')).toBe('2027-01-01');
    expect(mergeExpiry('2026-10-18', '2027-01-01', '2026-10-19')).toBe('2027-01-01');
    expect(mergeExpiry('2026-10-19', '2027-01-01', '2026-10-19')).toBe('2026-10-19');
  });
  it('keeps the old date when no new one is given', () => {
    expect(mergeExpiry('2026-12-01', undefined, '2026-10-19')).toBe('2026-12-01');
  });
});

describe('validateStockInput', () => {
  const ok = { name: 'Gạc', kind: 'vat_tu', unit: 'gói', qty: 0, min_qty: 3 } as const;
  it('accepts a good input; spaces around name and unit are ignored', () => {
    expect(validateStockInput(ok, 'create')).toEqual({});
    expect(validateStockInput({ ...ok, name: '  ', unit: ' ' }, 'create')).toEqual({ name: STOCK_MSG.name, unit: STOCK_MSG.unit });
  });
  it('rejects over-long text and a wrong kind', () => {
    expect(validateStockInput({ ...ok, name: 'x'.repeat(81) }, 'create').name).toBe(STOCK_MSG.nameLong);
    expect(validateStockInput({ ...ok, unit: 'x'.repeat(21) }, 'create').unit).toBe(STOCK_MSG.unitLong);
    expect(validateStockInput({ ...ok, kind: 'khac' as never }, 'create').kind).toBe(STOCK_MSG.kind);
  });
  it.each([-1, 1.5, NaN, Infinity, 1_000_001, '5' as never])('qty %s is refused on create', (qty) => {
    expect(validateStockInput({ ...ok, qty }, 'create').qty).toBe(STOCK_MSG.qty);
  });
  it.each([-1, 1.5, NaN, 1_000_001])('min_qty %s is refused', (min_qty) => {
    expect(validateStockInput({ ...ok, min_qty }, 'create').min_qty).toBe(STOCK_MSG.minQty);
  });
  it('refuses impossible dates; accepts a missing date', () => {
    for (const expires_on of ['2026-02-30', '2026-13-01', '26-1-1']) expect(validateStockInput({ ...ok, expires_on }, 'create').expires_on).toBe(STOCK_MSG.expires);
    expect(validateStockInput(ok, 'create').expires_on).toBeUndefined();
  });
  it('an empty date box means no expiry, so a cleared date input is not an error', () => {
    expect(validateStockInput({ ...ok, expires_on: '' }, 'create').expires_on).toBeUndefined();
    expect(validateStockInput({ ...ok, expires_on: '' }, 'update').expires_on).toBeUndefined();
    expect(validateReceive({ qty: 1, expires_on: '' }, { qty: 0 }).expires_on).toBeUndefined();
  });
  it('an update may not carry a stock figure', () => {
    expect(validateStockInput({ ...ok, qty: 5 }, 'update').qty).toBe(STOCK_MSG.qtyLocked);
  });
});

describe('movements', () => {
  it.each([0, -1, 1.5, NaN, 1_000_001])('receive qty %s is refused', (qty) => {
    expect(validateReceive({ qty }, { qty: 0 }).qty).toBe(STOCK_MSG.moveQty);
  });
  it('receive may not push the stock past the maximum', () => {
    expect(validateReceive({ qty: 2 }, { qty: 999_999 }).qty).toBe(STOCK_MSG.tooMany);
  });
  it('issue: reason must be one of the four, qty within stock', () => {
    expect(validateIssue({ qty: 3, reason: 'nhap_hang' as never }, { qty: 5, unit: 'chai' }).reason).toBe(STOCK_MSG.issueReason);
    expect(validateIssue({ qty: 6, reason: 'hu_hong' }, { qty: 5, unit: 'chai' }).qty).toBe('Kho chỉ còn 5 chai.');
    expect(validateIssue({ qty: 5, reason: 'hu_hong' }, { qty: 5, unit: 'chai' })).toEqual({});
  });
  it('adjust: a count equal to the stock is refused; a negative count too', () => {
    expect(validateAdjust({ counted_qty: 5 }, { qty: 5 }).counted_qty).toBe(STOCK_MSG.countedSame);
    expect(validateAdjust({ counted_qty: -1 }, { qty: 5 }).counted_qty).toBe(STOCK_MSG.counted);
    expect(validateAdjust({ counted_qty: 0 }, { qty: 5 })).toEqual({});
  });
  it.each([[1e9], ['3' as never]])('issue and adjust refuse a huge or non-numeric quantity (%s)', (qty) => {
    expect(validateIssue({ qty, reason: 'khac' }, { qty: 5, unit: 'cái' }).qty).toBe(STOCK_MSG.moveQty);
    expect(validateAdjust({ counted_qty: qty }, { qty: 5 }).counted_qty).toBe(STOCK_MSG.counted);
  });
  it('supplier and note length', () => {
    expect(validateReceive({ qty: 1, supplier: 'x'.repeat(81) }, { qty: 0 }).supplier).toBe(STOCK_MSG.supplierLong);
    expect(validateIssue({ qty: 1, reason: 'khac', note: 'x'.repeat(201) }, { qty: 5, unit: 'cái' }).note).toBe(STOCK_MSG.noteLong);
  });
});
