import { m } from 'motion/react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { staff, type CageTile } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { SPECIES_LABEL } from '@/data/contracts/enums';
import { Icon, IconBadge, StatusPill, statusPill } from '@/ui';
import { cx } from '@/lib/cx';
import { LoadingBlocks, PageHeader, PageProblem, SPECIES_ICON } from '../ui';
import s from './Inpatient.module.css';

const initials = (name?: string) => (name ? name.replace(/^BS\.\s*/, '').trim().split(/\s+/).slice(-2).map((w) => w.charAt(0)).join('') : '');

/** Cage board (staff §5.1), grouped by zone. Care orders show as a care log count, never "Quá giờ" alerts (R13). */
export function BoardPage() {
  const q = useQuery(() => staff.inpatient.board(), []);
  if (q.error) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks rows={4} />;
  const tiles = q.data;
  const busy = tiles.filter((t) => t.stay).length;
  const zones = [...new Set(tiles.map((t) => t.zone))];

  return (
    <>
      <PageHeader title="Nội trú" sub={`${busy} bé đang nội trú · ${tiles.length - busy} chuồng trống`}
        actions={<span className={s.legend} aria-label="Chú thích tình trạng nội bộ">
          <StatusPill pill={statusPill('internal', 'stable')} dense /><StatusPill pill={statusPill('internal', 'watch')} dense /><StatusPill pill={statusPill('internal', 'critical')} dense />
        </span>} />
      <div className={s.zones}>
        {zones.map((z) => (
          <section key={z} className={s.zone} aria-labelledby={`zone-${z}`}>
            <h2 id={`zone-${z}`} className={s.zoneTitle}>{z}</h2>
            <ul className={s.tiles}>
              {tiles.filter((t) => t.zone === z).map((t, i) => <Tile key={t.cageId} t={t} index={i} />)}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function Tile({ t, index }: { t: CageTile; index: number }) {
  const { can } = useSession();
  if (!t.stay) {
    return (
      <li className={cx(s.tile, s.empty)} data-cage>
        <span className={s.cage}>{t.cageCode}</span>
        <span className={s.emptyText}><Icon name="kennel-empty" size={22} /> Trống</span>
      </li>
    );
  }
  const x = t.stay;
  return (
    <m.li initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.03 }}>
      <AppLink to={paths.nv.stay(x.id)} className={cx(s.tile, s[`st_${x.internalStatus}`])} data-cage>
        <span className={s.tileTop}><span className={s.cage}>{t.cageCode}</span><StatusPill pill={statusPill('internal', x.internalStatus)} dense /></span>
        <span className={s.pet}>
          <IconBadge icon={SPECIES_ICON[x.species]} tone={x.species === 'cat' ? 'lilac' : 'peach'} size={40} />
          <span><strong className={s.petName}>{x.petName}</strong><span className={s.meta}>{SPECIES_LABEL[x.species]} · {x.ownerName}</span></span>
        </span>
        <span className={s.tileMid}>
          <span>Ngày {x.dayNumber}</span>
          {x.doctorName && <span className={s.doc} title={x.doctorName}>{initials(x.doctorName)}</span>}
        </span>
        <span className={s.tileFoot}>
          {can('inpatient.clinical') && x.slotsPending > 0 && <span className={s.foot}><Icon name="clipboard-list" size={13} />{x.slotsPending} việc chưa ghi</span>}
          {can('inpatient.share') && !x.diaryToday && <span className={cx(s.foot, s.footWarm)}><span className={s.dot} />Chưa gửi nhật ký hôm nay</span>}
          {x.ownerWeb !== 'linked' && <span className={s.foot}><Icon name="unlink" size={13} />Chủ nuôi chưa liên kết tài khoản</span>}
          {x.alerts.length > 0 && <span className={cx(s.foot, s.footWarm)}><Icon name="triangle-alert" size={13} />{x.alerts[0]}</span>}
        </span>
      </AppLink>
    </m.li>
  );
}
