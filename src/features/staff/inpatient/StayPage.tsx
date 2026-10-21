import { useState } from 'react';
import { useParams } from 'react-router';
import { AnimatePresence, m } from 'motion/react';
import { paths } from '@/app/routes';
import { staff, type StaffStayView } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { Button, ButtonLink, Icon, Tabs } from '@/ui';
import { dur, ease } from '@/ui/motion';
import { LoadingBlocks, PageHeader, PageProblem } from '../ui';
import { useSession } from '@/app/session/SessionProvider';
import { formatDateVi } from '@/lib/dates';
import { infoMoneyLine } from './stayMoney';
import { system } from '@/data/public';
import { InternalTab } from './InternalTab';
import { DiaryTab } from './DiaryTab';
import { VideosTab } from './VideosTab';
import { HistoryTab } from './HistoryTab';
import { StayInfoCard } from './StayInfoCard';
import { StayProgress } from './StayProgress';
import { TransferDialog } from './TransferDialog';
import { DischargeDialog } from './DischargeDialog';
import s from './Inpatient.module.css';
import st from '../Staff.module.css';

type Tab = 'internal' | 'diary' | 'videos' | 'invoice' | 'history';

/** One pet's stay (staff §5.2): info card beside the tabs from 1100 px, above them below. The internal record exists only for inpatient.clinical. */
export function StayPage() {
  const { stayId = '' } = useParams();
  const q = useQuery(() => staff.inpatient.getStay(stayId), [stayId]);
  const { can } = useSession();
  const [tab, setTab] = useState<Tab | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [discharging, setDischarging] = useState(false);
  if (q.error && !q.data) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks rows={3} />;
  const v = q.data;
  const current: Tab = tab ?? (v.internal ? 'internal' : 'diary');
  const items = [
    ...(v.internal ? [{ value: 'internal' as const, label: <><Icon name="lock" size={15} /> Hồ sơ nội bộ</> }] : []),
    { value: 'diary' as const, label: <><Icon name="eye" size={15} /> Nhật ký cho chủ nuôi</>, count: v.diary.filter((e) => e.status === 'draft').length || undefined },
    { value: 'videos' as const, label: 'Video', count: v.videos.filter((x) => !x.deleted).length },
    { value: 'invoice' as const, label: 'Hóa đơn' },
    { value: 'history' as const, label: 'Lịch sử' },
  ];

  // A dialog that is already open stays, even if another tab discharges the pet meanwhile: saving then explains what happened instead of the form vanishing.
  return (
    <>
      <PageHeader title={v.petName} parent={{ label: 'Nội trú', to: paths.nv.board }}
        sub={<span className={st.recordHead}><span className={st.code}>{v.code}</span><span>Chuồng {v.cageCode}</span><span>Ngày {v.dayNumber}</span></span>} />
      <StayProgress v={v} />
      <div className={s.stayLayout}>
        <StayInfoCard v={v} onGoTab={setTab} actions={can('inpatient.admit') && !v.discharged_at && (
          <>
            <Button icon="log-out" onClick={() => setDischarging(true)}>Xuất viện…</Button>
            <Button variant="secondary" icon="refresh-cw" onClick={() => setTransferring(true)}>Chuyển chuồng…</Button>
          </>
        )} />
        <div className={s.stayMain}>
          <Tabs<Tab> label="Hồ sơ nội trú" variant="underline" idPrefix="nt" className={s.stayTabs} value={current} onChange={setTab} items={items} />
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={current} role="tabpanel" id={`nt-${current}-panel`} aria-labelledby={`nt-${current}`}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: dur.m, ease: ease.out }}>
              {current === 'internal' && v.internal ? <InternalTab v={v} />
                : current === 'diary' ? <DiaryTab v={v} />
                : current === 'videos' ? <VideosTab v={v} />
                : current === 'history' ? <HistoryTab stayId={v.id} />
                : <InvoiceTab v={v} />}
            </m.div>
          </AnimatePresence>
        </div>
      </div>
      {can('inpatient.admit') && (!v.discharged_at || transferring) && <TransferDialog key={`move-${transferring}`} open={transferring} onClose={() => setTransferring(false)} stay={v} />}
      {can('inpatient.admit') && (!v.discharged_at || discharging) && <DischargeDialog key={`out-${discharging}`} open={discharging} onClose={() => setDischarging(false)} stay={v} />}
    </>
  );
}

function InvoiceTab({ v }: { v: StaffStayView }) {
  const { can } = useSession();
  const until = v.discharged_at ?? system.now();
  return (
    <div className={st.panel}>
      {v.invoiceId ? (
        <>
          <p className={st.small}>Hóa đơn nội trú của {v.petName}{v.billing?.invoiceCode ? ` (${v.billing.invoiceCode})` : ''} được cập nhật theo số ngày và dịch vụ đã dùng.</p>
          <p className="num"><strong>{infoMoneyLine(v.billing, v.admitted_at, until, !!v.discharged_at)}</strong></p>
          {v.discharged_at && <p className={st.meta}>Xuất viện ngày {formatDateVi(v.discharged_at)}.</p>}
          {can(['invoices.create', 'payments.record']) && <div><ButtonLink to={paths.nv.invoice(v.invoiceId)} variant="secondary" icon="receipt">Mở hóa đơn nội trú</ButtonLink></div>}
        </>
      ) : <p className={st.empty}>Bé này chưa có hóa đơn nội trú.</p>}
    </div>
  );
}
