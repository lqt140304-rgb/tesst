import { describe, expect, it } from 'vitest';
import type { StockMoveRow, StockRow, StockSummary } from '@/data/staff';
import {
  DEFAULT_FILTERS, adjustDiff, expiryLabel, issuePreview, levelLabel, levelTone, moveDelta, qtyText, readFilters, receivePreview, statusSentence,
  stockCaps, tileCount, tileLabel, tilePressed, toListFilter, writeFilters, type StockFilters,
} from './stockView';

const TODAY = '2026-10-22';
const row = (o: Partial<StockRow> = {}): StockRow => ({
  id: 's1', code: 'KHO-0001', name: 'Nước muối', kind: 'thuoc', unit: 'chai', qty: 25, minQty: 10, active: true, level: 'ok', expiry: 'none', version: 1, ...o,
});

describe('filters in the address', () => {
  it('reads the defaults from an empty address and ignores values it does not know', () => {
    expect(readFilters(new URLSearchParams(''))).toEqual(DEFAULT_FILTERS);
    expect(readFilters(new URLSearchParams('tt=abc&loai=x&ngung=2'))).toEqual(DEFAULT_FILTERS);
  });
  it('writes only what differs from the defaults', () => {
    expect(writeFilters(DEFAULT_FILTERS).toString()).toBe('');
    expect(writeFilters({ ...DEFAULT_FILTERS, q: '   ' }).toString()).toBe('');
  });
  it('round-trips every filter', () => {
    const f: StockFilters = { q: 'gạc', kind: 'vat_tu', status: 'low', showInactive: true };
    expect(readFilters(writeFilters(f))).toEqual(f);
    for (const status of ['low', 'out', 'expiring'] as const) expect(readFilters(writeFilters({ ...DEFAULT_FILTERS, status })).status).toBe(status);
    expect(readFilters(writeFilters({ ...DEFAULT_FILTERS, kind: 'thuoc' })).kind).toBe('thuoc');
  });
  it('turns the filters into the API filter, leaving out what is "all" or blank', () => {
    expect(toListFilter(DEFAULT_FILTERS)).toEqual({});
    expect(toListFilter({ q: '  gạc ', kind: 'vat_tu', status: 'out', showInactive: true })).toEqual({ q: 'gạc', kind: 'vat_tu', status: 'out', includeInactive: true });
    expect(toListFilter({ ...DEFAULT_FILTERS, q: '   ' })).toEqual({});
  });
});

describe('summary tiles', () => {
  const sum: StockSummary = { total: 13, low: 3, out: 1, expiringSoon: 1, expired: 1 };
  it('counts and labels each tile for a screen reader', () => {
    expect(tileCount(sum, 'low')).toBe(3);
    expect(tileCount(sum, 'soon')).toBe(1);
    expect(tileLabel(sum, 'low')).toBe('Sắp hết: 3 món');
    expect(tileLabel(sum, 'out')).toBe('Hết hàng: 1 món');
    expect(tileLabel(sum, 'soon')).toBe('Sắp hết hạn: 1 món');
    expect(tileLabel(sum, 'expired')).toBe('Đã hết hạn: 1 món');
  });
  it('presses both expiry tiles when the expiry filter is on', () => {
    const f: StockFilters = { ...DEFAULT_FILTERS, status: 'expiring' };
    expect(tilePressed(f, 'soon')).toBe(true);
    expect(tilePressed(f, 'expired')).toBe(true);
    expect(tilePressed(f, 'low')).toBe(false);
    expect(tilePressed(DEFAULT_FILTERS, 'low')).toBe(false);
  });
});

describe('labels', () => {
  it('names the level and expiry in plain words', () => {
    expect([levelLabel('ok'), levelLabel('low'), levelLabel('out')]).toEqual(['Ổn', 'Sắp hết', 'Hết hàng']);
    expect([levelTone('ok'), levelTone('low'), levelTone('out')]).toEqual(['teal', 'orange', 'rose']);
    expect([expiryLabel('none'), expiryLabel('soon'), expiryLabel('expired')]).toEqual([undefined, 'Sắp hết hạn', 'Đã hết hạn']);
  });
  it('writes a quantity with its unit and thousands dots', () => {
    expect(qtyText(25, 'chai')).toBe('25 chai');
    expect(qtyText(1000, 'cái')).toBe('1.000 cái');
  });
});

