import { useState } from 'react';
import { useParams } from 'react-router';
import { AnimatePresence, m } from 'motion/react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { staff, type StaffStayView } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { INTERNAL_STATUS_LABEL, SPECIES_LABEL, type InternalStatus } from '@/data/contracts/enums';
import { formatDateVi, formatTimeVi } from '@/lib/dates';
import { ButtonLink, Icon, IconBadge, Select, StatusPill, Tabs, statusPill, useToast } from '@/ui';
import { dur, ease } from '@/ui/motion';
import { LoadingBlocks, PageHeader, PageProblem, SPECIES_ICON, Tel, saveError } from '../ui';
import { InternalTab } from './InternalTab';
import { DiaryTab } from './DiaryTab';
import { VideosTab } from './VideosTab';
import s from './Inpatient.module.css';
import st from '../Staff.module.css';

type Tab = 'internal' | 'diary' | 'videos' | 'invoice';

/** Stay detail (staff §5.2). The internal record exists only for inpatient.clinical — spa staff never see the tab. */
export function StayPage() {
  const { stayId = '' } = useParams();
  const q = useQuery(() => staff.inpatient.getStay(stayId), [stayId]);
  const [tab, setTab] = useState<Tab | null>(null);
  if (q.error) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks rows={3} />;
  const v = q.data;
  const current: Tab = tab ?? (v.internal ? 'internal' : 'diary');
  const items = [
    ...(v.internal ? [{ value: 'internal' as const, label: <><Icon name="lock" size={15} /> Hồ sơ nội bộ</> }] : []),
    { value: 'diary' as const, label: <><Icon name="eye" size={15} /> Nhật ký cho chủ nuôi</>, count: v.diary.filter((e) => e.status === 'draft').length || undefined },
    { value: 'videos' as const, label: 'Video', count: v.videos.filter((x) => !x.deleted).length },
    { value: 'invoice' as const, label: 'Hóa đơn' },
  ];

  return (
    <>
      <PageHeader title={v.petName}
        eyebrow={<ButtonLink to={paths.nv.board} variant="ghost" size="sm" icon="arrow-left">Nội trú</ButtonLink>}
        sub={<span className={st.recordHead}><span className={st.code}>{v.code}</span><span>Chuồng {v.cageCode}</span><span>Ngày {v.dayNumber}</span>{v.discharged_at && <span>Đã xuất viện {formatDateVi(v.discharged_at)}</span>}</span>}
        actions={<StatusControl v={v} />} />
      <div className={st.stack}>
        <Header v={v} />
        <Tabs<Tab> label="Hồ sơ nội trú" variant="underline" value={current} onChange={setTab} items={items} />
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={current} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: dur.m, ease: ease.out }}>
            {current === 'internal' && v.internal ? <InternalTab v={v} />
              : current === 'diary' ? <DiaryTab v={v} />
              : current === 'videos' ? <VideosTab v={v} />
              : <InvoiceTab v={v} />}
          </m.div>
        </AnimatePresence>
      </div>
    </>
  );
}

function Header({ v }: { v: StaffStayView }) {
  const { can } = useSession();
  return (
    <section className={s.headCard}>
      <div className={s.headPet}>
        <IconBadge icon={SPECIES_ICON[v.species]} tone={v.species === 'cat' ? 'lilac' : 'peach'} size={52} />
        <div>
          <p className={s.headName}>{v.petName} <span className={st.meta}>· {SPECIES_LABEL[v.species]}{v.breed ? ` ${v.breed}` : ''}</span></p>
          {v.alerts.length > 0 && <span className={st.chipsWrap}>{v.alerts.map((a) => <span key={a} className={st.alert}><Icon name="triangle-alert" size={13} />{a}</span>)}</span>}
        </div>
      </div>
      <dl className={st.kv}>
        <dt>Chủ nuôi</dt>
        <dd>{can('customers.view') ? <AppLink to={paths.nv.customer(v.ownerId)} className={st.cellLink}>{v.ownerName}</AppLink> : v.ownerName} · <Tel e164={v.ownerPhone} /></dd>
        <dt>Nhập viện</dt><dd>{formatTimeVi(v.admitted_at)}, {formatDateVi(v.admitted_at)}{v.expected_discharge_at ? ` · dự kiến về ${formatDateVi(v.expected_discharge_at)}` : ''}</dd>
        <dt>BS. phụ trách</dt><dd>{v.doctorName ?? '—'}</dd>
        <dt>Tài khoản web</dt><dd>{v.ownerWeb === 'linked' ? 'Chủ nuôi đã liên kết' : 'Chủ nuôi chưa liên kết tài khoản'}</dd>
      </dl>
    </section>
  );
}

function StatusControl({ v }: { v: StaffStayView }) {
  const { can } = useSession();
  const toast = useToast();
  if (!can('inpatient.admit') || v.discharged_at) return <StatusPill pill={statusPill('internal', v.internalStatus)} />;
  return (
    <label className={s.statusSelect}>
      <span>Tình trạng nội bộ</span>
      <Select value={v.internalStatus} onChange={async (e) => {
        try {
          await staff.inpatient.setInternalStatus(v.id, v.version, e.target.value as InternalStatus);
          toast({ message: `Đã cập nhật tình trạng nội bộ: ${INTERNAL_STATUS_LABEL[e.target.value as InternalStatus]}.` });
        } catch (x) {
          toast({ tone: 'error', message: saveError(x) });
        }
      }}>
        {(Object.keys(INTERNAL_STATUS_LABEL) as InternalStatus[]).map((k) => <option key={k} value={k}>{INTERNAL_STATUS_LABEL[k]}</option>)}
      </Select>
    </label>
  );
}

function InvoiceTab({ v }: { v: StaffStayView }) {
  const { can } = useSession();
  return (
    <div className={st.panel}>
      {v.invoiceId ? (
        <>
          <p className={st.small}>Hóa đơn nội trú của {v.petName} đang được cập nhật theo số ngày và dịch vụ đã dùng.</p>
          {can(['invoices.create', 'payments.record']) && <div><ButtonLink to={paths.nv.invoice(v.invoiceId)} variant="secondary" icon="receipt">Mở hóa đơn nội trú</ButtonLink></div>}
        </>
      ) : <p className={st.empty}>Lượt nội trú này chưa có hóa đơn.</p>}
    </div>
  );
}
