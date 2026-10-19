import { m } from 'motion/react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { customer } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { NotLinkedError } from '@/data/contracts/errors';
import { formatDateVi, formatShortDateVi } from '@/lib/dates';
import { ButtonLink, EmptyState, Icon, IconBadge, StatusPill, statusPill } from '@/ui';
import { riseIn } from '@/ui/motion';
import { cx } from '@/lib/cx';
import { LockedPage } from '../locked/LockedPage';
import { LoadingBlocks, PageHeader, PageProblem, PetAvatar } from '../ui';
import s from '../Customer.module.css';

const day = (d: string) => `${d}T12:00:00+07:00`;

/** Nội trú list (customer §9.6): current stay first as a large card, past stays below. */
export function StaysPage() {
  const q = useQuery(() => customer.stays.list(), []);
  if (q.error instanceof NotLinkedError) return <LockedPage kind="stays" />;
  return (
    <>
      <PageHeader title="Nội trú" />
      {q.error ? <PageProblem error={q.error} onRetry={q.refetch} /> : !q.data ? <LoadingBlocks /> : (
        q.data.current.length + q.data.past.length === 0 ? (
          <EmptyState icon="house-paw" title="Hiện không có bé nào đang nội trú" body="Khi bé ở lại Lê Sơn, nhật ký chăm sóc và video của bé sẽ hiện ở đây." />
        ) : (
          <div className={s.stack}>
            {q.data.current.map((st, i) => (
              <m.section key={st.id} className={cx(s.card, s.stayCard)} {...riseIn(12, i * 0.05)}>
                <IconBadge icon="house-paw" tone="lilac" size={56} />
                <div className={s.stayBody}>
                  <div className={s.rowTop}>
                    <h2 className={s.cardTitle}>Bé {st.petName} đang nội trú</h2>
                    <span className={s.muted}>· ngày thứ {st.dayNumber}</span>
                    {st.latestStatus && <StatusPill pill={statusPill('general', st.latestStatus)} />}
                  </div>
                  {st.latestText && <p className={s.stayLatest}><strong>{st.updatedLabel}:</strong> {st.latestText}</p>}
                  <div className={s.rowActions}>
                    {st.videoCount > 0 && <span className={s.softChip}><Icon name="video" size={15} /> {st.videoCount} video</span>}
                    <ButtonLink to={paths.kh.stay(st.id)} size="sm" iconRight="arrow-right">Xem nhật ký & video</ButtonLink>
                  </div>
                </div>
              </m.section>
            ))}
            {q.data.past.length > 0 && (
              <section className={s.section}>
                <h2 className={s.h2}>Các lần nội trú trước</h2>
                <ul className={s.miniList}>
                  {q.data.past.map((st) => (
                    <li key={st.id}>
                      <AppLink to={paths.kh.stay(st.id)} className={s.miniRow}>
                        <span className={s.pastStay}><PetAvatar name={st.petName} species={st.species} size={32} />
                          Bé {st.petName} · {formatShortDateVi(day(st.admittedAt))} – {st.dischargedAt ? formatDateVi(day(st.dischargedAt)) : ''} · Bé đã về nhà</span>
                        <Icon name="chevron-right" size={18} />
                      </AppLink>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )
      )}
    </>
  );
}
