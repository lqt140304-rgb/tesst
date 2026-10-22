import type { OperationsReport } from '@/data/staff';
import { inpatientCells } from './reportsView';
import r from './Reports.module.css';

/** The stays: who is in now, who came and went in the period, and two measures explained in plain words. */
export function InpatientSection({ report }: { report: OperationsReport }) {
  return (
    <section className={r.panel} aria-labelledby="bc-noi-tru">
      <div className={r.panelHead}><h2 id="bc-noi-tru" className={r.h2}>Nội trú</h2></div>
      <ul className={r.cells}>
        {inpatientCells(report.inpatient).map((c) => (
          <li key={c.key} className={r.cell} data-kpi={`inpatient-${c.key}`}>
            <div className={r.cellBody}>
              <span className={r.cellLabel}>{c.label}</span>
              <span className={`${r.big} num`}>{c.value}</span>
              {c.note && <span className={r.note}>{c.note}</span>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
