import { useSearchParams } from 'react-router';
import { customer } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { BookingForm, type BookingPrefill } from '@/features/booking/BookingForm';
import { Icon } from '@/ui';
import { HOTLINE, LoadingBlocks, PageHeader, TEL } from './ui';
import s from './Customer.module.css';

/** #/khach-hang/dat-lich — the logged-in booking form; `?tu=<request id>` resends a similar request (prefilled from its snapshot). */
export function BookPage() {
  const [params] = useSearchParams();
  const from = params.get('tu');
  const q = useQuery<BookingPrefill | null>(
    () => (from ? customer.appointments.getRequest(from).then((r) => r.snapshot, () => null) : Promise.resolve(null)), [from],
  );
  return (
    <>
      <PageHeader title="Gửi yêu cầu đặt lịch" sub="Sau khi nhận yêu cầu, nhân viên Lê Sơn sẽ gọi để cùng bạn chốt thời gian." />
      <div className={s.bookGrid}>
        {q.isLoading ? <LoadingBlocks rows={2} /> : <BookingForm key={from ?? 'new'} prefill={q.data ?? undefined} />}
        <aside className={s.bookAside}>
          <ol className={s.bookSteps}>
            <li><span>1</span><div><strong>Bạn gửi yêu cầu</strong><p>Cho Lê Sơn biết bé cần gì và ngày bạn mong muốn.</p></div></li>
            <li><span>2</span><div><strong>Lê Sơn gọi lại</strong><p>Nhân viên gọi vào số của bạn để trao đổi và chọn giờ phù hợp.</p></div></li>
            <li><span>3</span><div><strong>Lịch hẹn được xác nhận</strong><p>Lịch chỉ được xác nhận sau khi hai bên đã thống nhất qua điện thoại.</p></div></li>
          </ol>
          <div className={s.emergency} role="note">
            <Icon name="heart-pulse" size={22} />
            <p><strong>Bé cần cấp cứu?</strong> Bạn gọi ngay <a href={TEL}>{HOTLINE}</a> thay vì gửi yêu cầu, Lê Sơn tiếp nhận cấp cứu 24/24.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
