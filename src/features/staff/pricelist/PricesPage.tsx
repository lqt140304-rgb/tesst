import { usePageSize } from '@/app/prefs';
import { useState } from 'react';
import { useSession } from '@/app/session/SessionProvider';
import { staff, type StaffPriceItem } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { PRICE_CATEGORIES, PRICE_CATEGORY_LABEL, type PriceCategory } from '@/data/contracts/enums';
import { Banner, Button, ChipGroup, DataTable, EmptyState, Icon, useToast, type Column } from '@/ui';
import { cx } from '@/lib/cx';
import { LoadingBlocks, MiniTag, PageHeader, PageProblem, saveError } from '../ui';
import { categoryCounts, filterPrices, statusCounts, type StatusFilter } from './priceView';
import { DeactivateDialog } from './DeactivateDialog';
import { PriceDialog } from './PriceDialog';
import { isDayItemCode, priceLabel } from './priceForm';
import s from '../Staff.module.css';
import pr from './Prices.module.css';

const TONE: Record<PriceCategory, string> = { exam: s.svc_kham!, spa: s.svc_spa!, inpatient: s.svc_noi_tru!, medicine: '', supply: '' };

const baseColumns: Column<StaffPriceItem>[] = [
  { key: 'code', header: 'Mã', cell: (p) => <span className={cx(s.code, 'num', !p.active && pr.off)}>{p.code}</span> },
  { key: 'name', header: 'Tên', primary: true, cell: (p) => (
    <span className={cx(pr.nameCell, !p.active && pr.off)}>
      <strong>{p.name}</strong>
      {p.customer_group === 'treatment' && <span className={s.meta}>Khách thấy trong “Thuốc và vật tư điều trị”</span>}
      {isDayItemCode(p.code) && <span className={s.meta}>Dùng để tính tiền nội trú</span>}
    </span>
  ) },
  { key: 'category', header: 'Nhóm', hideOnPhone: true, cell: (p) => <span className={cx(s.svc, TONE[p.category])}>{PRICE_CATEGORY_LABEL[p.category]}</span> },
  { key: 'unit', header: 'Đơn vị', cell: (p) => <span className={!p.active ? pr.off : undefined}>{p.unit}</span> },
  { key: 'price', header: 'Giá', align: 'end', cell: (p) => {
    const l = priceLabel(p);
    return <span className={cx(pr.priceCell, !p.active && pr.off)}><span className="num">{l.main}</span>{l.hint && <span className={cx(s.meta, 'num')}>{l.hint}</span>}</span>;
  } },
  { key: 'status', header: 'Trạng thái', cell: (p) => (p.active ? <MiniTag tone="teal" icon="circle-check">Đang dùng</MiniTag> : <MiniTag>Ngừng dùng</MiniTag>) },
];

