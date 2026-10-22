import { PRICE_CATEGORIES, PRICE_CATEGORY_LABEL, type PriceCategory } from '@/data/contracts/enums';
import { formatVnd } from '@/lib/money';
import { Button } from '@/ui';
import { Panel } from '../ui';
import { shares } from './revenueView';
import s from '../Staff.module.css';
import r from './Revenue.module.css';

/** Invoiced money by service group, after discount: bars with a share of the total, or a table twin that ends with the total. */
export function CategoryBars({ byCategory, asTable, onToggle }: { byCategory: Record<PriceCategory, number>; asTable: boolean; onToggle: () => void }) {
  const values = PRICE_CATEGORIES.map((c) => byCategory[c]);
  const pct = shares(values);
  const total = values.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...values);
  return (
    <Panel title="Theo nhóm dịch vụ" icon="tags" action={<Button size="sm" variant="ghost" icon={asTable ? 'chart-column' : 'list'} onClick={onToggle}>{asTable ? 'Xem thanh' : 'Xem nhóm dạng bảng'}</Button>}>
      <p className={s.meta}>(theo hóa đơn phát hành trong kỳ, sau giảm giá)</p>
      {asTable ? (
        <div className={s.tableWrap} tabIndex={0} role="region" aria-label="Bảng nhóm dịch vụ">
          <table className={s.table} aria-label="Doanh thu theo nhóm dịch vụ">
            <thead><tr><th scope="col">Nhóm</th><th scope="col">Số tiền</th><th scope="col">Tỷ lệ</th></tr></thead>
            <tbody>{PRICE_CATEGORIES.map((c, i) => <tr key={c}><td>{PRICE_CATEGORY_LABEL[c]}</td><td className={s.num}>{formatVnd(values[i]!)}</td><td className={s.num}>{pct[i]}%</td></tr>)}</tbody>
            <tfoot><tr><th scope="row">Tổng</th><td className={s.num}>{formatVnd(total)}</td><td className={s.num}>{total > 0 ? '100%' : '0%'}</td></tr></tfoot>
          </table>
        </div>
      ) : (
        <ul className={r.hbars}>
          {PRICE_CATEGORIES.map((c, i) => (
            <li key={c}>
              <span className={r.hLabel}>{PRICE_CATEGORY_LABEL[c]}</span>
              <span className={r.hTrack}><span className={r.hFill} style={{ width: `${(values[i]! / max) * 100}%` }} /></span>
              <span className={s.num}>{formatVnd(values[i]!)} · <span data-share>{pct[i]}%</span></span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
