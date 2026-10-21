import { InvoiceSheet } from '@/features/shared/InvoiceSheet';
import type { StaffInvoiceDetail } from '@/data/staff';
import { draftToSheet } from './draftToSheet';
import type { Line } from './draft-lines';
import s from './Invoices.module.css';

/** "Xem trước hóa đơn": the draft as the customer will see it, updated on every edit (no server call). */
export function InvoicePreview({ d, lines, note }: { d: Pick<StaffInvoiceDetail, 'code' | 'created_at' | 'customerName' | 'customerPhone' | 'petNames'>; lines: Line[]; note: string }) {
  if (lines.length === 0) return <p className={s.previewEmpty} data-invoice-preview>Chưa có dịch vụ nào. Thêm dịch vụ để xem hóa đơn.</p>;
  return (
    <div className={s.previewSheet} data-invoice-preview>
      <InvoiceSheet d={draftToSheet({ code: d.code, createdAt: d.created_at, customerName: d.customerName, customerPhone: d.customerPhone, petNames: d.petNames }, lines, note)} />
    </div>
  );
}
