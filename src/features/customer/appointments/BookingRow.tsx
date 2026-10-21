import { useState } from 'react';
import { paths } from '@/app/routes';
import { customer, type CustomerBookingRow } from '@/data/customer';
import { formatTimeVi } from '@/lib/dates';
import { Button, ButtonAnchor, ButtonLink, statusPill } from '@/ui';
import { HOTLINE, MAPS, TEL, whenVi } from '../ui';
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

/** Pill for lists: a confirmed row whose date has passed reads "Đã qua" (never "Hoàn thành"); everything else keeps its request word. */
export function listPill(r: CustomerBookingRow) {
  return r.group === 'past' && r.status === 'confirmed' && !r.appointmentCancelled
    ? { label: 'Đã qua', tone: 'grey' as const, icon: 'clock' as const }
    : rowPill(r);
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
