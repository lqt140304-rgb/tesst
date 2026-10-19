import { useState } from 'react';
import { system } from '@/data/public';
import { staff, type StaffRequestDetail } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { SERVICE_LABEL } from '@/data/contracts/enums';
import { formatTimeVi, todayVN } from '@/lib/dates';
import { Button, Dialog, Field, Icon, Input, Select, Textarea, useToast } from '@/ui';
import { FormError, SERVICE_MINUTES, dayLabel, saveError } from '../ui';
import st from '../Staff.module.css';

const NEW = '__new__';
const DURATIONS = [15, 30, 45, 60, 90, 120];

/** "Xác nhận lịch hẹn" (staff §4.1): agreed date and time are required; nothing is attached automatically. */
export function ConfirmDialog({ r, open, onClose }: { r: StaffRequestDetail; open: boolean; onClose: () => void }) {
  const today = todayVN(system.now());
  const toast = useToast();
  const [date, setDate] = useState(r.desiredDate >= today ? r.desiredDate : '');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(SERVICE_MINUTES[r.service]);
  const [assignee, setAssignee] = useState('');
  const [customer, setCustomer] = useState(NEW);
  /** null until the user picks: then the suggestion (same name) applies. */
  const [pet, setPet] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ when?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const people = useQuery(() => staff.appointments.assignees(), []);
  const record = useQuery(() => (customer === NEW ? Promise.resolve(null) : staff.customers.get(customer)), [customer]);
  const sameDay = useQuery(() => (date && assignee ? staff.appointments.listRange(date, date, { assignee_id: assignee }) : Promise.resolve([])), [date, assignee]);

  const start = date && time ? `${date}T${time}:00+07:00` : '';
  const clash = start ? (sameDay.data ?? []).find((a) => {
    if (a.status !== 'scheduled') return false;
    const a0 = Date.parse(a.start_at), a1 = a0 + a.duration_min * 60_000, b0 = Date.parse(start), b1 = b0 + duration * 60_000;
    return a0 < b1 && b0 < a1;
  }) : undefined;
  const clashName = people.data?.find((p) => p.id === assignee)?.name;

  function pickCustomer(id: string) {
    setCustomer(id);
    setPet(null);
  }
  const pets = record.data?.pets ?? [];
  // Suggest (never force) the pet with the same name as in the request.
  const suggested = pets.find((p) => p.name.trim().toLowerCase() === r.petName.trim().toLowerCase());
  const petValue = pet ?? suggested?.id ?? NEW;

  async function submit() {
    if (!date || !time) { setErrors({ when: 'Vui lòng chọn đủ ngày và giờ hẹn.' }); return; }
    setBusy(true);
    setErrors({});
    try {
      await staff.requests.confirm(r.id, r.version, {
        start_at: start, duration_min: duration, assignee_id: assignee || undefined,
        customer: customer === NEW ? { create: true } : { existingId: customer },
        pet: customer === NEW || petValue === NEW ? { create: true } : { existingId: petValue },
        note_internal: note.trim() || undefined,
      });
      toast({ message: `Đã xác nhận lịch hẹn lúc ${formatTimeVi(start)}, ${dayLabel(start)}.` });
      onClose();
    } catch (e) {
      setErrors({ form: saveError(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} wide title="Xác nhận lịch hẹn"
      intro="Chọn ngày giờ đã thống nhất với khách. Ngày khách mong muốn vẫn được giữ nguyên trong yêu cầu."
      footer={<>
        <Button variant="ghost" onClick={onClose}>Quay lại</Button>
        <Button icon="calendar-check" loading={busy} onClick={() => void submit()}>Xác nhận và đưa vào lịch</Button>
      </>}>
      <div className={st.form}>
        <FormError>{errors.form ?? (errors.when && 'Vui lòng chọn đủ ngày và giờ hẹn.')}</FormError>
        <div className={st.two}>
          <Field label="Ngày hẹn" error={errors.when && !date ? errors.when : undefined}>
            <Input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Giờ hẹn" error={errors.when && !time ? errors.when : undefined}>
            <Input type="time" value={time} step={300} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
        <div className={st.two}>
          <Field label="Dịch vụ" hint="Theo yêu cầu khách đã gửi.">
            <Input value={SERVICE_LABEL[r.service]} readOnly />
          </Field>
          <Field label="Thời lượng dự kiến">
            <Select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {DURATIONS.map((d) => <option key={d} value={d}>{d} phút</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Người phụ trách" optional>
          <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Chưa phân công</option>
            {(people.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} · {p.title}</option>)}
          </Select>
        </Field>
        {clash && clashName && (
          <p className={st.warn}><Icon name="triangle-alert" size={16} />{clashName} đã có lịch {formatTimeVi(clash.start_at)}–{formatTimeVi(new Date(Date.parse(clash.start_at) + clash.duration_min * 60_000))}. Bạn vẫn có thể xác nhận.</p>
        )}

        <fieldset className={st.radioList}>
          <legend>Hồ sơ khách hàng</legend>
          {r.phoneMatches.length > 0 && (
            <p className={st.hint}><Icon name="info" size={16} />
              Có {r.phoneMatches.length} hồ sơ dùng số này: {r.phoneMatches.map((c) => `${c.full_name} (${c.code})`).join(', ')}. Bạn chọn nếu đúng người.
            </p>
          )}
          {r.phoneMatches.map((c) => (
            <label key={c.id} className={st.radio}>
              <input type="radio" name="customer" checked={customer === c.id} onChange={() => pickCustomer(c.id)} />
              <span>Chọn hồ sơ có sẵn: {c.full_name} · {c.code}</span>
            </label>
          ))}
          <label className={st.radio}>
            <input type="radio" name="customer" checked={customer === NEW} onChange={() => pickCustomer(NEW)} />
            <span>Tạo hồ sơ mới từ thông tin yêu cầu<small>{r.snapshot.contact_name} · {r.snapshot.pet_name}</small></span>
          </label>
        </fieldset>

        {customer !== NEW && (
          <fieldset className={st.radioList}>
            <legend>Thú cưng</legend>
            {pets.map((p) => (
              <label key={p.id} className={st.radio}>
                <input type="radio" name="pet" checked={petValue === p.id} onChange={() => setPet(p.id)} />
                <span>{p.name}{p.breed ? ` · ${p.breed}` : ''}{p.alerts.length > 0 && <small>{p.alerts.join(' · ')}</small>}</span>
              </label>
            ))}
            <label className={st.radio}>
              <input type="radio" name="pet" checked={petValue === NEW} onChange={() => setPet(NEW)} />
              <span>Thêm thú cưng mới từ yêu cầu<small>{r.snapshot.pet_name}</small></span>
            </label>
          </fieldset>
        )}

        <Field label="Ghi chú nội bộ" optional hint="Chỉ nhân viên thấy.">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        {r.account && !r.account.linkedCustomerCode && (
          <p className={st.hint}><Icon name="link-2" size={16} />Tài khoản web này chưa liên kết với hồ sơ. Việc liên kết chỉ thực hiện tại quầy sau khi xác minh.</p>
        )}
      </div>
    </Dialog>
  );
}
