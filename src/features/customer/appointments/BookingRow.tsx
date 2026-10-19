import { useState } from 'react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { customer, type CustomerBookingRow } from '@/data/customer';
import { formatTimeVi } from '@/lib/dates';
import { Button, ButtonAnchor, ButtonLink, Icon, StatusPill, statusPill } from '@/ui';
import { cx } from '@/lib/cx';
import { DateBlock, HOTLINE, MAPS, TEL, serviceLabel, whenVi } from '../ui';
import s from '../Customer.module.css';

/** The sentence under the locked status chip (customer §9.5): the chip carries the label, this carries the comfort. */
export function explain(r: CustomerBookingRow): string {
  const cancelled = r.status === 'cancelled' || r.appointmentCancelled;
  if (cancelled) return 'Yêu cầu này đã được hủy. Khi cần, bạn có thể gửi yêu cầu mới bất cứ lúc nào.';
  switch (r.status) {
    case 'pending': return 'Lê Sơn đã nhận yêu cầu. Nhân viên sẽ gọi cho bạn để trao đổi và chốt thời gian.';
    case 'contacting': return 'Nhân viên đang liên hệ với bạn. Bạn để ý điện thoại giúp Lê Sơn nhé.';
    case 'unreachable': return `Lê Sơn đã gọi nhưng chưa liên lạc được với bạn. Bạn có thể nhờ Lê Sơn gọi lại, hoặc gọi trực tiếp ${HOTLINE}.`;
    case 'rejected': return `Rất tiếc, lần này Lê Sơn chưa thể tiếp nhận yêu cầu của bạn. Bạn gọi ${HOTLINE} để được tư vấn thêm nhé.`;
    case 'confirmed':
      if (!r.appointmentAt) return 'Lịch hẹn đã được chốt.';
      return r.group === 'past'
        ? `Bé ${r.petName} đã có lịch hẹn lúc ${whenVi(r.appointmentAt)}.`
        : `Lịch hẹn đã được chốt. Hẹn gặp bạn và bé ${r.petName} lúc ${whenVi(r.appointmentAt)}.`;
    default: return '';
  }
}

export function rowPill(r: CustomerBookingRow) {
  return statusPill('request', r.appointmentCancelled ? 'cancelled' : r.status);
}

/** Actions for a row (customer §9.5): call-back once per cycle, directions, or the hotline. */
export function RowActions({ r, compact }: { r: CustomerBookingRow; compact?: boolean }) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const cancelled = r.status === 'cancelled' || r.appointmentCancelled;
  if (r.status === 'unreachable') {
    return (
      <div className={s.rowActions}>
        {r.reminderSentAt ? (
          <>
            <Button size="sm" variant="soft" icon="check" disabled>Đã gửi lời nhắc</Button>
            <p className={s.note}>Lê Sơn đã nhận lời nhắc của bạn lúc {formatTimeVi(r.reminderSentAt)}. Nhân viên sẽ gọi lại cho bạn.</p>
          </>
        ) : (
          <Button size="sm" icon="phone-redo" loading={pending} loadingText="Đang gửi…" onClick={async () => {
            setPending(true);
            setFailed(false);
            try { await customer.appointments.callMeBack(r.id); } catch { setFailed(true); } finally { setPending(false); }
          }}>Nhờ Lê Sơn gọi lại</Button>
        )}
        <ButtonAnchor size="sm" variant="ghost" href={TEL} icon="phone">Gọi Lê Sơn</ButtonAnchor>
        {failed && <p className={s.error} role="alert">Chưa gửi được lời nhắc. Bạn thử lại nhé.</p>}
      </div>
    );
  }
  if (cancelled) {
    return r.kind === 'request'
      ? <div className={s.rowActions}><ButtonLink size="sm" variant="secondary" icon="send" to={`${paths.kh.book}?tu=${r.id}`}>Gửi lại yêu cầu tương tự</ButtonLink></div>
      : null;
  }
  if (r.status === 'rejected') return <div className={s.rowActions}><ButtonAnchor size="sm" variant="secondary" href={TEL} icon="phone">Gọi Lê Sơn</ButtonAnchor></div>;
  if (r.status === 'confirmed' && r.group === 'upcoming') {
    return (
      <div className={s.rowActions}>
        {!compact && <ButtonAnchor size="sm" variant="secondary" href={MAPS} external icon="navigation">Chỉ đường</ButtonAnchor>}
        <p className={s.note}>Cần đổi hoặc hủy lịch? Gọi <a href={TEL}>{HOTLINE}</a>.</p>
      </div>
    );
  }
  if (r.status === 'pending' || r.status === 'contacting') {
    return <div className={s.rowActions}><p className={s.note}>Muốn đổi thông tin hoặc hủy? Gọi <a href={TEL}>{HOTLINE}</a>.</p></div>;
  }
  return null;
}

export function BookingRow({ r }: { r: CustomerBookingRow }) {
  const agreed = r.appointmentAt && !r.appointmentCancelled;
  const pastDate = r.status === 'confirmed' && r.group === 'past' && !r.appointmentCancelled;
  return (
    <article className={cx(s.row, pastDate && s.rowPast)}>
      {agreed ? <DateBlock iso={r.appointmentAt!} /> : r.desiredDate ? <DateBlock iso={`${r.desiredDate}T12:00:00+07:00`} outline label="mong muốn" /> : <DateBlock iso={r.appointmentAt ?? r.createdAt} outline />}
      <div className={s.rowBody}>
        <div className={s.rowTop}>
          <h3 className={s.rowTitle}>{serviceLabel(r.service)} · bé {r.petName}</h3>
          <StatusPill pill={rowPill(r)} />
          {pastDate && <span className={s.greyTag}>Ngày hẹn đã qua</span>}
          {r.viaPhone && <span className={s.greyTag}><Icon name="phone" size={13} /> Đặt qua điện thoại</span>}
          {r.viaCounter && <span className={s.greyTag}><Icon name="house" size={13} /> Đặt tại quầy</span>}
        </div>
        <p className={s.rowText}>{explain(r)}</p>
        <RowActions r={r} />
        {r.kind === 'request' && (
          <AppLink to={paths.kh.request(r.id)} className={s.more}>Xem chi tiết{r.code ? ` ${r.code}` : ''} <Icon name="chevron-right" size={16} /></AppLink>
        )}
      </div>
    </article>
  );
}
