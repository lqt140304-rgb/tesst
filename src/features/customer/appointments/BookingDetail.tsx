import { useState } from 'react';
import { m } from 'motion/react';
import { customer, type CustomerBookingRow, type CustomerRequestDetail } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { SPECIES_LABEL, TIME_SLOT_LABEL } from '@/data/contracts/enums';
import { formatDateVi, formatShortDateVi, formatTimeVi } from '@/lib/dates';
import { Button, ButtonAnchor, Icon, StatusPill } from '@/ui';
import { DATA_READY } from '@/features/data-ready';
import { cx } from '@/lib/cx';
import { ease } from '@/ui/motion';
import { ADDRESS, MAPS, serviceLabel, whenVi } from '../ui';
import { RowActions, explain, listPill } from './BookingRow';
import { RescheduleDialog } from './RescheduleDialog';
import s from '../Customer.module.css';
import o from './Appointments.module.css';

const MAIN_TRACK = ['Chờ xác nhận', 'Đang liên hệ', 'Đã xác nhận'] as const;
const day = (iso: string) => formatDateVi(`${iso}T12:00:00+07:00`);

/** What the customer sees for one appointment or request: status, when and where, the actions, and (for a request) its history and what they sent. */
export function BookingDetail({ row }: { row: CustomerBookingRow }) {
  const [asking, setAsking] = useState(false);
  const canMove = DATA_READY.reschedule && row.status === 'confirmed' && row.group === 'upcoming' && !row.appointmentCancelled && !row.rescheduleRequest;
  const agreed = !!row.appointmentAt && !row.appointmentCancelled && row.status === 'confirmed';
  const whenText = agreed
    ? whenVi(row.appointmentAt!)
    : row.desiredDate ? `Mong muốn ${day(row.desiredDate)}${row.preferredSlot ? `, ${TIME_SLOT_LABEL[row.preferredSlot]}` : ''}` : 'Chờ Lê Sơn gọi';
  return (
    <div className={o.detail}>
      <h2 tabIndex={-1} className={o.dTitle}>
        {row.kind === 'request' && row.code ? <>Yêu cầu <strong className="num">{row.code}</strong></> : `${serviceLabel(row.service)} · bé ${row.petName}`}
      </h2>
      {row.kind === 'request' && row.code && <p className={o.dSub}>{serviceLabel(row.service)} · bé {row.petName}</p>}
      <div className={o.pills}>
        <StatusPill pill={listPill(row)} />
        {row.viaPhone && <span className={o.tag}><Icon name="phone" size={13} /> Đặt qua điện thoại</span>}
        {row.viaCounter && <span className={o.tag}><Icon name="house" size={13} /> Đặt tại quầy</span>}
      </div>
      <p className={o.explain}>{explain(row)}</p>
      <dl className={o.facts}>
        <div><dt>Bé</dt><dd>{row.petName}</dd></div>
        <div><dt>Dịch vụ</dt><dd>{serviceLabel(row.service)}</dd></div>
        <div><dt>{agreed ? 'Lịch hẹn' : 'Thời gian'}</dt><dd>{whenText}</dd></div>
      </dl>
      {agreed && (
        <>
          <p className={o.addr}><Icon name="map-pin" size={18} /> {ADDRESS}</p>
          <div><ButtonAnchor href={MAPS} external variant="secondary" size="sm" icon="navigation">Chỉ đường</ButtonAnchor></div>
        </>
      )}
      {row.rescheduleRequest && (
        <p className={o.waiting} role="status">
          <strong>Đang chờ đổi lịch</strong>
          <span>Bạn muốn đổi sang <span className="num">{day(row.rescheduleRequest.desiredDate)}</span>{row.rescheduleRequest.preferredSlot ? `, ${TIME_SLOT_LABEL[row.rescheduleRequest.preferredSlot]}` : ''}. Lê Sơn sẽ gọi cho bạn.</span>
        </p>
      )}
      <div className={o.actions} data-actions>
        <RowActions r={row} compact />
        {canMove && <div><Button variant="secondary" size="sm" icon="calendar-plus" onClick={() => setAsking(true)}>Yêu cầu đổi lịch</Button></div>}
      </div>
      <RescheduleDialog row={row} open={asking} onClose={() => setAsking(false)} />
      {row.kind === 'request' && <RequestExtras id={row.id} />}
    </div>
  );
}

