import { useState } from 'react';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { staff, type StaffStayView } from '@/data/staff';
import { system } from '@/data/public';
import { formatDaysVi } from '@/data/rules/stay-billing';
import { ConflictError, ValidationError } from '@/data/contracts/errors';
import { toIsoVN } from '@/lib/dates';
import { Button, ButtonLink, Checkbox, Dialog, Field, Icon, Input, Textarea, useToast } from '@/ui';
import { DoseWarning, FormError, saveError, useDoseLint } from '../ui';
import { dischargeReminders } from './chores';
import { dischargeMoneyLine } from './stayMoney';
import s from './Inpatient.module.css';
import st from '../Staff.module.css';

const minute = (d: Date) => toIsoVN(d).slice(0, 16);

/** Discharge: the bill summary follows the chosen time; reminders about drafts never block. Sends the version the form opened with. */
export function DischargeDialog({ open, onClose, stay: v }: { open: boolean; onClose: () => void; stay: StaffStayView }) {
  const { can } = useSession();
  const toast = useToast();
  const [now] = useState(() => system.now());
  const [at, setAt] = useState(minute(now));
  const [note, setNote] = useState('');
  const [farewell, setFarewell] = useState('');
  const [share, setShare] = useState(false);
  const [version] = useState(v.version);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const iso = `${at}:00+07:00`;
  const line = dischargeMoneyLine(v.billing, v.admitted_at, iso);
  const hits = useDoseLint(farewell);
  const reminders = dischargeReminders(v, can);
  const text = farewell.trim();

  async function save() {
    setBusy(true);
    setErrors({});
    try {
      const res = await staff.inpatient.discharge(v.id, version, {
        discharged_at: iso, note_internal: note.trim() || undefined, farewell: text ? { text, share: share && can('inpatient.share') } : undefined,
      });
      toast({ message: `Đã cho ${v.petName} xuất viện${res.invoiceUpdated ? ` · hóa đơn tính ${formatDaysVi(res.days)} ngày.` : '.'}` });
      onClose();
    } catch (e) {
      if (e instanceof ConflictError) { toast({ tone: 'error', message: saveError(e) }); onClose(); return; } // the page reloads itself
      if (e instanceof ValidationError) setErrors({ ...e.fields, ...(e.fields.stay ? { form: e.fields.stay } : {}) });
      else setErrors({ form: saveError(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} wide title={`Cho ${v.petName} xuất viện`}
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="check" loading={busy} onClick={() => void save()}>Xác nhận xuất viện</Button></>}>
      <div className={st.form}>
        <FormError>{errors.form}</FormError>
        <Field label="Thời điểm xuất viện" error={errors.discharged_at ?? (line.invalid ? line.text : undefined)}>
          <Input type="datetime-local" value={at} min={minute(new Date(v.admitted_at))} max={minute(now)} onChange={(e) => setAt(e.target.value)} />
        </Field>
        {!line.invalid && (
          <div className={s.moneyBox} data-discharge-bill>
            <p className={s.money}>{line.text}</p>
            <p className={s.meta}>Tiền nội trú tính theo giờ, làm tròn lên 0,1 ngày.</p>
            {v.invoiceId && can(['invoices.create', 'payments.record']) && <ButtonLink to={paths.nv.invoice(v.invoiceId)} variant="secondary" icon="receipt" size="sm" onClick={onClose}>Mở hóa đơn</ButtonLink>}
          </div>
        )}
        <Field label="Ghi chú nội bộ" optional hint="Chỉ nhân viên thấy."><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <Field label="Lời chào gửi chủ nuôi" optional>
          <Textarea rows={3} value={farewell} onChange={(e) => setFarewell(e.target.value)} />
        </Field>
        <div className={s.farewellTools}>
          <Button size="sm" variant="secondary" onClick={() => setFarewell(`${v.petName} đã khỏe và sẵn sàng về nhà. Cảm ơn gia đình đã tin tưởng Lê Sơn!`)}>Dùng câu gợi ý</Button>
        </div>
        <DoseWarning hits={hits} />
        {text && can('inpatient.share') && <Checkbox label="Chia sẻ ngay với chủ nuôi" checked={share} onChange={(e) => setShare(e.target.checked)} />}
        <p className={st.hint}><Icon name="info" size={16} /><span>Hướng dẫn dùng thuốc và chăm sóc tại nhà được dặn trực tiếp, không gửi qua web.</span></p>
        {reminders.length > 0 && (
          <ul className={s.reminders} aria-label="Nhắc trước khi xuất viện">
            {reminders.map((r) => <li key={r}><Icon name="triangle-alert" size={14} /> {r}</li>)}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
