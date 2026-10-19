import { useState } from 'react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { system } from '@/data/public';
import { staff, type StaffAppointment } from '@/data/staff';
import { APPOINTMENT_SOURCE_LABEL } from '@/data/contracts/enums';
import { dayOf, formatTimeVi, todayVN } from '@/lib/dates';
import { Button, ButtonLink, Dialog, Field, Icon, Input, Select, StatusPill, Textarea, statusPill, useToast } from '@/ui';
import { FormError, MiniTag, PetChip, ServiceChip, Tel, dayLabel, saveError } from '../ui';
import st from '../Staff.module.css';

const RESCHEDULE_REASONS = ['Khách xin đổi giờ', 'Bệnh viện đổi lịch', 'Khác'];

/** Appointment drawer (staff §4.2) with R8 applied: no check-in / no-show; "Tạo hóa đơn" for today or earlier. */
export function AppointmentDialog({ apt, onClose }: { apt: StaffAppointment | null; onClose: () => void }) {
  const [mode, setMode] = useState<'view' | 'move' | 'cancel'>('view');
  const close = () => { setMode('view'); onClose(); };
  return (
    <Dialog open={!!apt} onClose={close} title={apt ? `${formatTimeVi(apt.start_at)}, ${dayLabel(apt.start_at)} · ${apt.petName}` : ''}>
      {apt && (mode === 'view' ? <View apt={apt} onMove={() => setMode('move')} onCancel={() => setMode('cancel')} />
        : mode === 'move' ? <Move apt={apt} onDone={() => setMode('view')} />
        : <Cancel apt={apt} onDone={(closed) => (closed ? close() : setMode('view'))} />)}
    </Dialog>
  );
}

function View({ apt, onMove, onCancel }: { apt: StaffAppointment; onMove: () => void; onCancel: () => void }) {
  const { can } = useSession();
  const today = todayVN(system.now());
  const end = new Date(Date.parse(apt.start_at) + apt.duration_min * 60_000);
  const source = apt.source === 'web_request' && apt.requestCode ? `Từ yêu cầu web ${apt.requestCode}` : apt.source === 'phone' ? 'Đặt qua điện thoại' : APPOINTMENT_SOURCE_LABEL[apt.source];
  return (
    <div className={st.form}>
      <div className={st.chipsWrap}>
        <StatusPill pill={statusPill('appointment', apt.status)} dense />
        {apt.past && apt.status === 'scheduled' && <MiniTag icon="clock">Đã qua</MiniTag>}
        <MiniTag icon={apt.source === 'web_request' ? 'send' : apt.source === 'phone' ? 'phone' : 'house'} tone="plum">{source}</MiniTag>
      </div>
      {apt.alerts.length > 0 && <div className={st.chipsWrap}>{apt.alerts.map((x) => <span key={x} className={st.alert}><Icon name="triangle-alert" size={13} />{x}</span>)}</div>}
      <dl className={st.kv}>
        <dt>Thú cưng</dt><dd><PetChip name={apt.petName} species={apt.species} /></dd>
        <dt>Khách hàng</dt><dd>{can('customers.view') ? <AppLink to={paths.nv.customer(apt.customerId)} className={st.cellLink}>{apt.customerName}</AppLink> : apt.customerName}</dd>
        <dt>Số điện thoại</dt><dd><Tel e164={apt.customerPhone} /></dd>
        <dt>Dịch vụ</dt><dd><ServiceChip service={apt.service} /></dd>
        <dt>Thời gian</dt><dd>{formatTimeVi(apt.start_at)}–{formatTimeVi(end)}, {dayLabel(apt.start_at)} · {apt.duration_min} phút</dd>
        <dt>Người phụ trách</dt><dd>{apt.assigneeName ?? 'Chưa phân công'}</dd>
        <dt>Mã lịch</dt><dd className={st.code}>{apt.code}</dd>
      </dl>
      {apt.note_internal && <div className={st.internal}><p className={st.meta}><Icon name="lock" size={12} /> Ghi chú nội bộ · khách không thấy</p><p>{apt.note_internal}</p></div>}
      {apt.status === 'scheduled' && (
        <div className={st.pageActions}>
          {can('invoices.create') && dayOf(apt.start_at) <= today && (
            <ButtonLink to={`${paths.nv.invoiceNew}?khach=${apt.customerId}&be=${apt.petId}&lich=${apt.id}`} icon="receipt">Tạo hóa đơn</ButtonLink>
          )}
          {can('appointments.manage') && <Button variant="secondary" icon="calendar-days" onClick={onMove}>Dời lịch…</Button>}
          {can('appointments.manage') && <Button variant="ghost" onClick={onCancel}>Hủy lịch…</Button>}
        </div>
      )}
    </div>
  );
}

function Move({ apt, onDone }: { apt: StaffAppointment; onDone: () => void }) {
  const toast = useToast();
  const today = todayVN(system.now());
  const [date, setDate] = useState(dayOf(apt.start_at) >= today ? dayOf(apt.start_at) : today);
  const [time, setTime] = useState(formatTimeVi(apt.start_at));
  const [reason, setReason] = useState(RESCHEDULE_REASONS[0]!);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!date || !time) { setErr('Vui lòng chọn đủ ngày và giờ hẹn.'); return; }
    setBusy(true);
    try {
      const start = `${date}T${time}:00+07:00`;
      await staff.appointments.reschedule(apt.id, apt.version, { start_at: start, reason });
      toast({ message: `Đã dời lịch sang ${time}, ${dayLabel(start)}.` });
      onDone();
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
        <Button variant="ghost" onClick={onDone}>Quay lại</Button>
        <Button icon="check" loading={busy} onClick={() => void save()}>Lưu giờ mới</Button>
      </div>
    </div>
  );
}

function Cancel({ apt, onDone }: { apt: StaffAppointment; onDone: (closed: boolean) => void }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!reason.trim()) { setErr('Bạn ghi lý do hủy lịch nhé.'); return; }
    setBusy(true);
    try {
      await staff.appointments.cancel(apt.id, apt.version, { reason: reason.trim() });
      toast({ message: `Đã hủy lịch hẹn ${apt.code}.` });
      onDone(true);
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
        <Button variant="ghost" onClick={() => onDone(false)}>Quay lại</Button>
        <Button variant="danger" loading={busy} onClick={() => void save()}>Hủy lịch hẹn</Button>
      </div>
    </div>
  );
}
