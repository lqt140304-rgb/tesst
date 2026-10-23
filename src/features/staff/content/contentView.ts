import { FEATURED_MAX } from '@/data/rules/content';
import { formatDateVi } from '@/lib/dates';
import { whenText } from '../requests/inquiryWhen';

export type ContentTab = 'san-pham' | 'cau-chuyen';

export const contentTab = (raw: string | null): ContentTab => (raw === 'cau-chuyen' ? 'cau-chuyen' : 'san-pham');

/** Hidden items count too: the limit is on stored items, not on shown ones. */
export const usedText = (used: number, max: number = FEATURED_MAX) => `Đã dùng ${used}/${max} mục`;

const validTime = (iso: string) => !Number.isNaN(Date.parse(iso));

export function consentLine(row: { consentByName: string; consentAt: string }): string {
  const base = `Chủ nuôi đồng ý: ${row.consentByName}`;
  return validTime(row.consentAt) ? `${base}, ${formatDateVi(row.consentAt)}` : base;
}

export function updatedLine(row: { updatedByName: string; updatedAt: string }): string {
  const when = whenText(row.updatedAt);
  return when ? `${row.updatedByName} · ${when}` : row.updatedByName;
}

// Same numbers as the data rules; shown as counters and used for maxLength.
export const PRODUCT_LIMITS = { name: 60, note: 120 } as const;
export const CASE_LIMITS = { title: 80, story: 600, petName: 30 } as const;
