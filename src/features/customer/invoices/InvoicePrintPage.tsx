import { useParams } from 'react-router';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { customer } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { InvoiceSheet } from '@/features/shared/InvoiceSheet';
import { Button, Icon } from '@/ui';
import s from '@/features/shared/Print.module.css';

/** Print preview `#/khach-hang/hoa-don/:id/ban-in` (R21, tech §14): the same A5 sheet; "In" calls print() where it works. */
export function InvoicePrintPage() {
  const { id = '' } = useParams();
  const q = useQuery(() => customer.invoices.get(id), [id]);
  return (
    <main id="noi-dung" className={s.page}>
      <div className={s.bar} data-no-print>
        <AppLink to={paths.kh.invoice(id)} className={s.back}><Icon name="arrow-left" size={18} /> Quay lại hóa đơn</AppLink>
        <Button icon="printer" onClick={() => window.print()}>In</Button>
      </div>
      {__TARGET__ === 'artifact' && (
        <p className={s.note} data-no-print>Bản xem thử trên Claude chưa mở được hộp thoại in. Khi chạy trên máy của bệnh viện, nút này sẽ in trực tiếp.</p>
      )}
      {q.error ? <p className={s.note}>Không tìm thấy hóa đơn này.</p> : !q.data ? <p className={s.note}>Đang mở…</p> : (
        <InvoiceSheet d={{ ...q.data, phone: q.data.phoneMasked }} a5 className={s.a5} />
      )}
    </main>
  );
}
