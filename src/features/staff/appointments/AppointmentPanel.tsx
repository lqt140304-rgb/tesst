import { useState } from 'react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { system } from '@/data/public';
import { staff, type StaffAppointment } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { APPOINTMENT_SOURCE_LABEL, SEX_LABEL, SPECIES_LABEL, TIME_SLOT_LABEL } from '@/data/contracts/enums';
import { dayOf, formatDateVi, formatTimeVi, todayVN } from '@/lib/dates';
import { Button, ButtonLink, Field, Icon, Input, PetAvatar, Select, StatusPill, Textarea, statusPill, useToast } from '@/ui';
import { FormError, MiniTag, ServiceChip, Tel, dayLabel, saveError } from '../ui';
import s from './Calendar.module.css';
import st from '../Staff.module.css';

const RESCHEDULE_REASONS = ['Khách xin đổi giờ', 'Bệnh viện đổi lịch', 'Khác'];

/** The appointment beside the grid (replaces the old dialog): view, change time, cancel — R8 applied: no check-in, no "Xác nhận". */
export function AppointmentPanel({ apt, onClose, onMoved }: { apt: StaffAppointment; onClose: () => void; onMoved: (startAt: string) => void }) {
  const { can } = useSession();
  const [mode, setMode] = useState<'view' | 'move' | 'cancel'>('view');
  const [moveDate, setMoveDate] = useState<string | undefined>();
  const pet = useQuery(async () => (can('customers.view') ? (await staff.customers.get(apt.customerId)).pets.find((p) => p.id === apt.petId) ?? null : null), [apt.customerId, apt.petId]);
  const year = Number(todayVN(system.now()).slice(0, 4));
  const p = pet.data;
  const age = p?.birth_year ? (year - p.birth_year >= 1 ? `${year - p.birth_year} tuổi` : 'dưới 1 tuổi') : undefined;
  const line = [SPECIES_LABEL[apt.species], p?.breed, p?.sex && SEX_LABEL[p.sex], age].filter(Boolean).join(' · ');
  return (
    <div className={s.panel} data-appointment-panel>
      <header className={s.panelHead}>
        <PetAvatar name={apt.petName} species={apt.species} photoKey={apt.photoKey} size={96} decorative />
        <div className={s.panelWho}>
          <h2 tabIndex={-1} className={s.panelTitle}>{apt.petName}</h2>
          <p className={st.small}>{line}</p>
          <p className={st.small}>{can('customers.view') ? <AppLink to={paths.nv.customer(apt.customerId)} className={st.cellLink}>{apt.customerName}</AppLink> : apt.customerName}</p>
          <Tel e164={apt.customerPhone} />
        </div>
        <Button className={s.closeBtn} variant="ghost" size="sm" icon="x" iconOnly aria-label="Đóng chi tiết lịch hẹn" onClick={onClose} />
      </header>
      {mode === 'view' ? <View apt={apt} onMove={(d) => { setMoveDate(d); setMode('move'); }} onCancel={() => setMode('cancel')} />
        : mode === 'move' ? <Move apt={apt} initialDate={moveDate} onDone={(movedTo) => { setMode('view'); if (movedTo) onMoved(movedTo); }} />
        : <Cancel apt={apt} onDone={() => setMode('view')} />}
    </div>
  );
}

function View({ apt, onMove, onCancel }: { apt: StaffAppointment; onMove: (date?: string) => void; onCancel: () => void }) {
  const { can } = useSession();
  const toast = useToast();
  const [keeping, setKeeping] = useState(false);
  const today = todayVN(system.now());
  const end = new Date(Date.parse(apt.start_at) + apt.duration_min * 60_000);
  const source = apt.source === 'web_request' && apt.requestCode ? `Từ yêu cầu web ${apt.requestCode}` : apt.source === 'phone' ? 'Đặt qua điện thoại' : APPOINTMENT_SOURCE_LABEL[apt.source];
  const wish = apt.rescheduleRequest;
  const manage = can('appointments.manage');

  async function keep() {
    if (!wish) return;
    setKeeping(true);
    try { await staff.requests.keepAppointment(wish.id); toast({ message: 'Đã giữ nguyên lịch hẹn.' }); } catch { toast({ tone: 'error', message: 'Chưa lưu được. Bạn thử lại nhé.' }); } finally { setKeeping(false); }
  }

  return (
    <div className={st.form}>
      <div className={st.chipsWrap}>
        <StatusPill pill={statusPill('appointment', apt.status)} dense />
        {apt.past && apt.status === 'scheduled' && <MiniTag icon="clock">Đã qua</MiniTag>}
        <MiniTag icon={apt.source === 'web_request' ? 'send' : apt.source === 'phone' ? 'phone' : 'house'} tone="plum">{source}</MiniTag>
      </div>
      {apt.alerts.length > 0 && <div className={st.chipsWrap}>{apt.alerts.map((x) => <span key={x} className={st.alert}><Icon name="triangle-alert" size={13} />{x}</span>)}</div>}
      <dl className={st.kv}>
        <dt>Thời gian</dt><dd><span className="num">{formatTimeVi(apt.start_at)}–{formatTimeVi(end)}</span>, {dayLabel(apt.start_at)} · {apt.duration_min} phút</dd>
        <dt>Dịch vụ</dt><dd><ServiceChip service={apt.service} /></dd>
        <dt>Người phụ trách</dt><dd>{apt.assigneeName ?? 'Chưa phân công'}</dd>
        <dt>Mã lịch</dt><dd className={st.code}>{apt.code}</dd>
      </dl>
      {apt.note_internal && <div className={st.internal}><p className={st.meta}><Icon name="lock" size={12} /> Ghi chú nội bộ · khách không thấy</p><p>{apt.note_internal}</p></div>}
      {wish && apt.status === 'scheduled' && (
        <section className={s.wishBox} aria-labelledby={`wish-${apt.id}`}>
          <h3 id={`wish-${apt.id}`} className={s.wishTitle}><Icon name="clock" size={16} /> Khách xin đổi lịch</h3>
          <p>Mong muốn <strong className="num">{formatDateVi(`${wish.desiredDate}T12:00:00+07:00`)}</strong>{wish.preferredSlot ? `, ${TIME_SLOT_LABEL[wish.preferredSlot]}` : ''}</p>
          {wish.reason && <p className={st.small}>Lý do: {wish.reason}</p>}
          {(manage || can('requests.handle')) && (
            <div className={st.pageActions}>
              {manage && <Button size="sm" icon="calendar-days" onClick={() => onMove(wish.desiredDate)}>Dời theo mong muốn</Button>}
              <Button size="sm" variant="secondary" loading={keeping} onClick={() => void keep()}>Không đổi</Button>
            </div>
          )}
        </section>
      )}
      {apt.status === 'scheduled' && (
        <div className={st.pageActions}>
          {can('invoices.create') && dayOf(apt.start_at) <= today && (
            <ButtonLink to={`${paths.nv.invoiceNew}?khach=${apt.customerId}&be=${apt.petId}&lich=${apt.id}`} icon="receipt">Tạo hóa đơn</ButtonLink>
          )}
          {manage && <Button variant="secondary" icon="calendar-days" onClick={() => onMove()}>Đổi lịch</Button>}
          {manage && <Button variant="ghost" onClick={onCancel}>Hủy lịch</Button>}
        </div>
      )}
    </div>
  );
}

