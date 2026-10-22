import { describe, expect, it } from 'vitest';
import { STOCK_MSG } from '@/data/rules/stock';
import type { StockRow } from '@/data/staff';
import {
  adjustErrors, issueErrors, itemErrors, parseQty, receiveErrors, suggestedMin, toAdjustInput, toIssueInput, toReceiveInput, toStockInput, valuesOf,
  type AdjustFormValues, type IssueFormValues, type ItemFormValues, type ReceiveFormValues,
} from './stockForm';

const item = (o: Partial<ItemFormValues> = {}): ItemFormValues => ({ name: 'Gạc vô trùng', kind: 'vat_tu', unit: 'gói', qty: '40', minQty: '10', expiresOn: '', ...o });
const receive = (o: Partial<ReceiveFormValues> = {}): ReceiveFormValues => ({ qty: '30', supplier: '', note: '', expiresOn: '', ...o });
const issue = (o: Partial<IssueFormValues> = {}): IssueFormValues => ({ qty: '8', reason: 'dung_tai_phong', note: '', ...o });
const adjust = (o: Partial<AdjustFormValues> = {}): AdjustFormValues => ({ counted: '18', note: '', ...o });

describe('parseQty', () => {
  it('reads whole numbers typed the usual ways', () => {
    expect(parseQty('25')).toBe(25);
    expect(parseQty(' 25 ')).toBe(25);
    expect(parseQty('1.000')).toBe(1000);
    expect(parseQty('1.000.000')).toBe(1000000);
    expect(parseQty('0')).toBe(0);
  });
  it('never returns NaN, a fraction or a negative: anything else is undefined', () => {
    for (const bad of ['', '   ', '2,5', '2.5', '-3', '1e3', 'abc', '1.00', '1.0000', '12abc']) expect(parseQty(bad), bad).toBeUndefined();
  });
});

describe('toStockInput', () => {
  it('sends the starting quantity only when creating', () => {
    expect(toStockInput(item(), 'create')).toMatchObject({ name: 'Gạc vô trùng', kind: 'vat_tu', unit: 'gói', qty: 40, min_qty: 10 });
    expect('qty' in toStockInput(item(), 'update')).toBe(false);
  });
  it('trims the text and sends an empty expiry as "" (no expiry)', () => {
    const input = toStockInput(item({ name: '  Gạc ', unit: ' gói ', expiresOn: '' }), 'create');
    expect(input.name).toBe('Gạc');
    expect(input.unit).toBe('gói');
    expect(input.expires_on).toBe('');
  });
  it('sends NaN for a number it cannot read, so the rules name the right field', () => {
    expect(Number.isNaN(toStockInput(item({ minQty: 'abc' }), 'create').min_qty)).toBe(true);
    expect(itemErrors(item({ minQty: 'abc' }), 'create').min_qty).toBe(STOCK_MSG.minQty);
    expect(itemErrors(item({ qty: '2,5' }), 'create').qty).toBe(STOCK_MSG.qty);
  });
  it('carries active only when given', () => {
    expect(toStockInput(item(), 'update', false).active).toBe(false);
    expect('active' in toStockInput(item(), 'update')).toBe(false);
  });
  it('reports a bad expiry, empty name and empty unit with the rules\' sentences', () => {
    expect(itemErrors(item({ name: ' ', unit: '', expiresOn: '31/03/2027' }), 'create')).toEqual({
      name: STOCK_MSG.name, unit: STOCK_MSG.unit, expires_on: STOCK_MSG.expires,
    });
    expect(itemErrors(item(), 'create')).toEqual({});
  });
});

describe('receive, issue and adjust', () => {
  it('leaves empty optional text out of the input', () => {
    expect(toReceiveInput(receive())).toEqual({ qty: 30 });
    expect(toReceiveInput(receive({ supplier: ' Công ty mẫu ', note: 'đợt 2', expiresOn: '2030-01-01' }))).toEqual({
      qty: 30, supplier: 'Công ty mẫu', note: 'đợt 2', expires_on: '2030-01-01',
    });
    expect(toIssueInput(issue())).toEqual({ qty: 8, reason: 'dung_tai_phong' });
    expect(toAdjustInput(adjust({ note: 'cuối tuần' }))).toEqual({ counted_qty: 18, note: 'cuối tuần' });
  });
  it('receive: 0, unreadable and over-large numbers get the rules\' sentences', () => {
    expect(receiveErrors(receive({ qty: '0' }), { qty: 5 }).qty).toBe(STOCK_MSG.moveQty);
    expect(receiveErrors(receive({ qty: 'abc' }), { qty: 5 }).qty).toBe(STOCK_MSG.moveQty);
    expect(receiveErrors(receive({ qty: '1.000.001' }), { qty: 5 }).qty).toBe(STOCK_MSG.moveQty);
    expect(receiveErrors(receive({ qty: '999.999' }), { qty: 25 }).qty).toBe(STOCK_MSG.tooMany);
    expect(receiveErrors(receive({ note: 'x'.repeat(201) }), { qty: 5 }).note).toBe(STOCK_MSG.noteLong);
    expect(receiveErrors(receive(), { qty: 5 })).toEqual({});
  });
  it('issue: more than on hand says how much is left; exactly all of it is fine', () => {
    expect(issueErrors(issue({ qty: '30' }), { qty: 25, unit: 'chai' }).qty).toBe('Kho chỉ còn 25 chai.');
    expect(issueErrors(issue({ qty: '25' }), { qty: 25, unit: 'chai' })).toEqual({});
  });
  it('adjust: same as on hand and unreadable are errors; zero is a real count', () => {
    expect(adjustErrors(adjust({ counted: '5' }), { qty: 5 }).counted_qty).toBe(STOCK_MSG.countedSame);
    expect(adjustErrors(adjust({ counted: 'abc' }), { qty: 5 }).counted_qty).toBe(STOCK_MSG.counted);
    expect(adjustErrors(adjust({ counted: '0' }), { qty: 5 })).toEqual({});
  });
});

describe('suggestedMin', () => {
  it('uses the system setting when it is a whole number >= 0, else 5', () => {
    expect(suggestedMin(5)).toBe('5');
    expect(suggestedMin(0)).toBe('0');
    expect(suggestedMin(12)).toBe('12');
    for (const bad of [undefined, -1, 2.5, Number.NaN]) expect(suggestedMin(bad)).toBe('5');
  });
});

describe('valuesOf', () => {
  const row: StockRow = { id: 's', code: 'KHO-0001', name: 'Gạc', kind: 'vat_tu', unit: 'gói', qty: 42, minQty: 20, expiresOn: '2027-03-31', active: true, level: 'ok', expiry: 'none', version: 3 };
  it('turns an item back into form values, so a switch-off sends everything else unchanged', () => {
    expect(valuesOf(row)).toEqual({ name: 'Gạc', kind: 'vat_tu', unit: 'gói', qty: '0', minQty: '20', expiresOn: '2027-03-31' });
    expect(valuesOf({ ...row, expiresOn: undefined, minQty: 0 })).toMatchObject({ minQty: '0', expiresOn: '' });
    expect(toStockInput(valuesOf(row), 'update', false)).toEqual({ name: 'Gạc', kind: 'vat_tu', unit: 'gói', min_qty: 20, expires_on: '2027-03-31', active: false });
  });
});
