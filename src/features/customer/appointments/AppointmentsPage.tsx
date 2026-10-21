import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { paths } from '@/app/routes';
import { customer, type CustomerBookingRow } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { useMedia } from '@/lib/useMedia';
import { AppLink } from '@/app/nav';
import { ButtonLink, EmptyState, Icon, MasterDetail, PetAvatar, StatusPill, Tabs, useListState } from '@/ui';
import { formatDateVi, formatTimeVi } from '@/lib/dates';
import { LoadingBlocks, PageHeader, PageProblem, serviceLabel } from '../ui';
import { BookingDetail } from './BookingDetail';
import { listPill } from './BookingRow';
import { cx } from '@/lib/cx';
import o from './Appointments.module.css';

type Tab = 'sap-toi' | 'dang-xu-ly' | 'lich-su';
type Group = 'upcoming' | 'processing' | 'past';
const GROUP: Record<Tab, Group> = { 'sap-toi': 'upcoming', 'dang-xu-ly': 'processing', 'lich-su': 'past' };
const TAB_OF: Record<Group, Tab> = { upcoming: 'sap-toi', processing: 'dang-xu-ly', past: 'lich-su' };
const isTab = (v: unknown): v is Tab => v === 'sap-toi' || v === 'dang-xu-ly' || v === 'lich-su';
const EMPTY: Record<Tab, { title: string; body?: string }> = {
  'sap-toi': { title: 'Chưa có lịch hẹn sắp tới', body: 'Khi nhân viên xác nhận yêu cầu của bạn, lịch hẹn sẽ hiện ở đây.' },
  'dang-xu-ly': { title: 'Không có yêu cầu nào đang chờ.' },
  'lich-su': { title: 'Chưa có lịch hẹn nào trước đây.' },
};

const whenOf = (r: CustomerBookingRow) => (r.appointmentAt && !r.appointmentCancelled
  ? `${formatTimeVi(r.appointmentAt)} · ${formatDateVi(r.appointmentAt)}`
  : r.desiredDate ? `Mong muốn ${formatDateVi(`${r.desiredDate}T12:00:00+07:00`)}` : 'Chờ Lê Sơn gọi');

/** Lịch hẹn (spec 2026-10-21 §3.5): tabs Sắp tới · Đang xử lý · Lịch sử, a list, and the detail beside it (a full page on phones). */
export function AppointmentsPage() {
  const q = useQuery(() => Promise.all([customer.appointments.list(), customer.pets.list()]), []);
  const { id: paramId } = useParams();
  const [search] = useSearchParams();
  const [list, setList] = useListState('kh-appts', { tab: 'sap-toi', id: '' });
  const wide = useMedia('(min-width: 1024px)');
  const queryTab = search.get('tab');
  const [tab, setTabState] = useState<Tab>(isTab(queryTab) ? queryTab : isTab(list.tab) ? list.tab : 'sap-toi');
  const [sel, setSel] = useState<string>(paramId ?? list.id);
  const [seeded, setSeeded] = useState(false);

  if (q.error) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <><PageHeader title="Lịch hẹn của bạn" /><LoadingBlocks /></>;
  const [lists, pets] = q.data;
  const all = [...lists.upcoming, ...lists.processing, ...lists.past];

  // A link to one row opens the tab that holds it, once.
  if (!seeded) {
    setSeeded(true);
    const hit = paramId ? all.find((r) => r.id === paramId) : undefined;
    if (hit) setTabState(TAB_OF[hit.group]);
  }
  if (paramId && !all.some((r) => r.id === paramId)) {
    return (
      <>
        <PageHeader title="Lịch hẹn của bạn" />
        <div className={o.missing} role="status">
          <p>Không tìm thấy lịch hẹn này.</p>
          <ButtonLink variant="secondary" to={paths.kh.appts}>Về danh sách lịch hẹn</ButtonLink>
        </div>
      </>
    );
  }

  const rows = lists[GROUP[tab]];
  const chosen = rows.find((r) => r.id === sel) ?? (wide ? rows[0] : undefined);
  const changeTab = (t: Tab) => { setTabState(t); setSel(''); setList({ tab: t, id: '' }); };
  const pick = (id: string) => { setSel(id); setList({ id }); };
  const book = <ButtonLink to={paths.kh.book} icon="calendar-plus">Đặt lịch mới</ButtonLink>;

  return (
    <>
      <PageHeader title="Lịch hẹn của bạn" sub="Theo dõi lịch hẹn và các yêu cầu bạn đã gửi cho Lê Sơn." actions={book}
        crumbs={[{ label: 'Trang chủ', to: paths.kh.home }, { label: 'Lịch hẹn' }]} />
      <Tabs<Tab> label="Nhóm lịch hẹn" value={tab} onChange={changeTab}
        items={[
          { value: 'sap-toi', label: 'Sắp tới', count: lists.upcoming.length },
          { value: 'dang-xu-ly', label: 'Đang xử lý', count: lists.processing.length },
          { value: 'lich-su', label: 'Lịch sử', count: lists.past.length },
        ]} />
      <div style={{ marginTop: 16 }}>
        <MasterDetail label="Chi tiết lịch hẹn" backLabel="Danh sách lịch hẹn" detailKey={chosen?.id} onBack={() => pick('')}
          list={rows.length === 0 ? (
            <EmptyState icon="calendar-days" title={EMPTY[tab].title} body={EMPTY[tab].body} action={tab === 'sap-toi' ? book : undefined} />
          ) : (
            <ul className={o.list}>
              {rows.map((r) => {
                const pet = pets.find((p) => p.name === r.petName);
                const on = chosen?.id === r.id;
                return (
                  <li key={r.id}>
                    <AppLink to={paths.kh.request(r.id)} data-booking-row aria-current={on ? 'true' : undefined} className={cx(o.item, on && o.sel)}
                      onClick={(e) => { e.preventDefault(); pick(r.id); }}>
                      <PetAvatar name={r.petName} species={pet?.species ?? 'other'} photoKey={pet?.photoKey} size={40} decorative />
                      <span>
                        <span className={o.title}>{serviceLabel(r.service)} · bé {r.petName}</span>
                        <span className={cx(o.when, 'num')}>{whenOf(r)}</span>
                        {(r.viaPhone || r.viaCounter) && (
                          <span className={o.tags}>
                            {r.viaPhone && <span className={o.tag}><Icon name="phone" size={12} /> Đặt qua điện thoại</span>}
                            {r.viaCounter && <span className={o.tag}><Icon name="house" size={12} /> Đặt tại quầy</span>}
                          </span>
                        )}
                      </span>
                      <span data-pill><StatusPill pill={listPill(r)} dense /></span>
                    </AppLink>
                  </li>
                );
              })}
            </ul>
          )}
          detail={chosen ? <BookingDetail row={chosen} /> : null} />
      </div>
    </>
  );
}
