import type { ReactNode } from 'react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { staff, type StaffStayView } from '@/data/staff';
import { system } from '@/data/public';
import { INTERNAL_STATUS_LABEL, SPECIES_LABEL, type InternalStatus } from '@/data/contracts/enums';
import { formatDateVi, formatShortDateVi, formatTimeVi } from '@/lib/dates';
import { ButtonLink, Icon, PetAvatar, Select, StatusPill, statusPill, useToast } from '@/ui';
import { Tel, saveError } from '../ui';
import { NextChores } from './NextChores';
import { infoMoneyLine, stayDuration } from './stayMoney';
import type { Chore } from './chores';
import s from './Inpatient.module.css';
import st from '../Staff.module.css';

/** The left card of a stay: who, how long, money, what the owner sees, what to do next, and the actions (passed in). */
export function StayInfoCard({ v, onGoTab, actions }: { v: StaffStayView; onGoTab: (tab: Chore['tab']) => void; actions?: ReactNode }) {
  const { can } = useSession();
  const until = v.discharged_at ?? system.now();
  const sharedDiary = v.diary.filter((e) => e.status === 'shared').length;
  const sharedVideos = v.videos.filter((x) => x.share_status === 'shared' && !x.deleted).length;
  return (
    <aside className={s.stayInfo} data-stay-info aria-label="Thông tin bé nội trú">
      <div className={s.headPet}>
        <PetAvatar name={v.petName} species={v.species} photoKey={v.photoKey} size={56} />
        <div>
          <p className={s.headName}>{v.petName} <span className={st.meta}>· {SPECIES_LABEL[v.species]}{v.breed ? ` ${v.breed}` : ''}</span></p>
          {v.alerts.length > 0 && <span className={st.chipsWrap}>{v.alerts.map((a) => <span key={a} className={st.alert}><Icon name="triangle-alert" size={13} />{a}</span>)}</span>}
        </div>
      </div>
      {v.discharged_at && <p className={s.homeStrip}><Icon name="door-open" size={16} /> Đã xuất viện lúc {formatTimeVi(v.discharged_at)}, {formatShortDateVi(v.discharged_at)}</p>}
      <dl className={st.kv}>
        <dt>Chủ nuôi</dt>
        <dd>{can('customers.view') ? <AppLink to={paths.nv.customer(v.ownerId)} className={st.cellLink}>{v.ownerName}</AppLink> : v.ownerName} · <Tel e164={v.ownerPhone} /></dd>
        <dt>Chuồng</dt><dd>Chuồng {v.cageCode}</dd>
        <dt>Nhập viện</dt><dd className="num">{formatTimeVi(v.admitted_at)}, {formatDateVi(v.admitted_at)}</dd>
        <dt>{v.discharged_at ? 'Đã ở' : 'Đang ở'}</dt><dd>{stayDuration(v.admitted_at, until)}</dd>
        {v.expected_discharge_at && !v.discharged_at && <><dt>Dự kiến về</dt><dd className="num">{formatDateVi(v.expected_discharge_at)}</dd></>}
        <dt>BS. phụ trách</dt><dd>{v.doctorName ?? '—'}</dd>
      </dl>
      <StatusControl v={v} />
      <div className={s.moneyBox}>
        <p className={s.blockTitle}>Tiền nội trú</p>
        <p className={s.money} data-money>{infoMoneyLine(v.billing, v.admitted_at, until, !!v.discharged_at)}</p>
        {v.invoiceId && can(['invoices.create', 'payments.record']) && <ButtonLink to={paths.nv.invoice(v.invoiceId)} variant="secondary" icon="receipt" size="sm">Mở hóa đơn</ButtonLink>}
      </div>
      <div className={s.seenBox}>
        <p className={s.blockTitle}>Chủ nuôi đang thấy</p>
        <p className={s.meta}>{sharedDiary} nhật ký · {sharedVideos} video đã chia sẻ</p>
        {v.ownerWeb !== 'linked' && <p className={s.meta}>Chủ nuôi chưa liên kết tài khoản nên chưa xem được.</p>}
      </div>
      <NextChores v={v} onGoTab={onGoTab} />
      {actions && <div className={s.infoActions}>{actions}</div>}
    </aside>
  );
}

function StatusControl({ v }: { v: StaffStayView }) {
  const { can } = useSession();
  const toast = useToast();
  if (!can('inpatient.admit') || v.discharged_at) return <p className={s.statusRow}><span className={st.meta}>Tình trạng</span><StatusPill pill={statusPill('internal', v.internalStatus)} /></p>;
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
