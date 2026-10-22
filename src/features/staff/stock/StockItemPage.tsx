import { useParams } from 'react-router';
import { paths } from '@/app/routes';
import { staff } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { NotFoundError } from '@/data/contracts/errors';
import { STOCK_KIND_LABEL } from '@/data/contracts/enums';
import { formatDateVi, todayVN } from '@/lib/dates';
import { ButtonLink, EmptyState } from '@/ui';
import { LoadingBlocks, PageHeader, PageProblem, Panel } from '../ui';
import { MoveHistory } from './MoveHistory';
import { StockLevelTag } from './StockLevelTag';
import { qtyText, statusSentence } from './stockView';
import s from '../Staff.module.css';
import st from './Stock.module.css';

/** One item of the stock: where it stands, and every time it went in or out. */
export function StockItemPage() {
  const { id = '' } = useParams();
  const q = useQuery(() => staff.stock.get(id), [id]);
  if (q.error && !q.data) {
    if (q.error instanceof NotFoundError) {
      return <EmptyState icon="package" title="Không tìm thấy món này" body="Có thể món không còn trong kho hoặc đường dẫn đã thay đổi."
        action={<ButtonLink to={paths.nv.stock} icon="arrow-left">Về danh sách Kho</ButtonLink>} />;
    }
    return <PageProblem error={q.error} onRetry={q.refetch} />;
  }
  if (!q.data) return <LoadingBlocks />;
  const { item, moves } = q.data;
  const sentence = statusSentence(item, todayVN(new Date()));

  return (
    <>
      <PageHeader title={item.name} parent={{ label: 'Kho', to: paths.nv.stock }} sub={<><span className="num">{item.code}</span> · {STOCK_KIND_LABEL[item.kind]}</>} />
      <div className={s.stack}>
        <Panel>
          <div className={st.hero}>
            <div role="group" aria-label="Tồn hiện tại" className={st.bigQty}>
              <span className="num">{item.qty.toLocaleString('vi-VN')}</span>{' '}<small>{item.unit}</small>
            </div>
            <StockLevelTag item={item} />
          </div>
          {sentence && <p className={st.sentence}>{sentence}</p>}
          <dl className={st.facts}>
            <div><dt>Loại</dt><dd>{STOCK_KIND_LABEL[item.kind]}</dd></div>
            <div><dt>Đơn vị</dt><dd>{item.unit}</dd></div>
            <div><dt>Mức báo hết</dt><dd>{item.minQty > 0 ? qtyText(item.minQty, item.unit) : 'Không đặt'}</dd></div>
            <div><dt>Hạn dùng</dt><dd>{item.expiresOn ? formatDateVi(item.expiresOn) : 'Không có'}</dd></div>
          </dl>
        </Panel>
        <Panel title="Lịch sử nhập xuất" icon="clipboard-list">
          <MoveHistory moves={moves} />
        </Panel>
      </div>
    </>
  );
}
