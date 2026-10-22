import { ChipGroup, Field, Input, Button } from '@/ui';
import type { Period } from './revenueView';
import s from '../Staff.module.css';
import r from './Revenue.module.css';

const LABEL: Record<Period, string> = { today: 'Hôm nay', '7d': '7 ngày', '30d': '30 ngày', month: 'Tháng này', prev: 'Tháng trước', custom: 'Chọn ngày' };

/** Fixed periods plus "Chọn ngày", which opens two date fields. Errors come from the caller (calendar rules), shown under the right field. */
export function PeriodPicker({ value, onPick, from, to, onFrom, onTo, onApply, errors }: {
  value: Period; onPick: (p: Period) => void; from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void; onApply: () => void; errors: { from?: string; to?: string };
}) {
  return (
    <div className={s.stack} style={{ gap: 10 }}>
      <ChipGroup<Period> label="Kỳ báo cáo" value={value} onChange={onPick} options={(Object.keys(LABEL) as Period[]).map((p) => ({ value: p, label: LABEL[p] }))} />
      {value === 'custom' && (
        <div className={r.range}>
          <Field label="Từ ngày" error={errors.from}><Input type="date" value={from} onChange={(e) => onFrom(e.target.value)} /></Field>
          <Field label="Đến ngày" error={errors.to}><Input type="date" value={to} onChange={(e) => onTo(e.target.value)} /></Field>
          <Button onClick={onApply}>Xem</Button>
        </div>
      )}
    </div>
  );
}
