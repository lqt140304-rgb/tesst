import type { CustomerGroup, PriceCategory } from '@/data/contracts/enums';
import { TREATMENT_LINE_LABEL } from '@/data/contracts/enums';
import type { PriceInput, StaffPriceItem } from '@/data/staff';
import { DAY_ITEM_CODES } from '@/data/rules/stay-billing';
import { formatVnd } from '@/lib/money';

export type PriceFormValues = { category: PriceCategory; name: string; unit: string; mode: 'fixed' | 'open'; price: string; reference: string; group: CustomerGroup };

/** A whole amount typed the usual ways ("150.000", "150 000", "150000đ"); anything else is `undefined`, never NaN. A dot is a thousands mark, so it needs groups of three digits. */
export function parseVnd(raw: string): number | undefined {
  const s = raw.replace(/\s+/g, '').replace(/[đ₫]$/i, '');
  if (!/^\d+$/.test(s) && !/^\d{1,3}(\.\d{3})+$/.test(s)) return undefined;
  const n = Number(s.replace(/\./g, ''));
  return n >= 1 ? n : undefined;
}

/** The API input for the form. An unreadable price is left out and an unreadable suggestion is sent as 0, so the API names the problem under the right field. */
export function toPriceInput(v: PriceFormValues): PriceInput {
  const input: PriceInput = { category: v.category, name: v.name.trim(), unit: v.unit.trim(), price_mode: v.mode };
  if (v.mode === 'fixed') {
    const price = parseVnd(v.price);
    if (price !== undefined) input.price = price;
  } else if (v.reference.trim()) input.reference_price = parseVnd(v.reference) ?? 0;
  if (v.category === 'exam') input.customer_group = v.group;
  return input;
}

export function priceSummary(v: PriceFormValues): string {
  const price = v.mode === 'fixed' ? formatVnd(parseVnd(v.price) ?? 0) : 'nhập giá khi lập hóa đơn';
  const ref = v.mode === 'open' && parseVnd(v.reference) ? ` (gợi ý ${formatVnd(parseVnd(v.reference)!)})` : '';
  return `${v.name.trim()} · ${price} / ${v.unit.trim()}${ref}`;
}

export function priceLabel(item: Pick<StaffPriceItem, 'price_mode' | 'price' | 'reference_price'>): { main: string; hint?: string } {
  if (item.price_mode === 'fixed') return { main: formatVnd(item.price) };
  return item.reference_price ? { main: 'Nhập khi lập hóa đơn', hint: `gợi ý ${formatVnd(item.reference_price)}` } : { main: 'Nhập khi lập hóa đơn' };
}

export const isDayItemCode = (code: string) => (DAY_ITEM_CODES as readonly string[]).includes(code);

/** What customers see for groups that are not a choice (R7). The exam group is a choice, so no note. */
export function fixedGroupNote(category: PriceCategory): string | undefined {
  if (category === 'medicine' || category === 'supply') return `Khách thấy gộp trong “${TREATMENT_LINE_LABEL}”.`;
  if (category === 'spa' || category === 'inpatient') return 'Khách thấy từng dòng.';
  return undefined;
}
