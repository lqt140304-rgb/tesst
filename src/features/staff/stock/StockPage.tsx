import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AppLink, useAppNavigate } from '@/app/nav';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { staff, type StockRow } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { STOCK_KIND_LABEL, type StockKind } from '@/data/contracts/enums';
import { formatDateVi } from '@/lib/dates';
import { Banner, Button, Checkbox, ChipGroup, DataTable, EmptyState, Icon, type Column } from '@/ui';
import { cx } from '@/lib/cx';
import { LoadingBlocks, PageHeader, PageProblem } from '../ui';
import { StockLevelTag } from './StockLevelTag';
import { StockItemDialog } from './StockItemDialog';
import { StockSummaryTiles } from './StockSummaryTiles';
import { DEFAULT_FILTERS, TILE_STATUS, qtyText, readFilters, stockCaps, tilePressed, toListFilter, writeFilters, type StockFilters, type TileKey } from './stockView';
import s from '../Staff.module.css';
import st from './Stock.module.css';

const COLUMNS: Column<StockRow>[] = [
  { key: 'code', header: 'Mã', cell: (i) => <span className={cx(s.code, 'num', !i.active && st.off)}>{i.code}</span> },
  { key: 'name', header: 'Tên', primary: true, cell: (i) => (
    <span className={cx(st.nameCell, !i.active && st.off)}><AppLink to={paths.nv.stockItem(i.id)} className={s.cellLink}>{i.name}</AppLink></span>
  ) },
  { key: 'kind', header: 'Loại', hideOnPhone: true, cell: (i) => STOCK_KIND_LABEL[i.kind] },
  { key: 'qty', header: 'Tồn', align: 'end', cell: (i) => <span className="num">{qtyText(i.qty, i.unit)}</span> },
  { key: 'min', header: 'Mức báo hết', align: 'end', hideOnPhone: true, cell: (i) => <span className="num">{i.minQty > 0 ? i.minQty.toLocaleString('vi-VN') : '—'}</span> },
  { key: 'expiry', header: 'Hạn dùng', hideOnPhone: true, cell: (i) => <span className="num">{i.expiresOn ? formatDateVi(i.expiresOn) : '—'}</span> },
  { key: 'status', header: 'Tình trạng', cell: (i) => <StockLevelTag item={i} /> },
];

const KINDS: (StockKind | 'all')[] = ['all', 'thuoc', 'vat_tu'];

/** Kho (phần 5A): what is in the cupboard and what needs attention. Filters live in the address so Back and reload keep them. */
export function StockPage() {
  const { can } = useSession();
  const { view, manage } = stockCaps(can);
  const [adding, setAdding] = useState(false);
  const navigate = useAppNavigate();
  const [params, setParams] = useSearchParams();
  const f = readFilters(params);
  const write = (patch: Partial<StockFilters>) => setParams((prev) => writeFilters({ ...readFilters(prev), ...patch }), { replace: true });
  // The router applies address changes a beat late, which a text box cannot wait for: the box keeps its own text and the address follows once typing pauses.
  const [typed, setTyped] = useState(f.q);
  const pause = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(pause.current), []);
  const type = (q: string) => {
    setTyped(q);
    window.clearTimeout(pause.current);
    pause.current = window.setTimeout(() => write({ q }), 250);
  };
  /** A chip, tile or checkbox: what is typed goes along with it, since the address may not hold it yet. */
  const update = (patch: Partial<StockFilters>) => { window.clearTimeout(pause.current); write({ ...patch, q: typed }); };
  const clearFilters = () => { window.clearTimeout(pause.current); setTyped(''); write(DEFAULT_FILTERS); };
  const [kept, setKept] = useState<StockRow[]>();
  const list = useQuery(() => staff.stock.list(toListFilter(f)), [JSON.stringify(f)]);
  const summary = useQuery(() => staff.stock.summary(), []);
  if (!view) return null;
  if (list.error && !list.data) return <PageProblem error={list.error} onRetry={list.refetch} />;
  if (list.data && list.data !== kept) setKept(list.data);
  if (!summary.data || !(list.data ?? kept)) return <LoadingBlocks />;
  // A new filter has no data for a moment: the table keeps the last rows meanwhile, so nothing jumps and the search box keeps its focus.
  const rows = list.data ?? kept!;
  const unfiltered = JSON.stringify(f) === JSON.stringify(DEFAULT_FILTERS);
  const pick = (key: TileKey) => update({ status: tilePressed(f, key) ? 'all' : TILE_STATUS[key] });

  return (
    <>
      <PageHeader title="Kho" sub="Thuốc và vật tư trong phòng khám. Số tồn đổi bằng Nhập thêm, Xuất ra hoặc Kiểm kê."
        actions={manage && <Button icon="plus" onClick={() => setAdding(true)}>Thêm món</Button>} />
      <div className={s.stack}>
        <Banner tone="warm" icon="info">Dữ liệu kho trong bản demo là dữ liệu mẫu.</Banner>
        <StockSummaryTiles summary={summary.data} filters={f} onPick={pick} />
        <div className={s.toolbar}>
          <label className={s.search}>
            <Icon name="search" size={18} />
            <input type="search" value={typed} onChange={(e) => type(e.target.value)} placeholder="Mã hoặc tên món" aria-label="Tìm trong kho" />
          </label>
        </div>
        <div className={st.filters}>
          <ChipGroup<StockKind | 'all'> label="Lọc theo loại" value={f.kind} onChange={(kind) => update({ kind })}
            options={KINDS.map((k) => ({ value: k, label: k === 'all' ? 'Tất cả' : STOCK_KIND_LABEL[k] }))} />
          <ChipGroup<StockFilters['status']> label="Lọc theo tình trạng" value={f.status} onChange={(status) => update({ status })} options={[
            { value: 'all', label: 'Tất cả' }, { value: 'low', label: 'Sắp hết' }, { value: 'out', label: 'Hết hàng' }, { value: 'expiring', label: 'Sắp hoặc đã hết hạn' },
          ]} />
          <Checkbox label="Hiện cả món đã ngừng dùng" checked={f.showInactive} onChange={(e) => update({ showInactive: e.target.checked })} />
        </div>
        {rows.length === 0 ? (
          unfiltered
            ? <EmptyState icon="package" title="Kho chưa có món nào." action={manage && <Button icon="plus" onClick={() => setAdding(true)}>Thêm món</Button>} />
            : <EmptyState icon="package" title="Chưa có món nào khớp." body="Thử bỏ bớt bộ lọc." action={<Button variant="secondary" onClick={clearFilters}>Bỏ lọc</Button>} />
        ) : (
          <DataTable key={JSON.stringify(f)} rows={rows} columns={COLUMNS} rowKey={(i) => i.id} caption="Danh sách kho" noun="món" onOpen={(i) => navigate(paths.nv.stockItem(i.id))} />
        )}
      </div>
      {manage && <StockItemDialog key={adding ? 'new' : 'closed'} open={adding} onClose={() => setAdding(false)} onSaved={(id) => navigate(paths.nv.stockItem(id))} />}
    </>
  );
}
