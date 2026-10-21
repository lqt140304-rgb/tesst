import { useState } from 'react';
import { m } from 'motion/react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { staff, type CageTile } from '@/data/staff';
import { system } from '@/data/public';
import { useQuery } from '@/data/hooks/useQuery';
import { SPECIES_LABEL } from '@/data/contracts/enums';
import { dayOf, todayVN } from '@/lib/dates';
import { Button, ChipGroup, EmptyState, Icon, PetAvatar, StatusPill, statusPill } from '@/ui';
import { cx } from '@/lib/cx';
import { LoadingBlocks, PageHeader, PageProblem } from '../ui';
import { AdmitDialog } from './AdmitDialog';
import s from './Inpatient.module.css';

const initials = (name?: string) => (name ? name.replace(/^BS\.\s*/, '').trim().split(/\s+/).slice(-2).map((w) => w.charAt(0)).join('') : '');

/** Cage board (staff §5.1), grouped by zone. Care orders show as a care log count, never "Quá giờ" alerts (R13). */
export function BoardPage() {
  const { can } = useSession();
  const [zone, setZone] = useState('all');
  const [admitCage, setAdmitCage] = useState<string | null | undefined>(undefined); // undefined = closed, null = open without a cage
  const q = useQuery(() => staff.inpatient.board(), []);
  if (q.error && !q.data) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks rows={4} />;
  const tiles = q.data;
  const busy = tiles.filter((t) => t.stay).length;
  const needDiary = tiles.filter((t) => t.stay && !t.stay.diaryToday).length;
  const zones = [...new Set(tiles.map((t) => t.zone))];
  const shown = zone === 'all' ? zones : zones.filter((z) => z === zone);
  const canAdmit = can('inpatient.admit');

  return (
    <>
      <PageHeader title="Nội trú" sub="Các bé đang nằm viện và chuồng còn trống."
        actions={canAdmit && <Button icon="plus" onClick={() => setAdmitCage(null)}>Nhập viện</Button>} />
      <div className={s.boardTop}>
        <p className={s.sums}>
          <span className={s.sum}>{busy} bé đang nội trú</span>
          <span className={s.sum}>{tiles.length - busy} chuồng trống</span>
          {can('inpatient.share') && needDiary > 0 && <span className={cx(s.sum, s.sumWarm)}>{needDiary} cần gửi nhật ký hôm nay</span>}
        </p>
        <span className={s.legend} aria-label="Chú thích tình trạng nội bộ">
          <StatusPill pill={statusPill('internal', 'stable')} dense /><StatusPill pill={statusPill('internal', 'watch')} dense /><StatusPill pill={statusPill('internal', 'critical')} dense />
        </span>
      </div>
      <ChipGroup<string> label="Lọc theo khu" value={zone} onChange={setZone} options={[{ value: 'all', label: 'Tất cả' }, ...zones.map((z) => ({ value: z, label: z }))]} />
      {canAdmit && <p className={s.hintLine}><Icon name="info" size={16} /> Bấm thẻ để xem hồ sơ bé, bấm chuồng trống để nhập viện.</p>}
      {busy === 0 && <EmptyState icon="house-paw" title="Chưa có bé nào nội trú." />}
      <div className={s.zones}>
        {shown.map((z) => (
          <section key={z} className={s.zone} aria-labelledby={`zone-${z}`}>
            <h2 id={`zone-${z}`} className={s.zoneTitle}>{z}</h2>
            <ul className={s.tiles}>
              {tiles.filter((t) => t.zone === z).map((t, i) => <Tile key={t.cageId} t={t} index={i} onAdmit={() => setAdmitCage(t.cageId)} />)}
            </ul>
          </section>
        ))}
      </div>
      {canAdmit && <AdmitDialog key={String(admitCage)} open={admitCage !== undefined} cageId={admitCage ?? undefined} onClose={() => setAdmitCage(undefined)} />}
    </>
  );
}

/** One line about what to do next on this tile, most urgent first; nothing when there is nothing to do. */
function nextStep(x: NonNullable<CageTile['stay']>, can: (c: 'inpatient.share' | 'inpatient.clinical') => boolean): { text: string; warm: boolean } | undefined {
  if (x.expectedDischarge && dayOf(x.expectedDischarge) <= todayVN(system.now())) return { text: 'Dự kiến về hôm nay', warm: true };
  if (can('inpatient.share') && !x.diaryToday) return { text: 'Chưa gửi nhật ký hôm nay', warm: true };
  if (can('inpatient.clinical') && x.slotsPending > 0) return { text: `${x.slotsPending} việc chưa ghi`, warm: false };
  if (x.ownerWeb !== 'linked') return { text: 'Chủ nuôi chưa liên kết tài khoản', warm: false };
  if (x.alerts.length > 0) return { text: x.alerts[0]!, warm: true };
  return undefined;
}

function Tile({ t, index, onAdmit }: { t: CageTile; index: number; onAdmit: () => void }) {
  const { can } = useSession();
  if (!t.stay) {
    const inner = (<><span className={cx(s.cage, 'num')}>{t.cageCode}</span><span className={s.emptyText}><Icon name="kennel-empty" size={22} /> Trống{can('inpatient.admit') && <span className={s.emptyCta}> · bấm để nhập viện</span>}</span></>);
    return (
      <li data-cage className={cx(s.tile, s.empty)}>
        {can('inpatient.admit')
          ? <button type="button" className={s.emptyBtn} onClick={onAdmit} aria-label={`Nhập viện vào chuồng ${t.cageCode}`}>{inner}</button>
          : inner}
      </li>
    );
  }
  const x = t.stay;
  const next = nextStep(x, can);
  return (
    <m.li initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.03 }}>
      <AppLink to={paths.nv.stay(x.id)} className={cx(s.tile, s[`st_${x.internalStatus}`])} data-cage>
        <span className={s.tileTop}><span className={cx(s.cage, 'num')}>{t.cageCode}</span><StatusPill pill={statusPill('internal', x.internalStatus)} dense /></span>
        <span className={s.pet}>
          <PetAvatar name={x.petName} species={x.species} photoKey={x.photoKey} size={40} decorative />
          <span><strong className={s.petName}>{x.petName}</strong><span className={s.meta}>{SPECIES_LABEL[x.species]} · {x.ownerName}</span></span>
        </span>
        <span className={s.tileMid}>
          <span className="num">Ngày {x.dayNumber}</span>
          {x.doctorName && <span className={s.doc} title={x.doctorName}>{initials(x.doctorName)}</span>}
        </span>
        {next && <span className={s.tileFoot}><span data-next-step className={cx(s.foot, next.warm && s.footWarm)}>{next.warm && <span className={s.dot} />}{next.text}</span></span>}
      </AppLink>
    </m.li>
  );
}
