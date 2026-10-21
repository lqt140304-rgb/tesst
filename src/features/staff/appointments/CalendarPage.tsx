import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { useAppNavigate } from '@/app/nav';
import { useSession } from '@/app/session/SessionProvider';
import { system } from '@/data/public';
import { staff } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { addDays, formatDateVi, formatLongDayVi, todayVN } from '@/lib/dates';
import { Button, Checkbox, Icon, MasterDetail, Select, Tabs } from '@/ui';
import { PageHeader } from '../ui';
import { Agenda, WeekStrip } from './Agenda';
import { AppointmentPanel } from './AppointmentPanel';
import { DayGrid, UNASSIGNED } from './DayGrid';
import { NewAppointmentDialog } from './NewAppointmentDialog';
import { WeekGrid } from './WeekGrid';
import { mondayOf } from './gridMath';
import { matchesAppointment } from './search';
import s from './Calendar.module.css';
import st from '../Staff.module.css';

type View = 'ngay' | 'tuan';

/** Lịch hẹn (staff §4.2): day / week grids on wide screens, an agenda on phones; quick search dims what does not match. No drag: moving goes through the form and its reason. */
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
  const [query, setQuery] = useState('');
  const nav = useAppNavigate();
  const opened = (useLocation().state as { opened?: boolean } | null)?.opened === true;

  const from = view === 'ngay' ? date : mondayOf(date);
  const to = view === 'ngay' ? date : addDays(from, 6);
  const q = useQuery(() => staff.appointments.listRange(from, to, assignee && assignee !== UNASSIGNED ? { assignee_id: assignee } : undefined), [from, to, assignee]);
  const people = useQuery(() => staff.appointments.assignees(), []);
  const all = (q.data ?? []).filter((a) => (showCancelled || a.status === 'scheduled') && (assignee !== UNASSIGNED || !a.assigneeId));
  const selected = (q.data ?? []).find((a) => a.id === openId) ?? null;
  const searching = query.trim().length > 0;
  const matching = all.filter((a) => matchesAppointment(a, query));
  const dimmed = (a: (typeof all)[number]) => searching && !matchesAppointment(a, query);

  /** Opening a different appointment while one is open replaces the entry; the first opening adds one, so Back returns to the calendar. */
  function go(next: Partial<{ view: View; date: string; lich: string | null }>) {
    const p = new URLSearchParams(params);
    if (next.view) p.set('view', next.view);
    if (next.date) p.set('date', next.date);
    if (next.lich === null) p.delete('lich'); else if (next.lich) p.set('lich', next.lich);
    if (!p.get('view')) p.set('view', view);
    const opening = !!next.lich;
    setParams(p, { replace: next.lich === undefined || (opening && !!openId) || next.lich === null, state: opening ? { opened: true } : undefined });
  }
  const close = () => (opened ? nav(-1) : go({ lich: null }));
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('[role="dialog"]')) close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, opened]);
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
        <label className={st.search}>
          <Icon name="search" size={18} />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tên khách, thú cưng…" aria-label="Tìm lịch hẹn" />
        </label>
        <Select aria-label="Người phụ trách" value={assignee} onChange={(e) => setAssignee(e.target.value)} className={s.select}>
          <option value="">Mọi người phụ trách</option>
          {(people.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          <option value={UNASSIGNED}>Chưa phân công</option>
        </Select>
        <Checkbox label="Hiện lịch đã hủy" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />
      </div>
      <p className={s.matchCount} role="status">{searching ? (matching.length > 0 ? `${matching.length} lịch khớp` : 'Không có lịch nào khớp.') : ''}</p>

      {q.isLoading && !q.data ? <div className={s.skel} aria-busy="true" aria-label="Đang tải" /> : (
        <MasterDetail label="Chi tiết lịch hẹn" backLabel="Lịch hẹn" detailKey={openId ?? undefined} onBack={close} focusDetail
          list={view === 'ngay' ? (
            <>
              <DayGrid date={date} today={today} items={all} people={people.data ?? []} focusId={openId} dimmed={dimmed} onOpen={(id) => go({ lich: id })} />
              <Agenda items={matching} onOpen={(id) => go({ lich: id })} className={s.phoneOnly} />
            </>
          ) : (
            <>
              <WeekGrid from={from} today={today} items={all} focusId={openId} dimmed={dimmed} onOpen={(id) => go({ lich: id })} onDay={(d) => go({ view: 'ngay', date: d })} />
              <div className={s.phoneOnly}>
                <WeekStrip from={from} today={today} items={all} onDay={(d) => go({ view: 'ngay', date: d })} />
                <Agenda items={matching} onOpen={(id) => go({ lich: id })} grouped />
              </div>
            </>
          )}
          detail={!openId ? null : selected ? <AppointmentPanel apt={selected} onClose={close} /> : (
            <div className={s.missing}>
              <h2 tabIndex={-1} className={s.panelTitle}>Không tìm thấy lịch hẹn này.</h2>
              <p className={st.small}>Lịch có thể đã bị xóa hoặc nằm ở ngày khác.</p>
              <Button variant="secondary" onClick={close}>Về lịch hẹn</Button>
            </div>
          )} />
      )}

      {can('appointments.manage') && <NewAppointmentDialog key={creating ? date : 'closed'} open={creating} onClose={() => setCreating(false)} defaultDate={date < today ? today : date} onCreated={(start, id) => go({ view: 'ngay', date: start.slice(0, 10), lich: id })} />}
    </>
  );
}

