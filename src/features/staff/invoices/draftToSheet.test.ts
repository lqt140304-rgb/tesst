import { describe, expect, it } from 'vitest';
import { draftToSheet } from './draftToSheet';

const item = (over: object = {}) => ({ id: 'p1', name: 'Khám lâm sàng', unit: 'lần', price: 150000, price_mode: 'fixed' as const, customer_group: 'itemized' as const, ...over });
const d = { code: 'HD-1028', createdAt: '2026-10-21T08:00:00+07:00', customerName: 'Nguyễn Thị Lan', customerPhone: '+84973555105', petNames: ['Miu'] };

describe('draftToSheet', () => {
  it('totals match the editor and the code is marked as expected', () => {
    const s = draftToSheet(d, [{ key: 'a', item: item(), qty: 2 }], '');
    expect(s.total).toBe(300000);
    expect(s.subtotal).toBe(300000);
    expect(s.code).toBe('HD-1028 (Dự kiến)');
    expect(s.state).toBe('unpaid');
    expect(s.remaining).toBe(300000);
    expect(s.paid).toBe(0);
    expect(s.payments).toEqual([]);
  });
  it('uses the line price the person typed, not the list price, for a changed or open price', () => {
    const s = draftToSheet(d, [{ key: 'a', item: item({ price_mode: 'open', price: 0 }), qty: 2, unit_price: 225000 }], '');
    expect(s.total).toBe(450000);
    expect(s.lines[0]).toMatchObject({ qty: 2, unitPrice: 225000, total: 450000 });
  });
  it('folds treatment lines into one the way the customer will read them (R7)', () => {
    const s = draftToSheet(d, [
      { key: 'a', item: item(), qty: 1 },
      { key: 'b', item: item({ id: 'p2', name: 'Tiêm X', customer_group: 'treatment', price: 80000 }), qty: 1 },
      { key: 'c', item: item({ id: 'p3', name: 'Thuốc Y', customer_group: 'treatment', price: 20000 }), qty: 1 },
    ], '');
    expect(s.lines.map((l) => l.label)).toEqual(['Khám lâm sàng', 'Thuốc và vật tư điều trị']);
    expect(s.lines[1]!.total).toBe(100000);
    expect(s.total).toBe(250000);
  });
  it('an open-price line without a price counts as 0 and does not break the sheet', () => {
    const s = draftToSheet(d, [{ key: 'a', item: item({ price_mode: 'open', price: 0 }), qty: 1 }], '');
    expect(s.total).toBe(0);
  });
  it('carries the customer and the note, with the phone formatted', () => {
    const s = draftToSheet(d, [], 'Cảm ơn bạn');
    expect(s.customerName).toBe('Nguyễn Thị Lan');
    expect(s.phone).toBe('097 355 51 05');
    expect(s.note).toBe('Cảm ơn bạn');
    expect(s.petNames).toEqual(['Miu']);
    expect(s.lines).toEqual([]);
  });
});