function Move({ apt, initialDate, onDone }: { apt: StaffAppointment; initialDate?: string; onDone: (movedTo?: string) => void }) {
  const toast = useToast();
  // The version seen when the form opened: a newer change from another tab must surface as a conflict, not be overwritten.
  const [version] = useState(apt.version);
  const today = todayVN(system.now());
  const [date, setDate] = useState(initialDate ?? (dayOf(apt.start_at) >= today ? dayOf(apt.start_at) : today));
  const [time, setTime] = useState(formatTimeVi(apt.start_at));
  const [reason, setReason] = useState(RESCHEDULE_REASONS[0]!);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!date || !time) { setErr('Vui lòng chọn đủ ngày và giờ hẹn.'); return; }
    setBusy(true);
    try {
      const start = `${date}T${time}:00+07:00`;
      await staff.appointments.reschedule(apt.id, version, { start_at: start, reason });
      toast({ message: `Đã dời lịch sang ${time}, ${dayLabel(start)}.` });
      onDone(start); // the calendar follows the appointment to its new day
    } catch (e) {
      setErr(saveError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={st.form}>
      <p className={st.small}>{apt.requestCode ? 'Yêu cầu vẫn ở trạng thái Đã xác nhận; khách sẽ thấy giờ mới.' : 'Khách sẽ thấy giờ mới trong tài khoản (nếu đã liên kết).'}</p>
      <FormError>{err}</FormError>
      <div className={st.two}>
        <Field label="Ngày mới"><Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Giờ mới"><Input type="time" step={300} value={time} onChange={(e) => setTime(e.target.value)} /></Field>
      </div>
      <Field label="Lý do">
        <Select value={reason} onChange={(e) => setReason(e.target.value)}>{RESCHEDULE_REASONS.map((r) => <option key={r}>{r}</option>)}</Select>
      </Field>
      <div className={st.pageActions}>
        <Button variant="ghost" onClick={() => onDone()}>Quay lại</Button>
        <Button icon="check" loading={busy} onClick={() => void save()}>Lưu giờ mới</Button>
      </div>
    </div>
  );
}

function Cancel({ apt, onDone }: { apt: StaffAppointment; onDone: () => void }) {
  const toast = useToast();
  const [version] = useState(apt.version);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!reason.trim()) { setErr('Bạn ghi lý do hủy lịch nhé.'); return; }
    setBusy(true);
    try {
      await staff.appointments.cancel(apt.id, version, { reason: reason.trim() });
      toast({ message: `Đã hủy lịch hẹn ${apt.code}.` });
      onDone();
    } catch (e) {
      setErr(saveError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={st.form}>
      <p className={st.small}>{apt.requestCode ? `Yêu cầu ${apt.requestCode} cũng chuyển sang Đã hủy với cùng lý do.` : 'Lịch hẹn sẽ được đánh dấu Đã hủy.'}</p>
      <Field label="Lý do hủy" error={err || undefined}>
        <Textarea rows={2} value={reason} onChange={(e) => { setReason(e.target.value); setErr(''); }} placeholder="Ví dụ: Khách báo bé đã khỏe, xin hủy." />
      </Field>
      <div className={st.pageActions}>
        <Button variant="ghost" onClick={onDone}>Quay lại</Button>
        <Button variant="danger" loading={busy} onClick={() => void save()}>Hủy lịch hẹn</Button>
      </div>
    </div>
  );
}
