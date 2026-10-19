import { useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { paths } from '@/app/routes';
import { customer } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { ButtonLink, EmptyState, Tabs } from '@/ui';
import { dur, ease } from '@/ui/motion';
import { LoadingBlocks, PageHeader, PageProblem } from '../ui';
import { BookingRow } from './BookingRow';
import s from '../Customer.module.css';

type Tab = 'upcoming' | 'processing' | 'past';
const EMPTY: Record<Tab, { title: string; body?: string }> = {
  upcoming: { title: 'Chưa có lịch hẹn sắp tới', body: 'Khi nhân viên xác nhận yêu cầu của bạn, lịch hẹn sẽ hiện ở đây.' },
  processing: { title: 'Không có yêu cầu nào đang chờ.' },
  past: { title: 'Chưa có lịch hẹn nào trước đây.' },
};

/** Lịch hẹn & yêu cầu (customer §9.5, R10). */
export function AppointmentsPage() {
  const q = useQuery(() => customer.appointments.list(), []);
  const [tab, setTab] = useState<Tab>('upcoming');
  const book = <ButtonLink to={paths.kh.book} icon="calendar-plus">Gửi yêu cầu đặt lịch</ButtonLink>;
  return (
    <>
      <PageHeader title="Lịch hẹn" actions={book} />
      {q.error ? <PageProblem error={q.error} onRetry={q.refetch} /> : !q.data ? <LoadingBlocks /> : (
        <>
          <Tabs<Tab> label="Nhóm lịch hẹn" value={tab} onChange={setTab} className={s.segTabs}
            items={[
              { value: 'upcoming', label: 'Sắp tới', count: q.data.upcoming.length },
              { value: 'processing', label: 'Đang xử lý', count: q.data.processing.length },
              { value: 'past', label: 'Đã qua', count: q.data.past.length },
            ]} />
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={tab} className={s.list} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: dur.m, ease: ease.out }}>
              {q.data[tab].length === 0
                ? <EmptyState icon="calendar-days" title={EMPTY[tab].title} body={EMPTY[tab].body} action={tab === 'upcoming' ? book : undefined} />
                : q.data[tab].map((r) => <BookingRow key={r.id} r={r} />)}
            </m.div>
          </AnimatePresence>
        </>
      )}
    </>
  );
}
