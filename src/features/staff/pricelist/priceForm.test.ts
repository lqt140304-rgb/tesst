import { describe, expect, it } from 'vitest';
import { formatVnd } from '@/lib/money';
import { fixedGroupNote, isDayItemCode, parseVnd, priceLabel, priceSummary, toPriceInput, type PriceFormValues } from './priceForm';

const form = (o: Partial<PriceFormValues> = {}): PriceFormValues => ({ category: 'spa', name: 'Cắt móng', unit: 'lần', mode: 'fixed', price: '80.000', reference: '', group: 'itemized', ...o });

describe('parseVnd', () => {
  it('reads whole amounts typed the usual ways', () => {
    expect(parseVnd('150000')).toBe(150000);
    expect(parseVnd('150.000')).toBe(150000);
    expect(parseVnd('150 000')).toBe(150000);
    expect(parseVnd('1.500.000')).toBe(1500000);
    expect(parseVnd('150000đ')).toBe(150000);
    expect(parseVnd(' 150.000 ₫ ')).toBe(150000);
    expect(parseVnd('1.500')).toBe(1500);
  });
  it('refuses everything else and never returns NaN', () => {
    for (const bad of ['', '   ', '0', '-5', '12,5', '12.5', '150.00', '1e6', 'abc', '1.5.000']) expect(parseVnd(bad)).toBeUndefined();
  });
});

describe('toPriceInput', () => {
  it('a fixed price sends the price and no reference', () => {
    expect(toPriceInput(form())).toEqual({ category: 'spa', name: 'Cắt móng', unit: 'lần', price_mode: 'fixed', price: 80000 });
  });
  it('an open price sends only the suggestion, and none when it is empty', () => {
    expect(toPriceInput(form({ mode: 'open', reference: '50.000' }))).toEqual({ category: 'spa', name: 'Cắt móng', unit: 'lần', price_mode: 'open', reference_price: 50000 });
    expect(toPriceInput(form({ mode: 'open', reference: '' }))).toEqual({ category: 'spa', name: 'Cắt móng', unit: 'lần', price_mode: 'open' });
  });
  it('only the exam group sends who sees the line', () => {
    expect(toPriceInput(form({ category: 'exam', group: 'treatment' })).customer_group).toBe('treatment');
    expect(toPriceInput(form({ category: 'medicine', group: 'treatment' }))).not.toHaveProperty('customer_group');
  });
  it('trims the name and unit', () => {
    expect(toPriceInput(form({ name: '  Cắt móng  ', unit: ' lần ' }))).toMatchObject({ name: 'Cắt móng', unit: 'lần' });
  });
  it('an unreadable price is left out so the API names the problem', () => {
    expect(toPriceInput(form({ price: 'abc' }))).not.toHaveProperty('price');
    expect(toPriceInput(form({ mode: 'open', reference: 'abc' }))).toMatchObject({ reference_price: 0 });
  });
});

describe('priceSummary and priceLabel', () => {
  it('summarises what is about to be saved', () => {
    expect(priceSummary(form())).toBe(`Cắt móng · ${formatVnd(80000)} / lần`);
    expect(priceSummary(form({ mode: 'open' }))).toBe('Cắt móng · nhập giá khi lập hóa đơn / lần');
    expect(priceSummary(form({ mode: 'open', reference: '50.000' }))).toBe(`Cắt móng · nhập giá khi lập hóa đơn / lần (gợi ý ${formatVnd(50000)})`);
  });
  it('labels the table cell', () => {
    expect(priceLabel({ price_mode: 'fixed', price: 150000 })).toEqual({ main: formatVnd(150000) });
    expect(priceLabel({ price_mode: 'open', price: 0, reference_price: 200000 })).toEqual({ main: 'Nhập khi lập hóa đơn', hint: `gợi ý ${formatVnd(200000)}` });
    expect(priceLabel({ price_mode: 'open', price: 0 })).toEqual({ main: 'Nhập khi lập hóa đơn' });
  });
});

describe('day items and group notes', () => {
  it('knows the three inpatient day items', () => {
    for (const c of ['LT01', 'LT02', 'LT03']) expect(isDayItemCode(c)).toBe(true);
    for (const c of ['LT04', 'KB01']) expect(isDayItemCode(c)).toBe(false);
  });
  it('says what the customer sees for the fixed groups', () => {
    expect(fixedGroupNote('medicine')).toBe('Khách thấy gộp trong “Thuốc và vật tư điều trị”.');
    expect(fixedGroupNote('supply')).toBe('Khách thấy gộp trong “Thuốc và vật tư điều trị”.');
    expect(fixedGroupNote('spa')).toBe('Khách thấy từng dòng.');
    expect(fixedGroupNote('inpatient')).toBe('Khách thấy từng dòng.');
    expect(fixedGroupNote('exam')).toBeUndefined();
  });
});
