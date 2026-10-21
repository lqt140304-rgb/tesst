import { staff, type StayHistoryIcon } from '@/data/staff';
import { system } from '@/data/public';
import { useQuery } from '@/data/hooks/useQuery';
import { formatTimeVi } from '@/lib/dates';
import { EmptyState, Icon, type IconName } from '@/ui';
import { LoadingBlocks, PageProblem } from '../ui';
import { groupByDay } from './groupByDay';
import s from './Inpatient.module.css';

const ICON: Record<StayHistoryIcon, IconName> = {
  admit: 'log-in', transfer: 'refresh-cw', status: 'activity', discharge: 'log-out', diary: 'notebook-pen', video: 'video', clinical: 'clipboard-list',
};

/** What staff did on this stay, newest first, grouped by day. The API already leaves out orders and care for people without inpatient.clinical. */
export function HistoryTab({ stayId }: { stayId: string }) {
  const q = useQuery(() => staff.inpatient.history(stayId), [stayId]);
  if (q.error && !q.data) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks rows={3} />;
  if (q.data.length === 0) return <EmptyState icon="clipboard-list" title="Chưa có hoạt động nào." />;
  return (
    <div className={s.historyDays}>
      {groupByDay(q.data, system.now()).map((g) => (
        <section key={g.day} aria-label={g.label}>
          <h3 className={s.historyDay} data-history-day>{g.label}</h3>
          <ol className={s.history}>
            {g.items.map((i, n) => (
              <li key={`${i.at}-${n}`} className={s.historyRow} data-history>
                <span className={s.historyIcon}><Icon name={ICON[i.icon]} size={16} /></span>
                <div className={s.historyBody}>
                  <span className={s.historyLabel}>{i.label}</span>
                  <span className={s.meta}>{i.actorName} · <time dateTime={i.at} className="num">{formatTimeVi(i.at)}</time></span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
