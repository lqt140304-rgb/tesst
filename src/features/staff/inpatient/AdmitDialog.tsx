import { useState } from 'react';
import { useAppNavigate } from '@/app/nav';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { staff, type AdmitInput, type AdmitOptions, type AdmitPetOption } from '@/data/staff';
import { system } from '@/data/public';
import { useQuery } from '@/data/hooks/useQuery';
import { INTERNAL_STATUS_LABEL, SPECIES_LABEL, type InternalStatus } from '@/data/contracts/enums';
import { ValidationError } from '@/data/contracts/errors';
import { at, formatTimeVi, todayVN } from '@/lib/dates';
import { Button, ChipGroup, Checkbox, Dialog, Field, Icon, PetAvatar, Select, Textarea, Input, useToast } from '@/ui';
import { cx } from '@/lib/cx';
import { FormError, ServiceChip, saveError } from '../ui';
import { ADMIT_STEP_TITLES, admitSummary, canAdvance, dayItemNote, stepOfField, type AdmitDraft, type AdmitStep } from './admitSteps';
import { CagePicker } from './CagePicker';
import s from './Inpatient.module.css';
import st from '../Staff.module.css';

const NO_CHARGE = '';

/** "Nhập viện" in three steps: pick the pet, pick the cage and care details, confirm the bill. An API error sends the person back to the step that owns the field. */
export function AdmitDialog({ open, onClose, cageId }: { open: boolean; onClose: () => void; cageId?: string }) {
  const { me } = useSession();
  const toast = useToast();
  const navigate = useAppNavigate();
  const options = useQuery(() => staff.inpatient.admitOptions(), []);
  const o = options.data;
  const [step, setStep] = useState<AdmitStep>(1);
  const [raw, setDraft] = useState<AdmitDraft>({ cageId, reason: '', status: 'watch', expected: '', invoice: true });
  const [q, setQ] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const found = useQuery(() => (q.trim() ? staff.inpatient.findPets(q.trim()) : Promise.resolve([] as AdmitPetOption[])), [q]);
  const today = todayVN(system.now());
  const patch = (p: Partial<AdmitDraft>) => setDraft((d) => ({ ...d, ...p }));
  // Derived, not stored: the signed-in doctor is the default until a choice is made, and a cage someone else took is forgotten.
  const mine = me?.kind === 'staff' ? o?.doctors.find((d) => d.name === me.name)?.id : undefined;
  const draft: AdmitDraft = {
    ...raw,
    doctorId: raw.doctorId === undefined ? mine : raw.doctorId || undefined,
    cageId: !o || (raw.cageId && o.cages.some((c) => c.id === raw.cageId)) ? raw.cageId : undefined,
  };

  function choosePet(pet: AdmitPetOption, appointment?: AdmitOptions['today'][number]) {
    patch({ pet, appointment, dayItemId: pet.suggestedDayItemId });
    setErrors({});
  }

  async function submit() {
    // Send the cage as chosen even if it has just been taken: the API's answer tells the person why, instead of a button that does nothing.
    if (!draft.pet || !raw.cageId) return;
    setBusy(true);
    setErrors({});
    const input: AdmitInput = {
      pet_id: draft.pet.id, cage_id: raw.cageId, doctor_id: draft.doctorId, reason_internal: draft.reason.trim(), initial_status: draft.status,
      appointment_id: draft.appointment?.appointmentId, expected_discharge_at: draft.expected ? at(draft.expected, 0, '17:00') : undefined,
      invoice: draft.invoice ? { day_price_item_id: draft.dayItemId || undefined } : undefined,
    };
    try {
      const id = await staff.inpatient.admit(input);
      const code = o?.cages.find((c) => c.id === raw.cageId)?.code ?? '';
      toast({ message: `Đã nhập viện ${draft.pet.name} vào chuồng ${code}.` });
      onClose();
      navigate(paths.nv.stay(id));
    } catch (e) {
      if (e instanceof ValidationError) {
        setErrors(e.fields);
        setStep(stepOfField(Object.keys(e.fields)[0] ?? ''));
      } else setErrors({ form: saveError(e) });
    } finally {
      setBusy(false);
    }
  }

  const species = draft.pet?.species ?? 'dog';
  const footer = (
    <>
      {step > 1 ? <Button variant="ghost" onClick={() => setStep((n) => (n - 1) as AdmitStep)}>Quay lại</Button> : <Button variant="ghost" onClick={onClose}>Để sau</Button>}
      {step < 3
        ? <Button disabled={!canAdvance(step, draft)} onClick={() => setStep((n) => (n + 1) as AdmitStep)}>Tiếp</Button>
        : <Button icon="check" loading={busy} onClick={() => void submit()}>Nhập viện</Button>}
    </>
  );

  return (
    <Dialog open={open} onClose={onClose} wide title="Nhập viện" footer={footer}
      intro={<span className={s.stepHead} aria-live="polite">Bước {step}/3 · {ADMIT_STEP_TITLES[step]}</span>}>
      <div className={st.form}>
        <FormError>{errors.form}</FormError>
        {step === 1 && (
          <>
            {(o?.today.length ?? 0) > 0 && (
              <section aria-label="Lịch hẹn hôm nay" className={s.todayBlock}>
                <p className={s.blockTitle}>Lịch hẹn hôm nay</p>
                <ul className={s.optionList}>
                  {o!.today.map((t) => (
                    <li key={t.appointmentId}>
                      <button type="button" data-today-appt aria-pressed={draft.appointment?.appointmentId === t.appointmentId} className={s.option} onClick={() => choosePet(t.pet, t)}>
                        <PetAvatar name={t.pet.name} species={t.pet.species} photoKey={t.pet.photoKey} size={40} decorative />
                        <span className={s.optionText}><strong>{t.pet.name}</strong><span className={s.meta}>{t.pet.ownerName} · <span className="num">{formatTimeVi(t.start_at)}</span></span></span>
                        <ServiceChip service={t.service} short />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <Field label="Tìm bé, chủ nuôi hoặc số điện thoại" hint="Ví dụ: Bông, Nguyễn Thị Lan hoặc 0901…">
              <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
            </Field>
            {q.trim() && (found.data ?? []).length === 0 && !found.isLoading && (
              <p className={st.hint}><Icon name="info" size={16} /><span>Chưa có hồ sơ bé này. Bạn tạo ở mục Khách hàng rồi quay lại.</span></p>
            )}
            <ul className={s.optionList}>
              {(found.data ?? []).map((p) => (
                <li key={p.id}>
                  <button type="button" data-pet-option disabled={p.inpatient} aria-pressed={draft.pet?.id === p.id} className={s.option} onClick={() => choosePet(p)}>
                    <PetAvatar name={p.name} species={p.species} photoKey={p.photoKey} size={40} decorative />
                    <span className={s.optionText}>
                      <strong>{p.name}</strong>
                      <span className={s.meta}>{SPECIES_LABEL[p.species]}{p.breed ? ` · ${p.breed}` : ''}{p.weight_kg !== undefined ? ` · ${p.weight_kg} kg` : ''} · {p.ownerName}</span>
                    </span>
                    {p.inpatient && <span className={s.fitTag}>Đang nội trú</span>}
                  </button>
                </li>
              ))}
            </ul>
            {draft.pet && <p className={s.picked}><Icon name="check" size={16} /> Đã chọn: <strong>{draft.pet.name}</strong> · {draft.pet.ownerName}</p>}
            <FormError>{errors.pet_id}</FormError>
          </>
        )}
        {step === 2 && o && (
          <>
            <Field label="Chuồng" error={errors.cage_id} hint="Chỉ hiện chuồng đang trống.">
              <CagePicker cages={o.cages} species={species} value={draft.cageId} onChange={(id) => patch({ cageId: id })} label="Chọn chuồng" />
            </Field>
            <Field label="Bác sĩ phụ trách" error={errors.doctor_id}>
              <Select value={draft.doctorId ?? ''} onChange={(e) => patch({ doctorId: e.target.value })}>
                <option value="">Chưa chọn</option>
                {o.doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Lý do nhập viện" error={errors.reason_internal} hint="Chỉ nhân viên thấy."><Textarea rows={2} value={draft.reason} onChange={(e) => patch({ reason: e.target.value })} /></Field>
            <Field label="Tình trạng ban đầu">
              <ChipGroup<InternalStatus> label="Tình trạng ban đầu" value={draft.status} onChange={(v) => patch({ status: v })}
                options={(Object.keys(INTERNAL_STATUS_LABEL) as InternalStatus[]).map((k) => ({ value: k, label: INTERNAL_STATUS_LABEL[k] }))} />
            </Field>
            <Field label="Dự kiến xuất viện" optional error={errors.expected_discharge_at}>
              <Input type="date" min={today} value={draft.expected} onChange={(e) => patch({ expected: e.target.value })} />
            </Field>
          </>
        )}
        {step === 3 && o && (
          <>
            <Checkbox label="Tạo hóa đơn nội trú nháp" checked={draft.invoice} onChange={(e) => patch({ invoice: e.target.checked })} />
            {draft.invoice && (
              <Field label="Dòng tiền nội trú" error={errors.day_price_item_id} hint={dayItemNote(draft)}>
                <Select value={draft.dayItemId ?? NO_CHARGE} onChange={(e) => patch({ dayItemId: e.target.value || undefined })}>
                  <option value={NO_CHARGE}>Chưa ghi tiền nội trú</option>
                  {o.dayItems.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </Field>
            )}
            <FormError>{errors.invoice}</FormError>
            <p className={cx(s.summary)}><Icon name="clipboard-list" size={16} /> {admitSummary(draft, o)}</p>
          </>
        )}
      </div>
    </Dialog>
  );
}