/** Bảng giá (staff §6.8): a shared table with search and filters. Editing (add, edit, switch off) needs pricelist.edit. */
export function PricesPage() {
  const pageSize = usePageSize();
  const { can } = useSession();
  const canEdit = can('pricelist.edit');
  const toast = useToast();
  const [editing, setEditing] = useState<StaffPriceItem | 'new' | null>(null);
  const [switching, setSwitching] = useState<StaffPriceItem | null>(null);
  const q = useQuery(() => staff.prices.list(), []);
  const [needle, setNeedle] = useState('');
  const [category, setCategory] = useState<PriceCategory | 'all'>('all');
  const [status, setStatus] = useState<StatusFilter>('active');
  if (q.error && !q.data) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks />;
  const items = q.data;
  const counts = statusCounts(items);
  const perCategory = categoryCounts(items, status);
  const rows = filterPrices(items, { needle, category, status });
  async function reactivate(p: StaffPriceItem) {
    try {
      await staff.prices.setActive(p.id, p.version, true);
      toast({ message: `Đã dùng lại ${p.name}.` });
    } catch (e) {
      toast({ tone: 'error', message: saveError(e) }); // a stale row gets the standard message; the table reloads itself
    }
  }
  /** From the edit dialog: switching off asks first, switching back on does not. */
  const onSwitch = (p: StaffPriceItem) => { setEditing(null); if (p.active) setSwitching(p); else void reactivate(p); };
  const columns: Column<StaffPriceItem>[] = canEdit
    ? [...baseColumns, { key: 'actions', header: 'Thao tác', align: 'end', cell: (p) => (
      <span className={pr.actions}>
        <Button size="sm" variant="secondary" icon="pencil" aria-label={`Sửa ${p.name}`} onClick={() => setEditing(p)}>Sửa</Button>
        {p.active
          ? <Button size="sm" variant="ghost" icon="eye-off" aria-label={`Ngừng dùng ${p.name}`} disabled={isDayItemCode(p.code)} onClick={() => setSwitching(p)}>Ngừng dùng</Button>
          : <Button size="sm" variant="ghost" icon="eye" aria-label={`Dùng lại ${p.name}`} onClick={() => void reactivate(p)}>Dùng lại</Button>}
        {isDayItemCode(p.code) && <span className={s.meta}>Mục tính tiền nội trú, không tắt được.</span>}
      </span>
    ) }
    ]
    : baseColumns;
  const clear = () => { setNeedle(''); setCategory('all'); setStatus('active'); };

  return (
    <>
      <PageHeader title="Bảng giá" sub="Đơn giá dùng khi lập hóa đơn. Giá trên hóa đơn cũ được giữ nguyên."
        actions={canEdit && <Button icon="plus" onClick={() => setEditing('new')}>Thêm dịch vụ</Button>} />
      <div className={s.stack}>
        <Banner tone="warm" icon="info">Giá trong bản demo là giá minh họa, chưa phải giá thật của bệnh viện.</Banner>
        <div className={s.toolbar}>
          <label className={s.search}>
            <Icon name="search" size={18} />
            <input type="search" value={needle} onChange={(e) => setNeedle(e.target.value)} placeholder="Mã hoặc tên dịch vụ" aria-label="Tìm trong bảng giá" />
          </label>
        </div>
        <ChipGroup<StatusFilter> label="Lọc theo trạng thái" value={status} onChange={setStatus} options={[
          { value: 'active', label: `Đang dùng (${counts.active})` }, { value: 'inactive', label: `Ngừng dùng (${counts.inactive})` }, { value: 'all', label: `Tất cả (${counts.all})` },
        ]} />
        <ChipGroup<PriceCategory | 'all'> label="Lọc theo nhóm dịch vụ" value={category} onChange={setCategory} options={[
          { value: 'all', label: `Tất cả (${Object.values(perCategory).reduce((a, b) => a + b, 0)})` },
          ...PRICE_CATEGORIES.filter((c) => perCategory[c]).map((c) => ({ value: c, label: `${PRICE_CATEGORY_LABEL[c]} (${perCategory[c]})` })),
        ]} />
        {rows.length === 0 ? (
          <EmptyState icon="tags" title="Không tìm thấy dịch vụ phù hợp." action={<Button variant="secondary" onClick={clear}>Xóa bộ lọc</Button>} />
        ) : (
          <DataTable pageSize={pageSize} key={[needle, category, status].join('|')} rows={rows} columns={columns} rowKey={(p) => p.id} caption="Bảng giá dịch vụ" noun="dịch vụ" />
        )}
      </div>
      {canEdit && <PriceDialog key={editing === null ? 'closed' : editing === 'new' ? 'new' : editing.id} open={editing !== null} onClose={() => setEditing(null)} item={editing === 'new' || editing === null ? undefined : editing} onSwitch={onSwitch} />}
      {canEdit && switching && <DeactivateDialog key={switching.id} open onClose={() => setSwitching(null)} item={switching} />}
    </>
  );
}
