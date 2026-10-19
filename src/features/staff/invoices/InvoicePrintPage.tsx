import { useParams } from 'react-router';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { staff } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { InvoiceSheet } from '@/features/shared/InvoiceSheet';
import { Button, Icon } from '@/ui';
import { toSheet } from './sheet';
import s from '@/features/shared/Print.module.css';

/** Staff print preview `#/nv/hoa-don/:id/ban-in` (staff §6.6): the customer's A5 sheet plus "Người lập" and the internal-document note. */
export function InvoicePrintPage() {
  const { id = '' } = useParams();
  const q = useQuery(() => staff.invoices.get(id), [id]);
  return (
    <main id="noi-dung" className={s.page}>
      <div className={s.bar} data-no-print>
        <AppLink to={paths.nv.invoice(id)} className={s.back}><Icon name="arrow-left" size={18} /> Quay lại hóa đơn</AppLink>
        <Button icon="printer" onClick={() => window.print()}>In</Button>
      </div>
      {__TARGET__ === 'artifact' && (
        <p className={s.note} data-no-print>Bản xem thử trên Claude chưa mở được hộp thoại in. Khi chạy trên máy của bệnh viện, nút này sẽ in trực tiếp.</p>
      )}
      {q.error ? <p className={s.note}>Không tìm thấy hóa đơn này.</p> : !q.data ? <p className={s.note}>Đang mở…</p> : q.data.status === 'draft' ? (
        <p className={s.note}>Hóa đơn nháp chưa in được. Bạn phát hành hóa đơn trước nhé.</p>
      ) : (
        <InvoiceSheet d={toSheet(q.data)} a5 className={s.a5} issuedBy={q.data.issuedByName ?? q.data.createdByName}
          footnote="Chứng từ nội bộ, không thay thế hóa đơn điện tử." />
      )}
    </main>
  );
}
