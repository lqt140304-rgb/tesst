import { describe, expect, it } from 'vitest';
import { customerLines } from './invoice-lines';

describe('customerLines (R7)', () => {
  it('keeps itemized lines and folds treatment lines into one "Thuốc và vật tư điều trị" line', () => {
    const out = customerLines([
      { name: 'Nội trú mèo', qty: 2, unit_price: 150000, line_total: 300000, customer_group: 'itemized' },
      { name: 'Truyền dịch', qty: 4, unit_price: 120000, line_total: 480000, customer_group: 'treatment' },
      { name: 'Giảm đau đường uống', qty: 4, unit_price: 12000, line_total: 48000, customer_group: 'treatment' },
    ]);
    expect(out).toEqual([
      { label: 'Nội trú mèo', qty: 2, unitPrice: 150000, total: 300000 },
      { label: 'Thuốc và vật tư điều trị', qty: null, unitPrice: null, total: 528000, note: 'Nhân viên sẽ giải thích chi tiết khi bạn cần.' },
    ]);
    expect(JSON.stringify(out)).not.toContain('Truyền dịch');
  });

  it('adds no treatment line when there is none', () => {
    expect(customerLines([{ name: 'Khám lâm sàng', qty: 1, unit_price: 150000, line_total: 150000, customer_group: 'itemized' }])).toHaveLength(1);
  });
});
