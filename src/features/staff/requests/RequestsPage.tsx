import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { AnimatePresence, m } from 'motion/react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { system } from '@/data/public';
import { staff, type RequestTab, type StaffRequestCard } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { SERVICE_LABEL, type Service } from '@/data/contracts/enums';
import { minutesAgoVi } from '@/lib/dates';
import { formatPhoneVi } from '@/lib/phone';
import { EmptyState, Icon, Select, StatusPill, Tabs, statusPill } from '@/ui';
import { cx } from '@/lib/cx';
import { dur, ease } from '@/ui/motion';
import { FlagBanner, MiniTag, PageHeader, PetChip, ServiceChip, atWhen, shortDay } from '../ui';
import { RequestDetail } from './RequestDetail';
import s from './Requests.module.css';
import st from '../Staff.module.css';

const TABS: { value: RequestTab; label: string }[] = [
  { value: 'can_xu_ly', label: 'Cần xử lý' }, { value: 'pending', label: 'Chờ xác nhận' }, { value: 'contacting', label: 'Đang liên hệ' },
  { value: 'unreachable', label: 'Không liên lạc được' }, { value: 'confirmed', label: 'Đã xác nhận' }, { value: 'cancelled', label: 'Đã hủy' },
  { value: 'rejected', label: 'Từ chối' }, { value: 'tat_ca', label: 'Tất cả' },
];
type SourceFilter = 'all' | 'guest' | 'account';

/** Yêu cầu đặt lịch (staff §4.1): master-detail queue; the tab lives in the URL so the detail link keeps it. */
export function RequestsPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.value === params.get('tab'))?.value ?? 'can_xu_ly') as RequestTab;
  const [q, setQ] = useState('');
  const [service, setService] = useState<Service | 'all'>('all');
  const [source, setSource] = useState<SourceFilter>('all');
  const list = useQuery(() => staff.requests.list({ tab, q: q.trim() || undefined }), [tab, q]);
  const counts = useQuery(() => staff.requests.counts(), []);
  const rows = (list.data ?? []).filter((r) => (service === 'all' || r.service === service) && (source === 'all' || r.source === source));
  const search = params.toString() ? `?${params.toString()}` : '';

  return (
    <>
      <div className={cx(id && s.hideOnPhone)}>
        <PageHeader title="Yêu cầu đặt lịch" sub="Khách gửi qua trang web. Gọi lại cho khách, rồi xác nhận lịch hẹn đã thống nhất." />
      </div>
      <div className={cx(s.layout, id && s.hasDetail)}>
        <section className={s.master} aria-label="Danh sách yêu cầu">
          <Tabs<RequestTab> label="Lọc theo trạng thái" value={tab} className={s.tabs}
            onChange={(v) => setParams(v === 'can_xu_ly' ? {} : { tab: v }, { replace: true })}
            items={TABS.map((t) => ({ ...t, count: counts.data?.[t.value] }))} />
          <div className={s.filters}>
            <label className={st.search}>
              <Icon name="search" size={18} />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tên, số điện thoại, tên thú cưng, mã YC" aria-label="Tìm yêu cầu" />
            </label>
            <Select aria-label="Dịch vụ" value={service} onChange={(e) => setService(e.target.value as Service | 'all')} className={s.select}>
              <option value="all">Mọi dịch vụ</option>
              {(Object.keys(SERVICE_LABEL) as Service[]).map((sv) => <option key={sv} value={sv}>{SERVICE_LABEL[sv]}</option>)}
            </Select>
            <Select aria-label="Nguồn" value={source} onChange={(e) => setSource(e.target.value as SourceFilter)} className={s.select}>
              <option value="all">Mọi nguồn</option>
              <option value="guest">Khách vãng lai</option>
              <option value="account">Có tài khoản</option>
            </Select>
          </div>
          {list.isLoading && !list.data ? <div className={s.cardSkel} aria-busy="true" aria-label="Đang tải" /> : rows.length === 0 ? (
            <EmptyState icon="inbox" title={q || service !== 'all' || source !== 'all' ? 'Không tìm thấy yêu cầu phù hợp.' : tab === 'can_xu_ly' ? 'Hiện không có yêu cầu nào cần xử lý.' : 'Chưa có yêu cầu nào ở mục này.'} />
          ) : (
            <ul className={s.cards}>
              {rows.map((r) => <RequestCard key={r.id} r={r} active={r.id === id} search={search} />)}
            </ul>
          )}
        </section>
        <section className={s.detail} aria-label="Chi tiết yêu cầu">
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={id ?? 'none'} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: dur.m, ease: ease.out }}>
              {id ? <RequestDetail id={id} backTo={`${paths.nv.requests}${search}`} /> : (
                <div className={s.placeholder}>
                  <Icon name="inbox" size={40} />
                  <p>Chọn một yêu cầu để xem thông tin khách đã gửi, ghi cuộc gọi và xác nhận lịch hẹn.</p>
                </div>
              )}
            </m.div>
          </AnimatePresence>
        </section>
      </div>
    </>
  );
}

function RequestCard({ r, active, search }: { r: StaffRequestCard; active: boolean; search: string }) {
  const now = system.now();
  return (
    <li>
      <AppLink to={`${paths.nv.request(r.id)}${search}`} className={cx(s.card, active && s.cardActive)} aria-current={active ? 'true' : undefined} data-request-card>
        {r.flaggedAt && <FlagBanner>Khách vừa gửi lại — cần gọi lại · {atWhen(r.flaggedAt, now)}</FlagBanner>}
        <span className={s.cardRow}>
          <StatusPill pill={statusPill('request', r.status)} dense />
          <span className={st.code}>{r.code}</span>
          <span className={cx(st.meta, s.ago)}>{minutesAgoVi(r.createdAt, now)}</span>
        </span>
        <span className={s.cardRow}>
          <strong className={s.name}>{r.contactName}</strong>
          <span className={cx(st.meta, s.phone)}>{formatPhoneVi(r.phone)}</span>
        </span>
        <span className={s.cardRow}>
          <PetChip name={r.petName} species={r.species} breed={r.breed} />
          <ServiceChip service={r.service} short />
          <span className={st.meta}>Mong muốn: {shortDay(`${r.desiredDate}T12:00:00+07:00`)}</span>
        </span>
        <span className={s.cardRow}>
          {r.source === 'account' ? <MiniTag icon="circle-user-round" tone="plum">Tài khoản: {r.accountUsername}</MiniTag> : <MiniTag icon="user-round">Khách vãng lai</MiniTag>}
          {r.callCount > 0 && <span className={st.meta}>Đã gọi {r.callCount} lần</span>}
          {r.handlerName && <span className={st.meta}>{r.handlerName.replace(/^BS\. /, '').split(' ').pop()} {r.status === 'contacting' ? 'đang liên hệ' : 'phụ trách'}</span>}
        </span>
      </AppLink>
    </li>
  );
}
