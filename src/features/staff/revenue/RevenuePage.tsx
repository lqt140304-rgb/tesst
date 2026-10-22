import { reportPeriod, usePrefs } from '@/app/prefs';
import { useState } from 'react';
import { staff } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from '@/data/contracts/enums';
import { previousPeriod } from '@/data/rules/calendar';
import { formatDateVi } from '@/lib/dates';
import { formatVnd } from '@/lib/money';
import { CountUp, Icon } from '@/ui';
import { LoadingBlocks, PageHeader, PageProblem, Panel } from '../ui';
import { CategoryBars } from './CategoryBars';
import { OpenInvoices } from './OpenInvoices';
import { PeriodPicker } from './PeriodPicker';
import { usePeriodRange } from './usePeriodRange';
import { RevenueChart } from './RevenueChart';
import { shares } from './revenueView';
import s from '../Staff.module.css';
import r from './Revenue.module.css';

const METHOD_ICON = { cash: 'banknote', transfer: 'landmark', qr: 'qr-code' } as const;

/** Doanh thu (staff §6.9), manager only: cash collected by period; outstanding is not period-bound. No CSV in P0. */
export function RevenuePage() {
  const { prefs } = usePrefs();
  const { range: cur, picker } = usePeriodRange(reportPeriod(prefs.report_range));
  const [daysAsTable, setDaysAsTable] = useState(false);
  const [groupsAsTable, setGroupsAsTable] = useState(false);
  const prev = previousPeriod(cur.from, cur.to);
  const q = useQuery(() => staff.reports.revenue({ from: cur.from, to: cur.to }), [cur.from, cur.to]);
  const before = useQuery(() => staff.reports.revenue(prev), [prev.from, prev.to]);

  const d = q.data;
  const delta = d && before.data && before.data.collected > 0 ? Math.round(((d.collected - before.data.collected) / before.data.collected) * 100) : null;
  const methodShares = shares(d ? (Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((k) => d.byMethod[k]) : []);

  return (
    <>
      <PageHeader title="Doanh thu" sub={`${formatDateVi(`${cur.from}T12:00:00+07:00`)} – ${formatDateVi(`${cur.to}T12:00:00+07:00`)} · tính theo tiền đã thu`} />
      <PeriodPicker {...picker} />
      <details className={r.how}>
        <summary>Cách tính</summary>
        <p>Tiền đã thu là tiền khách đã trả trong kỳ. Theo nhóm dịch vụ tính trên hóa đơn phát hành trong kỳ, sau giảm giá, nên hai con số có thể khác nhau. Còn phải thu là mọi hóa đơn đang nợ, không theo kỳ.</p>
      </details>
      {q.error && !d && <PageProblem error={q.error} onRetry={q.refetch} />}
      {!q.error && !d && <LoadingBlocks rows={3} />}
      {d && (<>
      <div className={s.tiles}>
        <div className={s.tile} data-kpi="collected">
          <span className={s.tileLabel}><span className={s.tileIcon} style={{ background: 'var(--badge-mint)' }}><Icon name="banknote" size={16} /></span>Tiền đã thu</span>
          <span className={s.tileNum}><CountUp value={d.collected} format={formatVnd} /></span>
          <span className={s.tileSub}>{delta === null ? 'Kỳ trước chưa có số liệu' : `${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta)}% so với kỳ trước`}</span>
        </div>
        <div className={s.tile} data-kpi="issued">
          <span className={s.tileLabel}><span className={s.tileIcon} style={{ background: 'var(--badge-lilac)' }}><Icon name="receipt" size={16} /></span>Hóa đơn phát hành</span>
          <span className={s.tileNum}><CountUp value={d.invoicesIssued} /><small>hóa đơn</small></span>
          <span className={s.tileSub}>Trong kỳ đã chọn</span>
        </div>
        <div className={s.tile} data-kpi="outstanding">
          <span className={s.tileLabel}><span className={s.tileIcon} style={{ background: 'var(--badge-peach)' }}><Icon name="clock" size={16} /></span>Còn phải thu</span>
          <span className={s.tileNum}>{formatVnd(d.outstanding)}</span>
          <span className={s.tileSub}>{d.outstandingCount} hóa đơn đang mở (không theo kỳ)</span>
        </div>
      </div>

      {d.collected === 0 && d.invoicesIssued === 0 && <p className={s.empty} data-empty>Chưa có khoản thu nào trong kỳ này.</p>}
      </>)}
      {/* The open invoices do not depend on the period, so they stay on screen while a new period loads. */}
      <div className={s.cols}>
        <div className={s.stack}>
          {d && <>
          <RevenueChart daily={d.daily} asTable={daysAsTable} onToggle={() => setDaysAsTable((x) => !x)} />
          <Panel title="Theo phương thức" icon="banknote">
            <ul className={s.rows}>
              {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((k, i) => (
                <li key={k} className={s.row} data-method>
                  <Icon name={METHOD_ICON[k]} size={18} />
                  <span className={s.rowMain}><span className={s.rowTitle}>{PAYMENT_METHOD_LABEL[k]}</span></span>
                  <span className={`${s.num} num`}>{formatVnd(d.byMethod[k])} · {methodShares[i]}%</span>
                </li>
              ))}
            </ul>
          </Panel>
          </>}
        </div>
        <div className={s.stack}>
          {d && <CategoryBars byCategory={d.byCategory} asTable={groupsAsTable} onToggle={() => setGroupsAsTable((x) => !x)} />}
          <OpenInvoices />
        </div>
      </div>
      <p className={s.meta} style={{ marginTop: 16 }}>Số liệu được tính từ dữ liệu mẫu.</p>
    </>
  );
}
