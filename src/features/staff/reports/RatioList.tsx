import { cx } from '@/lib/cx';
import type { RatioRow } from './reportsView';
import r from './Reports.module.css';

/** A split of one number: each row is its name, the count in words and a thin bar. The words are the data; the bar only helps the eye. */
export function RatioList<K extends string>({ title, rows, data }: { title: string; rows: RatioRow<K>[]; data: string }) {
  return (
    <div className={r.stackSm}>
      <h3 className={r.h3}>{title}</h3>
      <ul className={r.ratios} data-ratio={data}>
        {rows.map((x) => (
          <li key={x.key} className={cx(r.ratio, x.count === 0 && r.ratioZero)} data-ratio-row data-count={x.count}>
            <span className={r.ratioHead}>
              <span>{x.label}</span>
              <span className={`${r.ratioNum} num`}>{x.count.toLocaleString('vi-VN')} ({x.share}%)</span>
            </span>
            <span className={r.ratioBar} style={{ width: `${Math.max(x.fill * 100, x.count > 0 ? 2 : 0)}%` }} aria-hidden="true" />
          </li>
        ))}
      </ul>
    </div>
  );
}
