import { customerLines } from '@/data/rules/invoice-lines';
import { invoiceTotals } from '@/data/rules/invoice-math';
import { formatPhoneVi } from '@/lib/phone';
import type { InvoiceSheetData } from '@/features/shared/InvoiceSheet';
import type { Line } from './draft-lines';

/** An unsaved draft as the customer will read it once issued (R7 grouping, counter payment); the number is a placeholder until then. */
export function draftToSheet(d: { code: string; createdAt: string; customerName: string; customerPhone: string; petNames: string[] }, lines: Line[], note: string): InvoiceSheetData {
  // An open-price line without a typed price counts as 0, the same as the editor's total.
  const priced = lines.map((l) => ({ l, unit: l.item.price_mode === 'open' ? l.unit_price ?? 0 : l.unit_price ?? l.item.price }));
  const { subtotal, total } = invoiceTotals(priced.map(({ l, unit }) => ({ unit_price: unit, qty: l.qty })));
  return {
    code: `${d.code} (Dự kiến)`, issuedAt: d.createdAt, customerName: d.customerName, phone: formatPhoneVi(d.customerPhone), petNames: d.petNames,
    lines: customerLines(priced.map(({ l, unit }) => ({ name: l.item.name, qty: l.qty, unit_price: unit, line_total: unit * l.qty, customer_group: l.item.customer_group }))),
    subtotal, total, paid: 0, remaining: total, state: 'unpaid', payments: [], note: note.trim() || undefined,
  };
}
