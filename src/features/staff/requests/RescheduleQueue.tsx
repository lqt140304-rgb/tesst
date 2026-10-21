import { paths } from '@/app/routes';
import { staff, type StaffRescheduleRow } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { SERVICE_LABEL, TIME_SLOT_LABEL } from '@/data/contracts/enums';
import { dayOf, formatDateVi, formatTimeVi } from '@/lib/dates';
import { formatPhoneVi } from '@/lib/phone';
import { Button, ButtonLink, useToast } from '@/ui';
import s from './Reschedule.module.css';

/** "Khách xin đổi lịch": customers' wishes to move an appointment; staff call, then move it in the calendar or keep the time. Hidden when empty or not allowed. */
export function RescheduleQueue() {
  const q = useQuery(() => staff.requests.reschedules().catch(() => [] as StaffRescheduleRow[]), []);
  const toast = useToast();
  const rows = q.data ?? [];
  if (rows.length === 0) return null;
  return (
    <section className={s.queue} data-reschedule-queue aria-labelledby="resched-title">
      <h2 id="resched-title" className={s.h2}>Khách xin đổi lịch ({rows.length})</h2>
      <ul className={s.list}>
        {rows.map((r) => (
          <li key={r.id} className={s.row} data-reschedule-row>
            <div className={s.body}>
              <p className={s.who}><strong>{r.petName}</strong> · {r.customerName} · <span className="num">{formatPhoneVi(r.phone)}</span></p>
              <p>{SERVICE_LABEL[r.service]} · lịch hiện tại <span className="num">{formatTimeVi(r.currentStart)} {formatDateVi(r.currentStart)}</span></p>
              <p>Khách muốn đổi sang <strong className="num">{formatDateVi(`${r.desiredDate}T12:00:00+07:00`)}</strong>{r.preferredSlot ? `, ${TIME_SLOT_LABEL[r.preferredSlot]}` : ''}</p>
              {r.reason && <p className={s.reason}>Lý do: {r.reason}</p>}
            </div>
            <div className={s.actions}>
              <ButtonLink size="sm" icon="calendar-days" to={`${paths.nv.calendar}?date=${dayOf(r.currentStart)}&lich=${encodeURIComponent(r.appointmentId)}`}>Mở lịch hẹn để dời</ButtonLink>
              <Button size="sm" variant="secondary" onClick={async () => { await staff.requests.keepAppointment(r.id); toast({ message: 'Đã giữ nguyên lịch hẹn.' }); }}>Không đổi</Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
