import { useState } from 'react';
import { staff, type PetInput, type StaffPet } from '@/data/staff';
import { SPECIES_LABEL, type Species } from '@/data/contracts/enums';
import { ConflictError, ValidationError } from '@/data/contracts/errors';
import { Button, Dialog, Field, Input, Select, Textarea, useToast } from '@/ui';
import { FormError, saveError } from '../ui';
import s from '../Staff.module.css';

const ALERTS = ['Dễ hoảng sợ', 'Có thể cắn — cần rọ mõm', 'Dị ứng thuốc', 'Bệnh mãn tính'];
type Neutered = '' | 'yes' | 'no';

/** One form to add or edit a pet. Editing sends the version the form opened with and always sends the ticked alerts (none ticked = cleared). */
export function PetForm({ open, onClose, customerId, pet }: { open: boolean; onClose: () => void; customerId: string; pet?: StaffPet }) {
  const toast = useToast();
  const [name, setName] = useState(pet?.name ?? '');
  const [species, setSpecies] = useState<Species>(pet?.species ?? 'dog');
  const [breed, setBreed] = useState(pet?.breed ?? '');
  const [sex, setSex] = useState<'' | 'male' | 'female'>(pet?.sex ?? '');
  const [year, setYear] = useState(pet?.birth_year ? String(pet.birth_year) : '');
  const [weight, setWeight] = useState(pet?.weight_kg ? String(pet.weight_kg).replace('.', ',') : '');
  const [color, setColor] = useState(pet?.color ?? '');
  const [neutered, setNeutered] = useState<Neutered>(pet?.neutered === true ? 'yes' : pet?.neutered === false ? 'no' : '');
  const [note, setNote] = useState(pet?.note_internal ?? '');
  const [alerts, setAlerts] = useState<string[]>(pet?.alerts ?? []);
  const [version] = useState(pet?.version);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const options = [...new Set([...ALERTS, ...(pet?.alerts ?? [])])];

  async function save() {
    setBusy(true);
    setErrors({});
    const input: PetInput = {
      name, species, breed: breed.trim() || undefined, sex: sex || undefined, birth_year: year ? Number(year) : undefined,
      weight_kg: weight.trim() ? Number(weight.replace(',', '.')) : undefined, color: color.trim() || undefined,
      neutered: neutered === 'yes' ? true : neutered === 'no' ? false : undefined, note_internal: note.trim() || undefined, alerts,
    };
    try {
      if (pet && version !== undefined) await staff.customers.updatePet(pet.id, version, input); else await staff.customers.createPet(customerId, input);
      toast({ message: pet ? `Đã lưu thông tin bé ${name.trim()}.` : `Đã thêm bé ${name.trim()}.` });
      onClose();
    } catch (e) {
      if (e instanceof ConflictError) { toast({ tone: 'error', message: saveError(e) }); onClose(); return; } // the record has been reloaded: reopen the form to edit the new data
      setErrors(e instanceof ValidationError ? e.fields : { form: saveError(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} wide title={pet ? `Chỉnh sửa ${pet.name}` : 'Thêm thú cưng'}
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="check" loading={busy} onClick={() => void save()}>Lưu thú cưng</Button></>}>
      <div className={s.form}>
        <FormError>{errors.form}</FormError>
        <div className={s.two}>
          <Field label="Tên" error={errors.name}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Loài"><Select value={species} onChange={(e) => setSpecies(e.target.value as Species)}>{(Object.keys(SPECIES_LABEL) as Species[]).map((sp) => <option key={sp} value={sp}>{SPECIES_LABEL[sp]}</option>)}</Select></Field>
        </div>
        <div className={s.two}>
          <Field label="Giống" optional><Input value={breed} onChange={(e) => setBreed(e.target.value)} /></Field>
          <Field label="Giới tính" optional><Select value={sex} onChange={(e) => setSex(e.target.value as '' | 'male' | 'female')}><option value="">Chưa rõ</option><option value="male">Đực</option><option value="female">Cái</option></Select></Field>
        </div>
        <div className={s.two}>
          <Field label="Năm sinh (ước tính)" optional error={errors.birth_year}><Input inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} /></Field>
          <Field label="Cân nặng (kg)" optional error={errors.weight_kg} hint="Ví dụ 4,2"><Input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} /></Field>
        </div>
        <div className={s.two}>
          <Field label="Màu lông" optional><Input value={color} onChange={(e) => setColor(e.target.value)} /></Field>
          <Field label="Triệt sản" optional><Select value={neutered} onChange={(e) => setNeutered(e.target.value as Neutered)}><option value="">Chưa rõ</option><option value="yes">Đã triệt sản</option><option value="no">Chưa triệt sản</option></Select></Field>
        </div>
        <Field label="Ghi chú nội bộ" optional hint="Chỉ nhân viên thấy."><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <fieldset className={s.radioList}>
          <legend>Lưu ý quan trọng (nội bộ)</legend>
          <div className={s.chipsWrap}>
            {options.map((a) => (
              <label key={a} className={s.radio}>
                <input type="checkbox" checked={alerts.includes(a)} onChange={(e) => setAlerts((xs) => (e.target.checked ? [...xs, a] : xs.filter((x) => x !== a)))} />
                <span>{a}</span>
              </label>
            ))}
          </div>
          {pet && <p className={s.meta}>Bỏ hết dấu tích sẽ xóa các lưu ý của bé.</p>}
        </fieldset>
      </div>
    </Dialog>
  );
}
