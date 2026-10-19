import { TREATMENT_LINE_LABEL, type CustomerGroup } from '../contracts/enums';

export type CustomerLine = { label: string; qty: number | null; unitPrice: number | null; total: number; note?: string };

/** What a customer reads on an invoice (R7): itemized lines as they are, every treatment line folded into one. */
export function customerLines(lines: { name: string; qty: number; unit_price: number; line_total: number; customer_group: CustomerGroup }[]): CustomerLine[] {
  const out: CustomerLine[] = lines.filter((l) => l.customer_group === 'itemized').map((l) => ({ label: l.name, qty: l.qty, unitPrice: l.unit_price, total: l.line_total }));
  const treatment = lines.filter((l) => l.customer_group === 'treatment').reduce((s, l) => s + l.line_total, 0);
  if (treatment > 0) out.push({ label: TREATMENT_LINE_LABEL, qty: null, unitPrice: null, total: treatment, note: 'Nhân viên sẽ giải thích chi tiết khi bạn cần.' });
  return out;
}
