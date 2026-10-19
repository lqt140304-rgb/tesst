import { useId, useState, type FormEvent } from 'react';
import { customer, type CustomerPetCard, type CustomerPetInput } from '@/data/customer';
import { ValidationError } from '@/data/contracts/errors';
import { SPECIES_LABEL, type Sex, type Species } from '@/data/contracts/enums';
import { Button, ChipGroup, Dialog, Field, Icon, Input, Textarea, useToast } from '@/ui';
import { speciesIcon } from '../ui';
import s from '../Customer.module.css';

type SexChoice = Sex | 'unknown';

/** Add / edit a self-added pet (customer §9.4). A dialog: side-sized on desktop, bottom sheet on mobile. */
export function PetForm({ open, onClose, pet, onSaved }: { open: boolean; onClose: () => void; pet?: CustomerPetCard; onSaved?: (id: string) => void }) {
  return (
    <Dialog open={open} onClose={onClose} title={pet ? `Sửa thông tin bé ${pet.name}` : 'Thêm bé'}>
      {open && <PetFormBody pet={pet} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

function PetFormBody({ pet, onClose, onSaved }: { pet?: CustomerPetCard; onClose: () => void; onSaved?: (id: string) => void }) {
  const uid = useId();
  const toast = useToast();
  const [v, setV] = useState({
    name: pet?.name ?? '', species: (pet?.species ?? '') as Species | '', breed: pet?.breed ?? '',
    sex: (pet?.sex ?? 'unknown') as SexChoice, birth_year: pet?.birthYear ? String(pet.birthYear) : '', note: pet?.note ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const fe: Record<string, string> = {};
    if (!v.name.trim()) fe.name = 'Bạn nhập tên bé nhé.';
    if (!v.species) fe.species = 'Bạn chọn giúp bé là mèo, chó hay loài khác nhé.';
    if (v.birth_year && !/^\d{4}$/.test(v.birth_year.trim())) fe.birth_year = 'Năm sinh chưa đúng. Bạn kiểm tra lại giúp nhé.';
    setErrors(fe);
    if (Object.keys(fe).length) {
      document.getElementById(`${uid}${Object.keys(fe)[0]}`)?.focus();
      return;
    }
    const input: CustomerPetInput = {
      name: v.name, species: v.species as Species, breed: v.breed, sex: v.sex === 'unknown' ? undefined : v.sex,
      birth_year: v.birth_year ? Number(v.birth_year) : undefined, note: v.note,
    };
    setPending(true);
    setFailed(false);
    try {
      let id = pet?.id;
      if (pet) await customer.pets.update(pet.id, input);
      else id = await customer.pets.create(input);
      toast({ message: pet ? 'Đã lưu thay đổi.' : `Đã thêm bé ${v.name.trim()}.` });
      onSaved?.(id!);
      onClose();
    } catch (err) {
      if (err instanceof ValidationError) setErrors(err.fields);
      else setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className={s.petForm}>
      <Field label="Tên bé" error={errors.name}>
        <Input id={`${uid}name`} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Ví dụ: Mochi" />
      </Field>
      <div className={s.groupField}>
        <p className={s.label} aria-hidden="true">Bé là</p>
        <ChipGroup<Species> id={`${uid}species`} label="Bé là" value={v.species || undefined} onChange={(x) => setV({ ...v, species: x })}
          options={(['cat', 'dog', 'other'] as const).map((x) => ({ value: x, label: SPECIES_LABEL[x], leading: <Icon name={speciesIcon(x)} size={18} /> }))} />
        {errors.species && <p className={s.error}><Icon name="info" size={16} />{errors.species}</p>}
      </div>
      <Field label={v.species === 'other' ? 'Bé là loài gì? / Giống' : 'Giống'} optional>
        <Input value={v.breed} onChange={(e) => setV({ ...v, breed: e.target.value })} placeholder={v.species === 'other' ? 'Ví dụ: thỏ, hamster' : 'Ví dụ: Mèo Anh lông ngắn'} />
      </Field>
      <div className={s.groupField}>
        <p className={s.label} aria-hidden="true">Giới tính <span className={s.optional}>(không bắt buộc)</span></p>
        <ChipGroup<SexChoice> label="Giới tính" value={v.sex} onChange={(x) => setV({ ...v, sex: x })}
          options={[{ value: 'male', label: 'Đực' }, { value: 'female', label: 'Cái' }, { value: 'unknown', label: 'Chưa rõ' }]} />
      </div>
      <Field label="Năm sinh" optional hint="Không nhớ chính xác? Bạn ghi năm ước chừng cũng được." error={errors.birth_year}>
        <Input id={`${uid}birth_year`} inputMode="numeric" value={v.birth_year} onChange={(e) => setV({ ...v, birth_year: e.target.value })} placeholder="Ví dụ: 2022" className={s.narrow} />
      </Field>
      <Field label="Điều Lê Sơn nên biết về bé" optional>
        <Textarea value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} rows={3} placeholder="Ví dụ: bé nhát người lạ, sợ tiếng máy sấy." />
      </Field>
      {failed && <p className={s.error} role="alert"><Icon name="info" size={16} />Chưa lưu được thay đổi. Bạn thử lại nhé.</p>}
      <div className={s.formActions}>
        <Button variant="ghost" onClick={onClose}>Hủy</Button>
        <Button type="submit" icon="check" loading={pending} loadingText="Đang lưu…">Lưu hồ sơ bé</Button>
      </div>
    </form>
  );
}
