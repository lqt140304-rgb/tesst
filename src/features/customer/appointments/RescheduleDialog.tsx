import { useId, useState, type FormEvent } from 'react';
import { customer, type CustomerBookingRow } from '@/data/customer';
import { system } from '@/data/public';
import { ValidationError } from '@/data/contracts/errors';
import { TIME_SLOTS, TIME_SLOT_LABEL, type TimeSlot } from '@/data/contracts/enums';
import { addDays, todayVN } from '@/lib/dates';
import { Button, Counter, Dialog, Field, Icon, Input, Select, Textarea, useToast } from '@/ui';
import { serviceLabel } from '../ui';
import o from './Appointments.module.css';

const REASON_MAX = 200;

/** "Yêu cầu đổi lịch": a wish, not a change — Lê Sơn calls back and moves the appointment (spec 2026-10-21 §3.5). */
export function RescheduleDialog({ row, open, onClose }: { row: CustomerBookingRow; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Yêu cầu đổi lịch" intro={`${serviceLabel(row.service)} · bé ${row.petName}. Lịch hiện tại vẫn giữ cho đến khi Lê Sơn gọi và đổi giúp bạn.`}>
      {open && <Body row={row} onClose={onClose} />}
    </Dialog>
  );
}

function Body({ row, onClose }: { row: CustomerBookingRow; onClose: () => void }) {
  const uid = useId();
  const toast = useToast();
  const tomorrow = addDays(todayVN(system.now()), 1);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<TimeSlot | ''>('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!date) {
      setErrors({ desired_date: 'Bạn chọn ngày mong muốn nhé.' });
      document.getElementById(`${uid}date`)?.focus();
      return;
    }
    setPending(true);
    setFailed(false);
    setErrors({});
    try {
      await customer.appointments.requestReschedule(row.id, { desired_date: date, preferred_slot: slot || undefined, reason: reason.trim() || undefined });
      toast({ message: 'Lê Sơn sẽ gọi cho bạn để đổi lịch.' });
      onClose();
    } catch (err) {
      if (err instanceof ValidationError) setErrors(err.fields);
      else setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className={o.form}>
      {errors.appointment && <p className={o.alert} role="alert"><Icon name="info" size={16} />{errors.appointment}</p>}
      <Field label="Ngày mong muốn" error={errors.desired_date}>
        <Input id={`${uid}date`} type="date" min={tomorrow} value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="Khung giờ" optional>
        <Select value={slot} onChange={(e) => setSlot(e.target.value as TimeSlot | '')}>
          <option value="">Không chọn</option>
          {TIME_SLOTS.map((t) => <option key={t} value={t}>{TIME_SLOT_LABEL[t]}</option>)}
        </Select>
      </Field>
      <Field label="Lý do" optional error={errors.reason} hint={<Counter value={reason.length} max={REASON_MAX} />}>
        <Textarea rows={3} value={reason} maxLength={REASON_MAX} onChange={(e) => setReason(e.target.value)} placeholder="Ví dụ: bé bị ốm nhẹ, bạn bận đột xuất." />
      </Field>
      {failed && <p className={o.alert} role="alert"><Icon name="info" size={16} />Chưa gửi được yêu cầu. Bạn thử lại nhé.</p>}
      <div className={o.formActions}>
        <Button variant="ghost" onClick={onClose}>Hủy</Button>
        <Button type="submit" icon="send" loading={pending} loadingText="Đang gửi…">Gửi yêu cầu</Button>
      </div>
    </form>
  );
}