function RequestExtras({ id }: { id: string }) {
  const q = useQuery(() => customer.appointments.getRequest(id), [id]);
  if (q.error || !q.data) return null;
  const r = q.data;
  return (
    <>
      <h3 className={o.h3}>Diễn biến</h3>
      <Timeline r={r} />
      <h3 className={o.h3}>Thông tin bạn đã gửi</h3>
      <dl className={o.facts}>
        <div><dt>Họ và tên</dt><dd>{r.snapshot.contact_name}</dd></div>
        <div><dt>Số điện thoại</dt><dd className="num">{r.snapshot.phone}</dd></div>
        <div><dt>Bé</dt><dd>{r.snapshot.pet_name}</dd></div>
        <div><dt>Loài</dt><dd>{SPECIES_LABEL[r.snapshot.species]}{r.snapshot.breed ? ` · ${r.snapshot.breed}` : ''}</dd></div>
        <div><dt>Dịch vụ</dt><dd>{serviceLabel(r.snapshot.service)}</dd></div>
        <div><dt>Ngày mong muốn</dt><dd className="num">{day(r.snapshot.desired_date)}</dd></div>
        {r.snapshot.preferred_slot && <div><dt>Khung giờ mong muốn</dt><dd className="num">{TIME_SLOT_LABEL[r.snapshot.preferred_slot]}</dd></div>}
        <div><dt>Ghi chú</dt><dd>{r.snapshot.note || '—'}</dd></div>
      </dl>
      <p className={o.small}>Đây là thông tin tại thời điểm gửi. Sửa hồ sơ bé sau này không làm thay đổi yêu cầu này.</p>
    </>
  );
}

/** Main track Chờ xác nhận → Đang liên hệ → Đã xác nhận, side outcomes in their chip colour; draws in once. Actor is always "Lê Sơn". */
function Timeline({ r }: { r: CustomerRequestDetail }) {
  const reached = new Map<string, string>();
  for (const e of r.timeline) if (e.tone === 'main' && e.label !== 'Bạn gửi yêu cầu') reached.set(e.label, e.at);
  const created = r.timeline.find((e) => e.label === 'Bạn gửi yêu cầu');
  if (created) reached.set('Chờ xác nhận', created.at);
  type Node = { label: string; at?: string; kind: 'done' | 'todo' | 'side' | 'reminder' | 'start' };
  const nodes: Node[] = [];
  if (created) nodes.push({ label: 'Bạn gửi yêu cầu', at: created.at, kind: 'start' });
  const sides = r.timeline.filter((e) => e.tone !== 'main');
  for (const label of MAIN_TRACK) {
    if (label === 'Chờ xác nhận') continue;
    const at = reached.get(label);
    if (at) nodes.push({ label, at, kind: 'done' });
  }
  for (const e of sides) nodes.push({ label: e.label, at: e.at, kind: e.tone === 'reminder' ? 'reminder' : 'side' });
  nodes.sort((a, b) => (a.at ?? '').localeCompare(b.at ?? ''));
  const ended = ['confirmed', 'cancelled', 'rejected'].includes(r.status) || r.appointmentCancelled;
  if (!ended) for (const label of MAIN_TRACK.slice(1)) if (!reached.has(label)) nodes.push({ label, kind: 'todo' });
  return (
    <ol className={s.timeline}>
      {nodes.map((n, i) => (
        <m.li key={`${n.label}-${i}`} className={cx(s.tlItem, s[`tl_${n.kind}`])}
          initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: ease.out, delay: i * 0.06 }}>
          <span className={s.tlDot} aria-hidden="true" />
          <span className={s.tlLabel}>{n.label}</span>
          {n.at && <span className={s.tlAt}>{formatShortDateVi(n.at)} · {formatTimeVi(n.at)}</span>}
        </m.li>
      ))}
    </ol>
  );
}
