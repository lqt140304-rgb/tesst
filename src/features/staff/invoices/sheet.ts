import type { StaffInvoiceDetail } from '@/data/staff';
import { PAYMENT_METHOD_LABEL } from '@/data/contracts/enums';
import { customerLines } from '@/data/rules/invoice-lines';
import { formatDateVi } from '@/lib/dates';
import { formatPhoneVi } from '@/lib/phone';
import type { InvoiceSheetData } from '@/features/shared/InvoiceSheet';

/** The customer's view of a staff invoice (R7 grouping): used by "Khách sẽ thấy" and the A5 print. */
export function toSheet(d: StaffInvoiceDetail): InvoiceSheetData {
  return {
    code: d.code, issuedAt: d.issued_at ?? d.created_at, customerName: d.customerName, phone: formatPhoneVi(d.customerPhone), petNames: d.petNames,
    lines: customerLines(d.lines.map((l) => ({ name: l.name, qty: l.qty, unit_price: l.unit_price, line_total: l.line_total, customer_group: l.customer_group }))),
    subtotal: d.subtotal, discount: d.discount ? { label: 'Giảm giá', amount: d.discount.amount } : undefined, total: d.total, paid: d.paid,
    remaining: d.remaining, state: d.state ?? 'unpaid', note: d.note_customer,
    payments: d.payments.filter((p) => !p.reversed_at).map((p) => ({ dateLabel: formatDateVi(p.received_at), methodLabel: PAYMENT_METHOD_LABEL[p.method] })),
  };
}