describe('statusSentence', () => {
  it('says nothing for a healthy item with no expiry', () => {
    expect(statusSentence(row(), TODAY)).toBeUndefined();
  });
  it('explains out of stock and low stock', () => {
    expect(statusSentence(row({ qty: 0, level: 'out' }), TODAY)).toBe('Đã hết hàng.');
    expect(statusSentence(row({ qty: 3, unit: 'hộp', minQty: 5, level: 'low' }), TODAY)).toBe('Còn 3 hộp, thấp hơn mức báo hết 5.');
    expect(statusSentence(row({ qty: 5, unit: 'hộp', minQty: 5, level: 'low' }), TODAY)).toBe('Còn 5 hộp, bằng mức báo hết 5.');
  });
  it('a warning level of 0 never says "low", but out of stock is still out', () => {
    expect(statusSentence(row({ qty: 3, minQty: 0, level: 'ok' }), TODAY)).toBeUndefined();
    expect(statusSentence(row({ qty: 0, minQty: 0, level: 'out' }), TODAY)).toBe('Đã hết hàng.');
  });
  it('explains the expiry on its edges: yesterday, today, a month away', () => {
    expect(statusSentence(row({ expiresOn: '2026-10-21', expiry: 'expired' }), TODAY)).toBe('Hết hạn từ 21/10/2026.');
    expect(statusSentence(row({ expiresOn: '2026-10-22', expiry: 'soon' }), TODAY)).toBe('Hết hạn hôm nay.');
    expect(statusSentence(row({ expiresOn: '2026-11-21', expiry: 'soon' }), TODAY)).toBe('Còn 30 ngày nữa hết hạn.');
    expect(statusSentence(row({ expiresOn: '2027-03-01', expiry: 'none' }), TODAY)).toBeUndefined();
  });
  it('joins the stock sentence and the expiry sentence', () => {
    expect(statusSentence(row({ qty: 5, unit: 'chai', minQty: 5, level: 'low', expiresOn: '2026-10-12', expiry: 'expired' }), TODAY))
      .toBe('Còn 5 chai, bằng mức báo hết 5. Hết hạn từ 12/10/2026.');
  });
});

describe('moves, previews and the count difference', () => {
  const move = (delta: number): StockMoveRow => ({ id: 'm', kind: delta > 0 ? 'in' : 'out', delta, qtyAfter: 10, reason: 'nhap_hang', at: '2026-10-22T09:00:00+07:00', byName: 'Hà' });
  it('shows the change with a sign (a real minus, not a hyphen)', () => {
    expect(moveDelta(move(30))).toEqual({ text: '+30', tone: 'in' });
    expect(moveDelta(move(-8))).toEqual({ text: '−8', tone: 'out' });
  });
  it('previews the stock after receiving or issuing, and nothing for a number that is not valid', () => {
    expect(receivePreview(25, 30, 'chai')).toBe('Tồn sau khi nhập: 55 chai');
    expect(receivePreview(25, undefined, 'chai')).toBeUndefined();
    expect(receivePreview(25, 0, 'chai')).toBeUndefined();
    expect(issuePreview(25, 8, 'chai')).toBe('Tồn sau khi xuất: 17 chai');
    expect(issuePreview(25, 30, 'chai')).toBeUndefined();
    expect(issuePreview(25, 25, 'chai')).toBe('Tồn sau khi xuất: 0 chai');
  });
  it('shows how far the count is from the book', () => {
    expect(adjustDiff(20, 18, 'chai')).toEqual({ text: 'Lệch −2 chai so với sổ.', tone: 'down' });
    expect(adjustDiff(20, 23, 'chai')).toEqual({ text: 'Lệch +3 chai so với sổ.', tone: 'up' });
    expect(adjustDiff(20, 20, 'chai')).toEqual({ text: 'Khớp sổ.', tone: 'same' });
    expect(adjustDiff(20, undefined, 'chai')).toBeUndefined();
  });
});

describe('stockCaps', () => {
  const only = (...caps: string[]) => (c: string | string[]) => (Array.isArray(c) ? c : [c]).some((x) => caps.includes(x));
  it('writing needs both the manage and the view capability', () => {
    expect(stockCaps(only('stock.view', 'stock.manage'))).toEqual({ view: true, manage: true });
    expect(stockCaps(only('stock.view'))).toEqual({ view: true, manage: false });
    expect(stockCaps(only('stock.manage'))).toEqual({ view: false, manage: false });
    expect(stockCaps(only())).toEqual({ view: false, manage: false });
  });
});
