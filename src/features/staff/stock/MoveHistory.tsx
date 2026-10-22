import { usePageSize } from '@/app/prefs';
import { STOCK_MOVE_KIND_LABEL, STOCK_REASON_LABEL } from '@/data/contracts/enums';
import type { StockMoveRow } from '@/data/staff';
import { DataTable, type Column } from '@/ui';
import { cx } from '@/lib/cx';
import { whenShort } from '../ui';
import { moveDelta } from './stockView';
import st from './Stock.module.css';

const COLUMNS: Column<StockMoveRow>[] = [
  { key: 'at', header: 'Ngày giờ', primary: true, cell: (m) => <span className="num">{whenShort(m.at)}</span> },
  { key: 'kind', header: 'Loại', cell: (m) => STOCK_MOVE_KIND_LABEL[m.kind] },
  { key: 'delta', header: 'Thay đổi', align: 'end', cell: (m) => {
    const d = moveDelta(m);
    return <span className={cx('num', d.tone === 'in' ? st.moveIn : st.moveOut)}>{d.text}</span>;
  } },
  { key: 'after', header: 'Tồn sau', align: 'end', cell: (m) => <span className="num">{m.qtyAfter.toLocaleString('vi-VN')}</span> },
  { key: 'reason', header: 'Lý do', cell: (m) => STOCK_REASON_LABEL[m.reason] },
  { key: 'note', header: 'Ghi chú', cell: (m) => [m.supplier, m.note].filter(Boolean).join(' · ') || '—' },
  { key: 'by', header: 'Người làm', cell: (m) => m.byName },
];

export const MOVE_LIMIT = 100;

/** Newest first, as the API returns them. */
export function MoveHistory({ moves }: { moves: StockMoveRow[] }) {
  const pageSize = usePageSize();
  return (
    <>
      <DataTable pageSize={pageSize} rows={moves} columns={COLUMNS} rowKey={(m) => m.id} caption="Lịch sử nhập xuất" noun="lần" />
      {moves.length >= MOVE_LIMIT && <p className={st.note}>Hiện tối đa {MOVE_LIMIT} lần gần nhất.</p>}
    </>
  );
}
