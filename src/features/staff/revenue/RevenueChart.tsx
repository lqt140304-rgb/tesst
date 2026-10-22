import { m, useReducedMotion } from 'motion/react';
import type { RevenueReport } from '@/data/staff';
import { formatDateVi, formatShortDateVi } from '@/lib/dates';
import { formatVnd } from '@/lib/money';
import { Button, DataTable, type Column } from '@/ui';
import { Panel } from '../ui';
import { axisEvery, bucketDaily } from './revenueView';
import s from '../Staff.module.css';
import r from './Revenue.module.css';

type Day = RevenueReport['daily'][number];
const COLUMNS: Column<Day>[] = [
  { key: 'date', header: 'Ngày', primary: true, cell: (x) => <span className="num">{formatDateVi(`${x.date}T12:00:00+07:00`)}</span> },
  { key: 'amount', header: 'Tiền đã thu', align: 'end', cell: (x) => <span className="num">{formatVnd(x.amount)}</span> },
];

/** Money collected per day: bars, or a table twin (paged for long ranges). Labels thin out as the range grows. */
export function RevenueChart({ daily, asTable, onToggle }: { daily: Day[]; asTable: boolean; onToggle: () => void }) {
  const reduce = useReducedMotion();
  const { unit, bars } = bucketDaily(daily);
  const maxDay = Math.max(1, ...bars.map((x) => x.amount));
  const every = axisEvery(bars.length);
  return (
    <Panel title="Tiền thu theo ngày" icon="chart-column" action={<Button size="sm" variant="ghost" icon={asTable ? 'chart-column' : 'list'} onClick={onToggle}>{asTable ? 'Xem biểu đồ' : 'Xem dạng bảng'}</Button>}>
      {asTable ? (
        <DataTable rows={daily} columns={COLUMNS} rowKey={(x) => x.date} caption="Bảng tiền thu theo ngày" noun="ngày" />
      ) : (
        <figure className={r.chart} aria-label="Biểu đồ tiền thu theo ngày">
          <div className={r.bars} style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))`, gap: bars.length > 31 ? 1 : 4 }}>
            {bars.map((x, i) => (
              <div key={x.date} className={r.barCol} title={`${unit === 'week' ? 'Tuần từ ' : ''}${formatShortDateVi(`${x.date}T12:00:00+07:00`)}: ${formatVnd(x.amount)}`}>
                <m.span className={r.bar} style={{ height: `${(x.amount / maxDay) * 100}%` }}
                  initial={reduce ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.5, delay: Math.min(i * 0.02, 0.4), ease: [0.2, 0.7, 0.2, 1] }} />
                {i % every === 0 && <span className={r.barLabel}>{formatShortDateVi(`${x.date}T12:00:00+07:00`)}</span>}
              </div>
            ))}
          </div>
          <figcaption className={s.meta}>Cao nhất <span className="num">{formatVnd(maxDay)}</span> / {unit === 'week' ? 'tuần (mỗi cột là một tuần)' : 'ngày'} · rê chuột lên cột để xem số tiền, hoặc chọn “Xem dạng bảng”.</figcaption>
        </figure>
      )}
    </Panel>
  );
}
