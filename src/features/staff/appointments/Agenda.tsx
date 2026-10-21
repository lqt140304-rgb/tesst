import type { StaffAppointment } from '@/data/staff';
import { dayOf, formatLongDayVi, formatTimeVi } from '@/lib/dates';
import { Icon } from '@/ui';
import { cx } from '@/lib/cx';
import { PetChip, ServiceChip, shortDay } from '../ui';
import { weekDays } from './gridMath';
import s from './Calendar.module.css';
import st from '../Staff.module.css';

/** Phones: appointments as a list (grouped by day in week view). */
export function Agenda({ items, onOpen, grouped, className }: { items: StaffAppointment[]; onOpen: (id: string) => void; grouped?: boolean; className?: string }) {
  const groups: [string, StaffAppointment[]][] = [];
  for (const a of items) {
    const d = dayOf(a.start_at);
    const last = groups[groups.length - 1];
    if (last && last[0] === d) last[1].push(a); else groups.push([d, [a]]);
  }
  if (items.length === 0) return grouped ? <p className={st.empty}>Tuần này chưa có lịch hẹn.</p> : null;
  return (
    <div className={cx(s.agenda, className)}>
      {groups.map(([d, list]) => (
        <section key={d} className={s.agendaDay}>
          {grouped && <h3 className={s.agendaTitle}>{formatLongDayVi(`${d}T12:00:00+07:00`)}</h3>}
          <ul className={st.rows}>
            {list.map((a) => (
              <li key={a.id}>
                <button type="button" className={cx(s.agendaRow, a.status === 'cancelled' && s.cancelled)} onClick={() => onOpen(a.id)} data-appointment data-start={a.start_at}>
                  <span className={st.rowTime}>{formatTimeVi(a.start_at)}</span>
                  <span className={st.rowMain}>
                    <span className={st.chipsWrap}><PetChip name={a.petName} species={a.species} /><ServiceChip service={a.service} short />{a.rescheduleRequest && <span className={st.alert}><Icon name="clock" size={12} />Chờ đổi lịch</span>}</span>
                    <span className={st.meta}>{a.customerName} · {a.assigneeName ?? 'Chưa phân công'}{a.status === 'cancelled' ? ' · Đã hủy' : ''}</span>
                  </span>
                  <Icon name="chevron-right" size={18} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Phones, week view: seven day buttons with a dot per appointment (and a ring when one waits for a reschedule decision). */
export function WeekStrip({ from, today, items, onDay }: { from: string; today: string; items: StaffAppointment[]; onDay: (d: string) => void }) {
  return (
    <div className={s.strip} role="list">
      {weekDays(from).map((d) => {
        const own = items.filter((a) => dayOf(a.start_at) === d);
        return (
          <button key={d} type="button" role="listitem" className={cx(s.stripDay, d === today && s.isToday)} onClick={() => onDay(d)}>
            <span>{shortDay(`${d}T12:00:00+07:00`).split(' ')[0]}</span><strong>{d.slice(8, 10)}</strong>
            <span className={s.dots} aria-hidden="true">{Array.from({ length: Math.min(own.length, 4) }, (_, i) => <i key={i} />)}{own.some((a) => a.rescheduleRequest) && <b className={s.wishDot} />}</span>
            <span className="sr-only">{own.length} lịch{own.some((a) => a.rescheduleRequest) ? ', có lịch chờ đổi' : ''}</span>
          </button>
        );
      })}
    </div>
  );
}
