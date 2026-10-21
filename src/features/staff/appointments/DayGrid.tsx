import { useEffect, useRef } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { system } from '@/data/public';
import type { StaffAppointment } from '@/data/staff';
import { formatTimeVi } from '@/lib/dates';
import { EmptyState } from '@/ui';
import { Block } from './Block';
import { ROW, layoutColumn, minutesOf, windowOf } from './gridMath';
import s from './Calendar.module.css';

export const UNASSIGNED = '__none__';

/** Day view: one column per person (plus "Chưa phân công"), hour rows, appointments that overlap in time side by side. */
export function DayGrid({ date, today, items, people, focusId, dimmed, onOpen }: {
  date: string; today: string; items: StaffAppointment[]; people: { id: string; name: string }[]; focusId: string | null;
  dimmed: (a: StaffAppointment) => boolean; onOpen: (id: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { startH, endH } = windowOf(items);
  const cols = [
    ...people.filter((p) => items.some((a) => a.assigneeId === p.id)).map((p) => ({ id: p.id, name: p.name })),
    { id: UNASSIGNED, name: 'Chưa phân công' },
  ];
  const now = system.now();
  const nowMin = date === today ? minutesOf(now.toISOString()) : -1;

  // Bring the focused appointment (or "now", or the first one) into view once per day.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const target = items.find((a) => a.id === focusId) ?? items[0];
    const min = target ? minutesOf(target.start_at) : nowMin > 0 ? nowMin : 8 * 60;
    el.scrollTo({ top: Math.max(0, ((min - startH * 60) / 30) * ROW - ROW), behavior: reduce ? 'auto' : 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, focusId, items.length]);

  if (items.length === 0) return <EmptyState icon="calendar-days" title="Ngày này chưa có lịch hẹn." />;
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i);
  const template = `56px repeat(${cols.length}, minmax(150px, 1fr))`;
  return (
    <div className={s.dayGrid} ref={scroller}>
      <div className={s.dayHead} style={{ gridTemplateColumns: template }}>
        <span />
        {cols.map((c) => <span key={c.id} className={s.colName}>{c.name}</span>)}
      </div>
      <div className={s.dayBody} style={{ gridTemplateColumns: template, height: (endH - startH) * 2 * ROW }}>
        <div className={s.hours}>{hours.map((h) => <span key={h} style={{ top: (h - startH) * 2 * ROW }}>{String(h).padStart(2, '0')}:00</span>)}</div>
        {cols.map((c) => {
          const own = items.filter((a) => (c.id === UNASSIGNED ? !a.assigneeId : a.assigneeId === c.id));
          const placed = layoutColumn(own, startH);
          return (
            <div key={c.id} className={s.col}>
              {own.map((a) => {
                const p = placed.find((q) => q.id === a.id)!;
                return (
                  <div key={a.id} className={s.slot} style={{ top: p.top, height: p.height, left: `calc(${(p.col / p.cols) * 100}% + 4px)`, width: `calc(${100 / p.cols}% - 8px)` }}>
                    <Block a={a} focus={a.id === focusId} dim={dimmed(a)} onOpen={() => onOpen(a.id)} />
                  </div>
                );
              })}
            </div>
          );
        })}
        {nowMin >= startH * 60 && nowMin <= endH * 60 && (
          <m.div className={s.now} style={{ top: ((nowMin - startH * 60) / 30) * ROW }} initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6 }}>
            <span>{formatTimeVi(now)}</span>
          </m.div>
        )}
      </div>
    </div>
  );
}
