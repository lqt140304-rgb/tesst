import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { m, useReducedMotion } from 'motion/react';
import { paths } from '@/app/routes';
import { SEX_LABEL, SPECIES_LABEL } from '@/data/contracts/enums';
import { customer, type CustomerPetCard } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { Button, ButtonLink, EmptyState, Icon, PetAvatar, SPECIES_ICON, useListState, type IconName } from '@/ui';
import { preset } from '@/ui/motion';
import { LoadingBlocks, PageHeader, PageProblem } from '../ui';
import { PetForm } from './PetForm';
import { matchPet } from './search';
import o from './Pets.module.css';

const age = (p: CustomerPetCard) => (p.ageYears === undefined ? undefined : p.ageYears < 1 ? 'Dưới 1 tuổi' : `${p.ageYears} tuổi`);

/** One row's chips: species, breed, age, sex — only what the record has. */
function chips(p: CustomerPetCard): { icon: IconName; text: string }[] {
  const out: { icon: IconName; text: string }[] = [{ icon: SPECIES_ICON[p.species], text: SPECIES_LABEL[p.species] }];
  if (p.breed) out.push({ icon: 'paw-line', text: p.breed });
  const a = age(p);
  if (a) out.push({ icon: 'cake', text: a });
  if (p.sex) out.push({ icon: p.sex === 'male' ? 'gender-male' : 'gender-female', text: SEX_LABEL[p.sex] });
  return out;
}

/** Thú cưng của bạn (spec 2026-10-21 §3.3). `?them=1` opens the add form (from Tổng quan and the welcome checklist). */
export function PetsPage() {
  const q = useQuery(() => customer.pets.list(), []);
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(params.get('them') === '1');
  const [list, setList] = useListState('kh-pets', { q: '' });
  const reduced = useReducedMotion() ?? false;
  const close = () => { setAdding(false); if (params.has('them')) setParams({}, { replace: true }); };
  const open = () => setAdding(true);
  const shown = q.data?.filter((p) => matchPet(p, list.q));
  return (
    <>
      <PageHeader title="Thú cưng của bạn" sub="Quản lý thông tin các bé để dễ dàng đặt lịch và theo dõi quá trình chăm sóc."
        crumbs={[{ label: 'Trang chủ', to: paths.kh.home }, { label: 'Thú cưng' }]} actions={<Button icon="plus" onClick={open}>Thêm thú cưng</Button>} />
      {q.error ? <PageProblem error={q.error} onRetry={q.refetch} /> : !q.data ? <LoadingBlocks /> : q.data.length === 0 ? (
        <EmptyState icon="paw" title="Bạn chưa thêm bé nào" body="Thêm hồ sơ để lần sau đặt lịch nhanh hơn."
          action={<Button icon="plus" onClick={open}>Thêm bé đầu tiên</Button>} />
      ) : (
        <>
          <label className={o.search}>
            <span className="sr-only">Tìm thú cưng</span>
            <Icon name="search" size={20} />
            <input type="search" value={list.q} placeholder="Tìm theo tên, loài hoặc giống..." onChange={(e) => setList({ q: e.target.value })} />
          </label>
          {shown && shown.length === 0 ? (
            <div className={o.none} role="status">
              <p>Không có bé nào khớp với “{list.q.trim()}”.</p>
              <Button variant="secondary" size="sm" onClick={() => setList({ q: '' })}>Xóa tìm kiếm</Button>
            </div>
          ) : (
            <ul className={o.list}>
              {shown?.map((p, i) => {
                const a = preset('enterList', { reduced, index: i });
                return (
                  <m.li key={p.id} className={o.row} data-pet-row initial={a.initial} animate={a.animate} transition={a.transition}>
                    <span className={o.photo}><PetAvatar name={p.name} species={p.species} photoKey={p.photoKey} size={96} decorative /></span>
                    <div className={o.body}>
                      <h2 className={o.name}>{p.name}</h2>
                      <ul className={o.chips}>{chips(p).map((c) => <li key={c.icon + c.text}><Icon name={c.icon} size={16} />{c.text}</li>)}</ul>
                      {p.source === 'hospital' && <span className={o.tag}><Icon name="circle-check" size={14} /> Hồ sơ tại Lê Sơn</span>}
                    </div>
                    <span className={o.go}>
                      <ButtonLink variant="secondary" to={paths.kh.pet(p.id)} aria-label={`Xem hồ sơ của ${p.name}`}>Xem hồ sơ</ButtonLink>
                    </span>
                  </m.li>
                );
              })}
            </ul>
          )}
        </>
      )}
      {q.data && q.data.length > 0 && (
        <div className={o.add} data-add-pet style={{ marginTop: 16 }}>
          <span className={o.addArt} aria-hidden="true"><Icon name="house-paw" size={30} /></span>
          <p>Thêm bé mới để quản lý thông tin và đặt lịch thuận tiện.</p>
          <Button icon="plus" onClick={open}>Thêm thú cưng</Button>
        </div>
      )}
      <PetForm open={adding} onClose={close} />
    </>
  );
}
