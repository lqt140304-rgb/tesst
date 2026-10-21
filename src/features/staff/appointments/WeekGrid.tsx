import { system } from '@/data/public';
import type { StaffAppointment } from '@/data/staff';
import { dayOf, formatTimeVi } from '@/lib/dates';
import { cx } from '@/lib/cx';
import { shortDay } from '../ui';
import { Block } from './Block';
import { ROW, layoutColumn, minutesOf, weekDays, windowOf } from './gridMath';
import s from './Calendar.module.css';

/** Week view: seven day columns on one hour axis; a day's heading opens that day. */
export function WeekGrid({ from, today, items, focusId, dimmed, onOpen, onDay }: {
  from: string; today: string; items: StaffAppointment[]; focusId: string | null;
  dimmed: (a: StaffAppointment) => boolean; onOpen: (id: string) => void; onDay: (d: string) => void;
}) {
  const days = weekDays(from);
  const { startH, endH } = windowOf(items);
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i);
  const now = system.now();
  const nowMin = minutesOf(now.toISOString());
  const template = '56px repeat(7, minmax(0, 1fr))';
  return (
    <div className={s.dayGrid}>
      <div className={s.dayHead} style={{ gridTemplateColumns: template }}>
        <span />
        {days.map((d) => (
          <button key={d} type="button" className={cx(s.weekHead, d === today && s.isToday)} onClick={() => onDay(d)} aria-label={`Xem ngày ${shortDay(`${d}T12:00:00+07:00`)}`}>
            <span className={s.weekDay}>{shortDay(`${d}T12:00:00+07:00`)}</span>
          </button>
        ))}
      </div>
      <div className={s.dayBody} style={{ gridTemplateColumns: template, height: (endH - startH) * 2 * ROW }}>
        <div className={s.hours}>{hours.map((h) => <span key={h} style={{ top: (h - startH) * 2 * ROW }}>{String(h).padStart(2, '0')}:00</span>)}</div>
        {days.map((d) => {
          const own = items.filter((a) => dayOf(a.start_at) === d);
          const placed = layoutColumn(own, startH);
          return (
            <div key={d} className={cx(s.col, d === today && s.todayCol)} data-week-col data-date={d} aria-current={d === today ? 'date' : undefined}>
              {own.map((a) => {
                const p = placed.find((q) => q.id === a.id)!;
                return (
                  <div key={a.id} className={s.slot} style={{ top: p.top, height: p.height, left: `calc(${(p.col / p.cols) * 100}% + 2px)`, width: `calc(${100 / p.cols}% - 4px)` }}>
                    <Block a={a} focus={a.id === focusId} dim={dimmed(a)} onOpen={() => onOpen(a.id)} />
                  </div>
                );
              })}
              {d === today && nowMin >= startH * 60 && nowMin <= endH * 60 && (
                <div className={s.nowCol} style={{ top: ((nowMin - startH * 60) / 30) * ROW }} aria-hidden="true" title={formatTimeVi(now)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
