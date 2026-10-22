import { useState } from 'react';
import { previousPeriod } from '@/data/rules/calendar';
import { staff, type OperationsReport } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { formatDateVi } from '@/lib/dates';
import { Icon } from '@/ui';
import { LoadingBlocks, PageHeader, PageProblem } from '../ui';
import { AppointmentsSection } from './AppointmentsSection';
import { AttentionList } from './AttentionList';
import { InpatientSection } from './InpatientSection';
import { RevenueGlance } from './RevenueGlance';
import { RequestsSection } from './RequestsSection';
import { isEmptyPeriod, showRevenue } from './reportsView';
import { TrongKy } from './TrongKy';
import { PeriodPicker } from '../revenue/PeriodPicker';
import { usePeriodRange } from '../revenue/usePeriodRange';
import s from '../Staff.module.css';
import r from './Reports.module.css';

const day = (iso: string) => formatDateVi(`${iso}T12:00:00+07:00`);
const days = (x: { from: string; to: string }) => (x.from === x.to ? day(x.from) : `${day(x.from)} đến ${day(x.to)}`);

/** Báo cáo vận hành (phần 5B), Quản lý: the week at a glance, against the period just before. */
export function ReportsPage() {
  const { range, picker } = usePeriodRange('7d');
  const q = useQuery(() => staff.reports.operations(range), [range.from, range.to]);
  // A new period has no data for a moment: the last report stays on screen meanwhile, so the page never jumps.
  const [kept, setKept] = useState<OperationsReport>();
  if (q.data && q.data !== kept) setKept(q.data);
  const report = q.data ?? kept;
  if (q.error && !report) return <PageProblem error={q.error} onRetry={q.refetch} />;

  // The days named are the days of the numbers on screen (from the report), not the address, which may already be the next period.
  const thisPeriod = report ? { from: report.from, to: report.to } : range;
  const before = report ? report.previous : previousPeriod(range.from, range.to);

  return (
    <>
      <PageHeader title="Báo cáo vận hành" sub="Công việc của Lê Sơn trong một kỳ, so với kỳ liền trước." />
      <div className={s.stack}>
        <div className={r.periodBar}>
          <PeriodPicker {...picker} />
          <ul className={r.periodLines}>
            <li className={r.periodLine} data-period="current">Kỳ này: <strong className="num">{days(thisPeriod)}</strong></li>
            <li className={r.periodLine} data-period="previous">Kỳ trước: <strong className="num">{days(before)}</strong></li>
          </ul>
        </div>
        {!report ? <LoadingBlocks rows={4} /> : (
          <>
            <div className={r.firstRow}>
              <TrongKy report={report} />
              <AttentionList report={report} />
            </div>
            {isEmptyPeriod(report) ? (
              <p className={`${r.panel} ${r.emptyNote}`} data-empty><Icon name="info" size={18} />Chưa có số liệu trong kỳ này. Thử chọn kỳ dài hơn.</p>
            ) : (
              <>
                <AppointmentsSection report={report} />
                <RequestsSection report={report} />
              </>
            )}
            <InpatientSection report={report} />
            {showRevenue(report) && <RevenueGlance revenue={report.revenue} />}
          </>
        )}
      </div>
    </>
  );
}
