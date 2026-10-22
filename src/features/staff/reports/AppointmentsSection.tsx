import { useState } from 'react';
import { APPOINTMENT_SOURCES, APPOINTMENT_SOURCE_LABEL, SERVICES, SERVICE_LABEL } from '@/data/contracts/enums';
import type { OperationsReport } from '@/data/staff';
import { DayBars } from './DayBars';
import { RatioList } from './RatioList';
import { appointmentSummary, ratioRows } from './reportsView';
import r from './Reports.module.css';

export function AppointmentsSection({ report }: { report: OperationsReport }) {
  const a = report.appointments;
  const [asTable, setAsTable] = useState(false);
  return (
    <section className={r.panel} aria-labelledby="bc-lich-hen">
      <div className={r.panelHead}><h2 id="bc-lich-hen" className={r.h2}>Lịch hẹn</h2></div>
      <p className={r.summary} data-summary="appointments">{appointmentSummary(a)}</p>
      <div className={r.sectionCols}>
        <DayBars daily={a.daily} asTable={asTable} onToggle={() => setAsTable((x) => !x)} />
        <div className={r.section}>
          <RatioList title="Theo dịch vụ" data="service" rows={ratioRows(a.byService, SERVICES, SERVICE_LABEL)} />
          <RatioList title="Theo nguồn đặt" data="source" rows={ratioRows(a.bySource, APPOINTMENT_SOURCES, APPOINTMENT_SOURCE_LABEL)} />
        </div>
      </div>
    </section>
  );
}
