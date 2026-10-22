import type { OperationsReport } from '@/data/staff';
import { headlines } from './reportsView';
import r from './Reports.module.css';

/** The four numbers of the period in one hairline-divided strip, each against the period before (in words). */
export function TrongKy({ report }: { report: OperationsReport }) {
  return (
    <section className={r.panel} aria-labelledby="bc-trong-ky">
      <div className={r.panelHead}><h2 id="bc-trong-ky" className={r.h2}>Trong kỳ</h2></div>
      <ul className={r.cells}>
        {headlines(report).map((h) => (
          <li key={h.key} className={r.cell} data-headline={h.key} data-value={h.value}>
            <div role="group" aria-label={`${h.label}: ${h.value}, ${h.delta}`} className={r.cellBody}>
              <span className={r.cellLabel}>{h.label}</span>
              <span className={`${r.big} num`}>{h.value.toLocaleString('vi-VN')}</span>
              <span className={r.cellDelta}>{h.delta}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
