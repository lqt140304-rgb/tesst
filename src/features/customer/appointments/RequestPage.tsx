import { useParams } from 'react-router';
import { m } from 'motion/react';
import { paths } from '@/app/routes';
import { customer, type CustomerRequestDetail } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { SPECIES_LABEL } from '@/data/contracts/enums';
import { formatDateVi, formatShortDateVi, formatTimeVi } from '@/lib/dates';
import { ButtonAnchor, ButtonLink, Icon, StatusPill } from '@/ui';
import { cx } from '@/lib/cx';
import { ease } from '@/ui/motion';
import { ADDRESS, LoadingBlocks, MAPS, PageHeader, PageProblem, Section, serviceLabel, whenVi } from '../ui';
import { RowActions, explain, rowPill } from './BookingRow';
import s from '../Customer.module.css';

const MAIN_TRACK = ['Chờ xác nhận', 'Đang liên hệ', 'Đã xác nhận'] as const;

/** Request detail (customer §9.5): status + explanation, agreed appointment, timeline, and the snapshot as sent. */
export function RequestPage() {
  const { id = '' } = useParams();
  const q = useQuery(() => customer.appointments.getRequest(id), [id]);
  if (q.error) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks />;
  const r = q.data;
  const confirmed = r.status === 'confirmed' && r.appointmentAt && !r.appointmentCancelled;
  return (
    <>
      <PageHeader eyebrow={<ButtonLink to={paths.kh.appts} variant="ghost" size="sm" icon="arrow-left">Lịch hẹn</ButtonLink>}
        title={<>Yêu cầu <strong>{r.code}</strong></>} actions={<StatusPill pill={rowPill(r)} />} />
      <div className={s.detailGrid}>
        <div className={s.stack}>
          <div className={s.explainCard}>
            <p className={s.rowText}>{explain(r)}</p>
            <RowActions r={r} compact />
          </div>
          {confirmed && (
            <section className={s.apptCard} aria-labelledby="appt-title">
              <p id="appt-title" className={s.apptTitle}>Lịch hẹn của bé {r.petName}</p>
              <p className={s.apptWhen}>{whenVi(r.appointmentAt!)}</p>
              <p className={s.apptAddr}><Icon name="map-pin" size={18} /> {ADDRESS}</p>
              <ButtonAnchor href={MAPS} external variant="secondary" size="sm" icon="navigation">Chỉ đường</ButtonAnchor>
            </section>
          )}
          {confirmed && <p className={s.note}>Ngày bạn mong muốn: {formatDateVi(`${r.snapshot.desired_date}T12:00:00+07:00`)}</p>}
          <Section title="Diễn biến">
            <Timeline r={r} />
          </Section>
        </div>
        <Section title="Thông tin bạn đã gửi" className={s.snapshot}>
          <dl className={s.dl}>
            <div><dt>Họ và tên</dt><dd>{r.snapshot.contact_name}</dd></div>
            <div><dt>Số điện thoại</dt><dd>{r.snapshot.phone}</dd></div>
            <div><dt>Bé</dt><dd>{r.snapshot.pet_name}</dd></div>
            <div><dt>Loài</dt><dd>{SPECIES_LABEL[r.snapshot.species]}{r.snapshot.breed ? ` · ${r.snapshot.breed}` : ''}</dd></div>
            <div><dt>Dịch vụ</dt><dd>{serviceLabel(r.snapshot.service)}</dd></div>
            <div><dt>Ngày mong muốn</dt><dd>{formatDateVi(`${r.snapshot.desired_date}T12:00:00+07:00`)}</dd></div>
            <div><dt>Ghi chú</dt><dd>{r.snapshot.note || '—'}</dd></div>
          </dl>
          <p className={s.small}>Đây là thông tin tại thời điểm gửi. Sửa hồ sơ bé sau này không làm thay đổi yêu cầu này.</p>
        </Section>
      </div>
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
