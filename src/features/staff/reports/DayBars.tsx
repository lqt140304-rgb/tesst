import { m, useReducedMotion } from 'motion/react';
import { formatDateVi, formatShortDateVi } from '@/lib/dates';
import { Button, DataTable, type Column } from '@/ui';
import { axisEvery, bucketDaily } from '../revenue/revenueView';
import r from './Reports.module.css';

type Day = { date: string; count: number };
const COLUMNS: Column<Day>[] = [
  { key: 'date', header: 'Ngày', primary: true, cell: (x) => <span className="num">{formatDateVi(`${x.date}T12:00:00+07:00`)}</span> },
  { key: 'count', header: 'Số lịch', align: 'end', cell: (x) => <span className="num">{x.count.toLocaleString('vi-VN')}</span> },
];

/** Appointments per day as bars (one per week once the range passes 120 days), or the same numbers as a table. */
export function DayBars({ daily, asTable, onToggle }: { daily: Day[]; asTable: boolean; onToggle: () => void }) {
  const reduce = useReducedMotion();
  const { unit, bars } = bucketDaily(daily.map((d) => ({ date: d.date, amount: d.count })));
  const max = Math.max(1, ...bars.map((x) => x.amount));
  const every = axisEvery(bars.length);
  return (
    <div className={r.stackSm}>
      <Button size="sm" variant="ghost" icon={asTable ? 'chart-column' : 'list'} className={r.toggle} onClick={onToggle}>{asTable ? 'Xem biểu đồ' : 'Xem dạng bảng'}</Button>
      {asTable ? (
        <DataTable rows={daily} columns={COLUMNS} rowKey={(x) => x.date} caption="Bảng lịch đã hẹn theo ngày" noun="ngày" />
      ) : (
        <figure className={r.chart} aria-label="Biểu đồ lịch đã hẹn theo ngày">
          <div className={r.bars} style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))`, gap: bars.length > 31 ? 1 : 4 }}>
            {bars.map((x, i) => (
              <div key={x.date} className={r.barCol} title={`${unit === 'week' ? 'Tuần từ ' : ''}${formatShortDateVi(`${x.date}T12:00:00+07:00`)}: ${x.amount} lịch`}>
                <m.span className={r.bar} style={{ height: `${(x.amount / max) * 100}%` }}
                  initial={reduce ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.45, delay: Math.min(i * 0.02, 0.4), ease: [0.2, 0.7, 0.2, 1] }} />
                {i % every === 0 && <span className={r.barLabel}>{formatShortDateVi(`${x.date}T12:00:00+07:00`)}</span>}
              </div>
            ))}
          </div>
          <figcaption className={r.chartNote}>Cao nhất {max} lịch / {unit === 'week' ? 'tuần (mỗi cột là một tuần)' : 'ngày'}. Rê chuột lên cột để xem số.</figcaption>
        </figure>
      )}
    </div>
  );
}
