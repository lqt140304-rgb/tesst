import type { DraftLineInput, StaffInvoiceDetail, StaffPriceItem } from '@/data/staff';

export type Line = { key: string; item: Pick<StaffPriceItem, 'id' | 'name' | 'unit' | 'price' | 'price_mode'>; qty: number; unit_price?: number; pet_id?: string };

/** Editor lines from a saved draft. Keeps each line's price mode and pet, so a reopened open-price line stays editable (F01). */
export const linesOf = (x: Pick<StaffInvoiceDetail, 'lines'>): Line[] => x.lines.map((l) => ({
  key: l.id, qty: l.qty, unit_price: l.unit_price, pet_id: l.pet_id,
  item: { id: l.price_item_id, name: l.name, unit: l.unit, price: l.unit_price, price_mode: l.price_mode },
}));

export const draftInput = (lines: Line[]): DraftLineInput[] =>
  lines.map((l) => ({ price_item_id: l.item.id, qty: l.qty, unit_price: l.unit_price, ...(l.pet_id ? { pet_id: l.pet_id } : {}) }));
