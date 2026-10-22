import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import type { OpsRevenue } from '@/data/staff';
import { formatVnd } from '@/lib/money';
import { Icon } from '@/ui';
import { deltaText } from './reportsView';
import r from './Reports.module.css';

/** Money in short, only for people who may see revenue; the full picture is the Doanh thu page. */
export function RevenueGlance({ revenue }: { revenue: OpsRevenue }) {
  const kpis = [
    { key: 'collected', label: 'Đã thu', value: revenue.collected, note: deltaText(revenue.collected, revenue.previousCollected, formatVnd) },
    { key: 'invoiced', label: 'Đã xuất hóa đơn', value: revenue.invoiced },
    { key: 'outstanding', label: 'Còn nợ lúc này', value: revenue.outstanding, note: 'Không phụ thuộc kỳ đã chọn.' },
  ];
  return (
    <section className={r.panel} aria-labelledby="bc-doanh-thu">
      <div className={r.panelHead}><h2 id="bc-doanh-thu" className={r.h2}>Doanh thu trong kỳ</h2></div>
      <ul className={r.kpis}>
        {kpis.map((k) => (
          <li key={k.key} className={r.kpi} data-kpi={k.key}>
            <span className={r.cellLabel}>{k.label}</span>
            <span className={`${r.big} num`}>{formatVnd(k.value)}</span>
            {k.note && <span className={r.cellDelta}>{k.note}</span>}
          </li>
        ))}
      </ul>
      <AppLink to={paths.nv.revenue} className={r.linkText}>Xem chi tiết doanh thu<Icon name="arrow-right" size={16} /></AppLink>
    </section>
  );
}
