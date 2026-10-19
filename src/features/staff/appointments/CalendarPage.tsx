import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { m, useReducedMotion } from 'motion/react';
import { useSession } from '@/app/session/SessionProvider';
import { system } from '@/data/public';
import { staff, type StaffAppointment } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { addDays, dayOf, formatDateVi, formatLongDayVi, formatTimeVi, todayVN } from '@/lib/dates';
import { Button, Checkbox, EmptyState, Icon, Select, Tabs } from '@/ui';
import { cx } from '@/lib/cx';
import { PageHeader, PetChip, ServiceChip, shortDay } from '../ui';
import { AppointmentDialog } from './AppointmentDialog';
import { NewAppointmentDialog } from './NewAppointmentDialog';
import s from './Calendar.module.css';
import st from '../Staff.module.css';

type View = 'ngay' | 'tuan';
const START_H = 7, END_H = 21, ROW = 48; // 30-minute rows, 07:00–21:00 visible window (scrolls; not opening hours)
const UNASSIGNED = '__none__';
const SURNAME = (full: string) => full.trim().split(/\s+/).pop() ?? full;

const mondayOf = (date: string) => addDays(date, -((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7));
const minutesOf = (iso: string) => { const [h, mm] = formatTimeVi(iso).split(':').map(Number); return h! * 60 + mm!; };

/** Lịch hẹn (staff §4.2): day / week, no drag (reschedule goes through the dialog and its reason). */
export function CalendarPage() {
  const { can } = useSession();
  const [params, setParams] = useSearchParams();
  const today = todayVN(system.now());
  const view: View = params.get('view') === 'tuan' ? 'tuan' : 'ngay';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.get('date') ?? '') ? params.get('date')! : today;
  const openId = params.get('lich');
  const [assignee, setAssignee] = useState('');
  const [showCancelled, setShowCancelled] = useState(false);
  const [creating, setCreating] = useState(false);

  const from = view === 'ngay' ? date : mondayOf(date);
  const to = view === 'ngay' ? date : addDays(from, 6);
  const q = useQuery(() => staff.appointments.listRange(from, to, assignee && assignee !== UNASSIGNED ? { assignee_id: assignee } : undefined), [from, to, assignee]);
  const people = useQuery(() => staff.appointments.assignees(), []);
  const all = (q.data ?? []).filter((a) => (showCancelled || a.status === 'scheduled') && (assignee !== UNASSIGNED || !a.assigneeId));
  const selected = (q.data ?? []).find((a) => a.id === openId) ?? null;

  function go(next: Partial<{ view: View; date: string; lich: string | null }>) {
    const p = new URLSearchParams(params);
    if (next.view) p.set('view', next.view);
    if (next.date) p.set('date', next.date);
    if (next.lich === null) p.delete('lich'); else if (next.lich) p.set('lich', next.lich);
    if (!p.get('view')) p.set('view', view);
    setParams(p, { replace: next.lich !== undefined });
  }
  const step = view === 'ngay' ? 1 : 7;
  const label = view === 'ngay' ? formatLongDayVi(`${date}T12:00:00+07:00`)
    : `${from.slice(8, 10)}${from.slice(5, 7) === to.slice(5, 7) ? '' : `/${from.slice(5, 7)}`} – ${formatDateVi(`${to}T12:00:00+07:00`)}`;

  return (
    <>
      <PageHeader title="Lịch hẹn" sub="Lịch đã xác nhận với khách, đặt qua điện thoại hoặc tại quầy."
        actions={can('appointments.manage') && <Button icon="calendar-plus" onClick={() => setCreating(true)}>Tạo lịch hẹn</Button>} />
      <div className={s.toolbar}>
        <div className={s.nav}>
          <Button variant="secondary" size="sm" onClick={() => go({ date: today })}>Hôm nay</Button>
          <Button variant="ghost" size="sm" icon="chevron-left" iconOnly aria-label={view === 'ngay' ? 'Ngày trước' : 'Tuần trước'} onClick={() => go({ date: addDays(date, -step) })} />
          <Button variant="ghost" size="sm" icon="chevron-right" iconOnly aria-label={view === 'ngay' ? 'Ngày sau' : 'Tuần sau'} onClick={() => go({ date: addDays(date, step) })} />
          <h2 className={s.dateLabel} aria-live="polite">{label}</h2>
        </div>
        <Tabs<View> label="Kiểu xem" value={view} onChange={(v) => go({ view: v })} items={[{ value: 'ngay', label: 'Ngày' }, { value: 'tuan', label: 'Tuần' }]} />
        <Select aria-label="Người phụ trách" value={assignee} onChange={(e) => setAssignee(e.target.value)} className={s.select}>
          <option value="">Mọi người phụ trách</option>
          {(people.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          <option value={UNASSIGNED}>Chưa phân công</option>
        </Select>
        <Checkbox label="Hiện lịch đã hủy" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />
      </div>

      {q.isLoading && !q.data ? <div className={s.skel} aria-busy="true" aria-label="Đang tải" /> : view === 'ngay'
        ? <DayView date={date} today={today} items={all} people={people.data ?? []} focusId={openId} onOpen={(id) => go({ lich: id })} />
        : <WeekView from={from} today={today} items={all} onOpen={(id) => go({ lich: id })} onDay={(d) => go({ view: 'ngay', date: d })} />}

      <AppointmentDialog apt={selected} onClose={() => go({ lich: null })} />
      {can('appointments.manage') && <NewAppointmentDialog key={creating ? date : 'closed'} open={creating} onClose={() => setCreating(false)} defaultDate={date < today ? today : date} onCreated={(start, id) => go({ view: 'ngay', date: start.slice(0, 10), lich: id })} />}
    </>
  );
}

function Block({ a, onOpen, focus }: { a: StaffAppointment; onOpen: () => void; focus?: boolean }) {
  return (
    <button type="button" className={cx(s.block, s[`svc_${a.service}`], a.status === 'cancelled' && s.cancelled, a.past && s.past, focus && s.focus)} onClick={onOpen} data-appointment
      aria-label={`${formatTimeVi(a.start_at)} · ${a.petName} · ${a.customerName}${a.status === 'cancelled' ? ' · đã hủy' : ''}`}>
      <span className={s.blockTime}>{formatTimeVi(a.start_at)}{a.status === 'cancelled' && <Icon name="circle-x" size={13} />}</span>
      <span className={s.blockPet}>{a.petName}</span>
      <span className={s.blockMeta}>{a.service === 'kham' ? 'Khám' : a.service === 'spa' ? 'Spa' : 'Nội trú'} · {SURNAME(a.customerName)}</span>
    </button>
  );
}

function DayView({ date, today, items, people, focusId, onOpen }: {
  date: string; today: string; items: StaffAppointment[]; people: { id: string; name: string }[]; focusId: string | null; onOpen: (id: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
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
    el.scrollTo({ top: Math.max(0, ((min - START_H * 60) / 30) * ROW - ROW), behavior: reduce ? 'auto' : 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, focusId, items.length]);

  if (items.length === 0) return <EmptyState icon="calendar-days" title="Ngày này chưa có lịch hẹn." />;
  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);
  return (
    <>
      <div className={s.dayGrid} ref={scroller}>
        <div className={s.dayHead} style={{ gridTemplateColumns: `56px repeat(${cols.length}, minmax(150px, 1fr))` }}>
          <span />
          {cols.map((c) => <span key={c.id} className={s.colName}>{c.name}</span>)}
        </div>
        <div className={s.dayBody} style={{ gridTemplateColumns: `56px repeat(${cols.length}, minmax(150px, 1fr))`, height: (END_H - START_H) * 2 * ROW }}>
          <div className={s.hours}>{hours.map((h) => <span key={h} style={{ top: (h - START_H) * 2 * ROW }}>{String(h).padStart(2, '0')}:00</span>)}</div>
          {cols.map((c) => (
            <div key={c.id} className={s.col}>
              {items.filter((a) => (c.id === UNASSIGNED ? !a.assigneeId : a.assigneeId === c.id)).map((a) => {
                const top = Math.max(0, ((minutesOf(a.start_at) - START_H * 60) / 30) * ROW);
                return (
                  <div key={a.id} className={s.slot} style={{ top, height: Math.max(ROW - 4, (a.duration_min / 30) * ROW - 4) }}>
                    <Block a={a} focus={a.id === focusId} onOpen={() => onOpen(a.id)} />
                  </div>
                );
              })}
            </div>
          ))}
          {nowMin >= START_H * 60 && nowMin <= END_H * 60 && (
            <m.div className={s.now} style={{ top: ((nowMin - START_H * 60) / 30) * ROW }} initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6 }}>
              <span>{formatTimeVi(now)}</span>
            </m.div>
          )}
        </div>
      </div>
      <Agenda items={items} onOpen={onOpen} className={s.phoneOnly} />
    </>
  );
}

function WeekView({ from, today, items, onOpen, onDay }: { from: string; today: string; items: StaffAppointment[]; onOpen: (id: string) => void; onDay: (d: string) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
  return (
    <>
      <div className={s.week}>
        {days.map((d) => {
          const list = items.filter((a) => dayOf(a.start_at) === d);
          return (
            <section key={d} className={cx(s.weekCol, d === today && s.isToday)}>
              <button type="button" className={s.weekHead} onClick={() => onDay(d)} aria-label={`Xem ngày ${shortDay(`${d}T12:00:00+07:00`)}`}>
                <span className={s.weekDay}>{shortDay(`${d}T12:00:00+07:00`)}</span>
                <span className={st.meta}>{list.length} lịch</span>
              </button>
              <ul className={s.weekList}>
                {list.map((a) => (
                  <li key={a.id}>
                    <button type="button" className={cx(s.weekChip, s[`svc_${a.service}`], a.status === 'cancelled' && s.cancelled)} onClick={() => onOpen(a.id)} data-appointment>
                      {formatTimeVi(a.start_at)} · {a.petName} · {a.service === 'kham' ? 'Khám' : a.service === 'spa' ? 'Spa' : 'Nội trú'}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <div className={s.phoneOnly}>
        <div className={s.strip} role="list">
          {days.map((d) => {
            const n = items.filter((a) => dayOf(a.start_at) === d).length;
            return (
              <button key={d} type="button" role="listitem" className={cx(s.stripDay, d === today && s.isToday)} onClick={() => onDay(d)}>
                <span>{shortDay(`${d}T12:00:00+07:00`).split(' ')[0]}</span><strong>{d.slice(8, 10)}</strong>
                <span className={s.dots} aria-label={`${n} lịch`}>{Array.from({ length: Math.min(n, 4) }, (_, i) => <i key={i} />)}</span>
              </button>
            );
          })}
        </div>
        <Agenda items={items} onOpen={onOpen} grouped />
      </div>
    </>
  );
}

function Agenda({ items, onOpen, grouped, className }: { items: StaffAppointment[]; onOpen: (id: string) => void; grouped?: boolean; className?: string }) {
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
                <button type="button" className={cx(s.agendaRow, a.status === 'cancelled' && s.cancelled)} onClick={() => onOpen(a.id)} data-appointment>
                  <span className={st.rowTime}>{formatTimeVi(a.start_at)}</span>
                  <span className={st.rowMain}>
                    <span className={st.chipsWrap}><PetChip name={a.petName} species={a.species} /><ServiceChip service={a.service} short /></span>
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
