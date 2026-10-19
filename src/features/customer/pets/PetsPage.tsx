import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { m } from 'motion/react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { customer } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { Button, EmptyState, Icon } from '@/ui';
import { riseIn } from '@/ui/motion';
import { LoadingBlocks, PageHeader, PageProblem, PetAvatar, petLine } from '../ui';
import { PetForm } from './PetForm';
import s from '../Customer.module.css';

/** Thú cưng của tôi (customer §9.4). `?them=1` opens the add form (from Tổng quan and the welcome checklist). */
export function PetsPage() {
  const q = useQuery(() => customer.pets.list(), []);
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(params.get('them') === '1');
  const close = () => { setAdding(false); if (params.has('them')) setParams({}, { replace: true }); };
  const add = <Button icon="plus" onClick={() => setAdding(true)}>Thêm bé</Button>;
  return (
    <>
      <PageHeader title="Thú cưng của tôi" actions={add} />
      {q.error ? <PageProblem error={q.error} onRetry={q.refetch} /> : !q.data ? <LoadingBlocks /> : q.data.length === 0 ? (
        <EmptyState icon="paw" title="Bạn chưa thêm bé nào" body="Thêm hồ sơ để lần sau đặt lịch nhanh hơn."
          action={<Button icon="plus" onClick={() => setAdding(true)}>Thêm bé đầu tiên</Button>} />
      ) : (
        <ul className={s.petGrid}>
          {q.data.map((p, i) => (
            <m.li key={p.id} {...riseIn(10, i * 0.04)}>
              <AppLink to={paths.kh.pet(p.id)} className={s.petCard}>
                <PetAvatar name={p.name} species={p.species} size={56} />
                <div className={s.petCardBody}>
                  <h2 className={s.petName}>{p.name}</h2>
                  <p className={s.note}>{petLine(p)}</p>
                  {p.source === 'hospital' && <span className={s.recordTag}><Icon name="circle-check" size={13} /> Hồ sơ tại Lê Sơn</span>}
                </div>
                <Icon name="chevron-right" size={20} className={s.chev} />
              </AppLink>
            </m.li>
          ))}
        </ul>
      )}
      <PetForm open={adding} onClose={close} />
    </>
  );
}
