import { useState } from 'react';
import { system } from '@/data/public';
import { staff } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { SERVICE_LABEL, SERVICES, type Service } from '@/data/contracts/enums';
import { formatTimeVi, todayVN } from '@/lib/dates';
import { formatPhoneVi } from '@/lib/phone';
import { Button, ChipGroup, Dialog, Field, Icon, Input, Select, Textarea, useToast } from '@/ui';
import { durationChoices, endTimeOf, holidayNotice, minutesFor, useAppSettings } from '@/app/prefs';
import { FormError, dayLabel, saveError } from '../ui';
import st from '../Staff.module.css';

/** "Tạo lịch hẹn" for phone or walk-in bookings: no request record is created (staff §4.2). */
export function NewAppointmentDialog({ open, onClose, defaultDate, onCreated }: {
  open: boolean; onClose: () => void; defaultDate: string; onCreated: (startAt: string, id: string) => void;
}) {
  const toast = useToast();
  const today = todayVN(system.now());
  const [q, setQ] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [petId, setPetId] = useState('');
  const [service, setService] = useState<Service>('kham');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('');
  const settings = useAppSettings();
  const [picked, setPicked] = useState<number>();
  const duration = picked ?? minutesFor(service, settings); // the settings' default until the person picks one
  const [assignee, setAssignee] = useState('');
  const [source, setSource] = useState<'phone' | 'walk_in'>('phone');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const notice = holidayNotice(date, endTimeOf(time, duration), settings.holidays);

  const found = useQuery(() => (q.trim().length >= 2 ? staff.customers.list(q) : Promise.resolve([])), [q]);
  const record = useQuery(() => (customerId ? staff.customers.get(customerId) : Promise.resolve(null)), [customerId]);
  const people = useQuery(() => staff.appointments.assignees(), []);

  async function submit() {
    const e: Record<string, string> = {};
    if (!customerId) e.customer = 'Bạn chọn hồ sơ khách hàng nhé.';
    if (!petId) e.pet = 'Bạn chọn thú cưng nhé.';
    if (!date || !time) e.when = 'Vui lòng chọn đủ ngày và giờ hẹn.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const start = `${date}T${time}:00+07:00`;
      const id = await staff.appointments.create({ customer_id: customerId, pet_id: petId, service, start_at: start, duration_min: duration, assignee_id: assignee || undefined, source, note_internal: note.trim() || undefined });
      toast({ message: `Đã tạo lịch hẹn lúc ${formatTimeVi(start)}, ${dayLabel(start)}.` });
      onClose();
      onCreated(start, id);
    } catch (x) {
      setErrors({ form: saveError(x) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} wide title="Tạo lịch hẹn" intro="Dùng cho lịch đặt qua điện thoại hoặc tại quầy."
      footer={<>
        <Button variant="ghost" onClick={onClose}>Để sau</Button>
        <Button icon="calendar-plus" loading={busy} onClick={() => void submit()}>Tạo lịch hẹn</Button>
      </>}>
      <div className={st.form}>
        <FormError>{errors.form}</FormError>
        <Field label="Khách hàng" error={errors.customer} hint="Tìm theo tên, số điện thoại hoặc tên thú cưng.">
          <Input type="search" value={q} onChange={(e) => { setQ(e.target.value); setCustomerId(''); setPetId(''); }} placeholder="VD: Lan, 0901…, Miu" />
        </Field>
        {!customerId && (found.data ?? []).length > 0 && (
          <fieldset className={st.radioList}>
            <legend className="sr-only">Chọn hồ sơ</legend>
            {(found.data ?? []).slice(0, 5).map((c) => (
              <label key={c.id} className={st.radio}>
                <input type="radio" name="new-apt-customer" checked={customerId === c.id} onChange={() => { setCustomerId(c.id); setQ(`${c.full_name} · ${c.code}`); }} />
                <span>{c.full_name} · {c.code}<small>{formatPhoneVi(c.phone)} · {c.petNames.join(', ') || 'Chưa có thú cưng'}</small></span>
              </label>
            ))}
          </fieldset>
        )}
        {record.data && (
          <fieldset className={st.radioList}>
            <legend>Thú cưng</legend>
            {record.data.pets.length === 0 && <p className={st.meta}>Hồ sơ chưa có thú cưng. Thêm trong trang hồ sơ khách hàng trước nhé.</p>}
            {record.data.pets.map((p) => (
              <label key={p.id} className={st.radio}>
                <input type="radio" name="new-apt-pet" checked={petId === p.id} onChange={() => setPetId(p.id)} />
                <span>{p.name}{p.breed ? ` · ${p.breed}` : ''}{p.alerts.length > 0 && <small>{p.alerts.join(' · ')}</small>}</span>
              </label>
            ))}
            {errors.pet && <p className={st.warn}>{errors.pet}</p>}
          </fieldset>
        )}
        <div className={st.two}>
          <Field label="Dịch vụ">
            <Select value={service} onChange={(e) => { setService(e.target.value as Service); setPicked(undefined); }}>
              {SERVICES.map((v) => <option key={v} value={v}>{SERVICE_LABEL[v]}</option>)}
            </Select>
          </Field>
          <Field label="Thời lượng dự kiến">
            <Select value={duration} onChange={(e) => setPicked(Number(e.target.value))}>
              {durationChoices(duration).map((d) => <option key={d} value={d}>{d} phút</option>)}
            </Select>
          </Field>
        </div>
        <div className={st.two}>
          <Field label="Ngày hẹn" error={errors.when && !date ? errors.when : undefined}><Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Giờ hẹn" error={errors.when && !time ? errors.when : undefined}><Input type="time" step={300} value={time} onChange={(e) => setTime(e.target.value)} /></Field>
        </div>
        {notice && <p className={st.warn}><Icon name="triangle-alert" size={16} />{notice}</p>}
        <Field label="Người phụ trách" optional>
          <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Chưa phân công</option>
            {(people.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} · {p.title}</option>)}
          </Select>
        </Field>
        <ChipGroup<'phone' | 'walk_in'> label="Nguồn" value={source} onChange={setSource} options={[{ value: 'phone', label: 'Điện thoại' }, { value: 'walk_in', label: 'Tại quầy' }]} />
        <Field label="Ghi chú nội bộ" optional><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </div>
    </Dialog>
  );
}
