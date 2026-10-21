import { useState } from 'react';
import { staff, type StaffStayView } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { ConflictError, ValidationError } from '@/data/contracts/errors';
import { Button, ChipGroup, Dialog, Field, Input, useToast } from '@/ui';
import { FormError, saveError } from '../ui';
import { CagePicker } from './CagePicker';
import s from './Inpatient.module.css';
import st from '../Staff.module.css';

type Reason = 'isolation' | 'zone' | 'doctor' | 'other';
const REASONS: { value: Reason; label: string }[] = [
  { value: 'isolation', label: 'Cách ly' }, { value: 'zone', label: 'Đổi khu' }, { value: 'doctor', label: 'Gần bác sĩ hơn' }, { value: 'other', label: 'Khác' },
];

/** Move a pet to another empty cage. Sends the version the form opened with, so a change made elsewhere is reported, never overwritten. */
export function TransferDialog({ open, onClose, stay }: { open: boolean; onClose: () => void; stay: Pick<StaffStayView, 'id' | 'version' | 'petName' | 'species' | 'cageCode'> }) {
  const toast = useToast();
  const options = useQuery(() => staff.inpatient.admitOptions(), []);
  const [cageId, setCageId] = useState<string | undefined>();
  const [reason, setReason] = useState<Reason | undefined>();
  const [other, setOther] = useState('');
  const [version] = useState(stay.version);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const cages = options.data?.cages ?? [];
  const target = cages.find((c) => c.id === cageId);

  async function save() {
    if (!cageId) { setErrors({ cage_id: 'Bạn chọn chuồng mới cho bé.' }); return; }
    setBusy(true);
    setErrors({});
    const text = reason === 'other' ? other.trim() : REASONS.find((r) => r.value === reason)?.label;
    try {
      await staff.inpatient.transfer(stay.id, version, { cage_id: cageId, reason: text || undefined });
      toast({ message: `Đã chuyển ${stay.petName} sang chuồng ${target?.code ?? ''}.` });
      onClose();
    } catch (e) {
      if (e instanceof ConflictError) { toast({ tone: 'error', message: saveError(e) }); onClose(); return; } // the page reloads itself: reopen to move the pet again
      setErrors(e instanceof ValidationError ? e.fields : { form: saveError(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} wide title={`Chuyển ${stay.petName} sang chuồng khác`}
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="check" loading={busy} onClick={() => void save()}>Chuyển chuồng</Button></>}>
      <div className={st.form}>
        <FormError>{errors.form}</FormError>
        <Field label="Chuồng mới" error={errors.cage_id} hint="Chỉ hiện chuồng đang trống.">
          <CagePicker cages={cages} species={stay.species} value={cageId} onChange={setCageId} label="Chọn chuồng mới" />
        </Field>
        <p className={s.summary} aria-live="polite"><span className="num">{stay.cageCode} → {target?.code ?? '…'}</span></p>
        <Field label="Lý do" optional>
          <ChipGroup<Reason> label="Lý do chuyển chuồng" value={reason} onChange={setReason} options={REASONS} />
        </Field>
        {reason === 'other' && <Field label="Lý do khác" optional><Input value={other} maxLength={200} onChange={(e) => setOther(e.target.value)} /></Field>}
      </div>
    </Dialog>
  );
}
