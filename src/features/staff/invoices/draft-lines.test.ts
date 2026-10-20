import { describe, expect, it } from 'vitest';
import type { StaffInvoiceDetail } from '@/data/contracts/staff';
import { draftInput, linesOf } from './draft-lines';

const line = (x: Partial<StaffInvoiceDetail['lines'][number]>): StaffInvoiceDetail['lines'][number] => ({
  id: 'l1', price_item_id: 'pi-KB01', code: 'KB01', name: 'Khám lâm sàng', unit: 'lần', unit_price: 150000, qty: 1, line_total: 150000,
  category: 'exam', customer_group: 'itemized', price_mode: 'fixed', ...x,
});

describe('draft editor lines (F01)', () => {
  it('a reopened open-price line stays editable and keeps its price and pet', () => {
    const [l] = linesOf({ lines: [line({ price_item_id: 'pi-KB09', code: 'KB09', unit_price: 123000, line_total: 123000, price_mode: 'open', pet_id: 'pet-miu' })] } as StaffInvoiceDetail);
    expect(l!.item.price_mode).toBe('open');
    expect(l!.unit_price).toBe(123000);
    expect(draftInput([l!])).toEqual([{ price_item_id: 'pi-KB09', qty: 1, unit_price: 123000, pet_id: 'pet-miu' }]);
  });

  it('a fixed-price line stays fixed', () => {
    const [l] = linesOf({ lines: [line({ pet_id: 'pet-kem' })] } as StaffInvoiceDetail);
    expect(l!.item.price_mode).toBe('fixed');
    expect(draftInput([l!])[0]).toMatchObject({ pet_id: 'pet-kem', unit_price: 150000 });
  });
});
