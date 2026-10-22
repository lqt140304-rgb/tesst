import { REQUEST_STATUSES, REQUEST_STATUS_LABEL } from '@/data/contracts/enums';
import type { OperationsReport } from '@/data/staff';
import { RatioList } from './RatioList';
import { minutesText, percentText, ratioRows } from './reportsView';
import r from './Reports.module.css';

export function RequestsSection({ report }: { report: OperationsReport }) {
  const q = report.requests;
  const kpis = [
    { key: 'received', label: 'Đã nhận', value: q.received.toLocaleString('vi-VN'), raw: q.received },
    { key: 'confirmRate', label: 'Tỉ lệ xác nhận', value: percentText(q.confirmRate) },
    { key: 'firstResponse', label: 'Phản hồi đầu tiên (trung bình)', value: minutesText(q.avgFirstResponseMin) },
  ];
  return (
    <section className={r.panel} aria-labelledby="bc-yeu-cau">
      <div className={r.panelHead}><h2 id="bc-yeu-cau" className={r.h2}>Yêu cầu đặt lịch</h2></div>
      <div className={r.halves}>
        <ul className={r.kpis}>
          {kpis.map((k) => (
            <li key={k.key} className={r.kpi} data-kpi={k.key} data-value={k.raw}>
              <span className={r.cellLabel}>{k.label}</span>
              <span className={`${r.big} num`}>{k.value}</span>
            </li>
          ))}
        </ul>
        <RatioList title="Theo trạng thái" data="status" rows={ratioRows(q.byStatus, REQUEST_STATUSES, REQUEST_STATUS_LABEL)} />
      </div>
    </section>
  );
}
