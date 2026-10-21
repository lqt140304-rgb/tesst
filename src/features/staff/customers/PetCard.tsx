import { system } from '@/data/public';
import type { StaffPet } from '@/data/staff';
import { SEX_LABEL, SPECIES_LABEL } from '@/data/contracts/enums';
import { todayVN } from '@/lib/dates';
import { formatKg } from '@/lib/units';
import { Button, Icon, PetAvatar } from '@/ui';
import s from '../Staff.module.css';
import cs from './Customers.module.css';

type LineSource = Pick<StaffPet, 'species'> & Partial<Pick<StaffPet, 'breed' | 'sex' | 'birth_year' | 'weight_kg' | 'color' | 'neutered'>>;

/** "Mèo · Mèo ta · Cái · 4 tuổi · 4,2 kg · Tam thể · đã triệt sản": only what is known. */
export function petLine(p: LineSource, year: number): string {
  const age = p.birth_year ? (year - p.birth_year >= 1 ? `${year - p.birth_year} tuổi` : 'dưới 1 tuổi') : undefined;
  return [SPECIES_LABEL[p.species], p.breed, p.sex && SEX_LABEL[p.sex], age, p.weight_kg ? formatKg(p.weight_kg) : undefined, p.color, p.neutered === true ? 'đã triệt sản' : undefined]
    .filter(Boolean).join(' · ');
}

export function PetCard({ pet, canEdit, onEdit }: { pet: StaffPet; canEdit: boolean; onEdit: () => void }) {
  const year = Number(todayVN(system.now()).slice(0, 4));
  return (
    <li className={cs.petCard} data-pet-card>
      <PetAvatar name={pet.name} species={pet.species} photoKey={pet.photoKey} size={56} decorative />
      <div className={cs.petBody}>
        <p><strong className={s.petName}>{pet.name}</strong> <span className={s.code}>{pet.code}</span></p>
        <p className={s.small}>{petLine(pet, year)}</p>
        {pet.alerts.length > 0 && <span className={s.chipsWrap}>{pet.alerts.map((a) => <span key={a} className={s.alert}><Icon name="triangle-alert" size={13} />{a}</span>)}</span>}
        {pet.note_internal && <p className={s.meta}><Icon name="lock" size={12} /> {pet.note_internal} · khách không thấy</p>}
      </div>
      {canEdit && <Button variant="ghost" size="sm" icon="pencil" iconOnly aria-label={`Chỉnh sửa ${pet.name}`} onClick={onEdit} />}
    </li>
  );
}
