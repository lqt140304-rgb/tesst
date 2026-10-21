import { useState } from 'react';
import { AppLink, useAppNavigate } from '@/app/nav';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { staff, type InvoiceStateFilter, type StaffInvoiceRow } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { formatDateVi } from '@/lib/dates';
import { formatVnd } from '@/lib/money';
import { ButtonLink, ChipGroup, DataTable, EmptyState, Icon, StatusPill, statusPill, type Column } from '@/ui';
import { LoadingBlocks, PageHeader, PageProblem } from '../ui';
import s from '../Staff.module.css';
import iv from './Invoices.module.css';

type Filter = 'all' | InvoiceStateFilter;

export const invoicePill = (r: Pick<StaffInvoiceRow, 'status' | 'state'>) =>
  r.status === 'issued' && r.state ? statusPill('payment', r.state) : statusPill('invoice', r.status === 'voided' ? 'voided' : 'draft');

const COLUMNS: Column<StaffInvoiceRow>[] = [
  { key: 'code', header: 'Số HĐ', primary: true, cell: (r) => <AppLink to={paths.nv.invoice(r.id)} className={s.cellLink}>{r.code}</AppLink> },
  { key: 'date', header: 'Ngày', cell: (r) => <span className="num">{formatDateVi(r.issued_at ?? r.created_at)}</span> },
  { key: 'customer', header: 'Khách hàng', cell: (r) => r.customerName },
  { key: 'pets', header: 'Thú cưng', hideOnPhone: true, cell: (r) => r.petNames.join(', ') },
  { key: 'total', header: 'Tổng tiền', align: 'end', cell: (r) => <span className="num">{formatVnd(r.total)}</span> },
  { key: 'paid', header: 'Đã thu', align: 'end', hideOnPhone: true, cell: (r) => (r.status === 'issued' ? <span className="num">{formatVnd(r.paid)}</span> : '—') },
  { key: 'remaining', header: 'Còn lại', align: 'end', cell: (r) => (r.remaining > 0 ? <span className={`${s.owe} num`}>{formatVnd(r.remaining)}</span> : '—') },
  { key: 'state', header: 'Trạng thái', cell: (r) => <StatusPill pill={invoicePill(r)} dense /> },
];

/** Hóa đơn (staff §6.2): summary strip, state chips, search; no period/method filters in P0. */
export function InvoicesPage() {
  const { can } = useSession();
  const navigate = useAppNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const all = useQuery(() => staff.invoices.list({}), []);
  const list = useQuery(() => staff.invoices.list({ state: filter === 'all' ? undefined : filter, q: q.trim() || undefined }), [filter, q]);
  const rows = all.data ?? [];
  const open = rows.filter((r) => r.status === 'issued' && r.remaining > 0);

  return (
    <>
      <PageHeader title="Hóa đơn" sub="Hóa đơn phát hành không sửa được; khách đã liên kết xem được trong tài khoản."
        actions={can('invoices.create') && <ButtonLink to={paths.nv.invoiceNew} icon="plus">Tạo hóa đơn</ButtonLink>} />
      <div className={iv.summary}>
        <span data-summary="outstanding"><Icon name="clock" size={16} />Chưa thu: <strong>{open.length} hóa đơn · {formatVnd(open.reduce((n, r) => n + r.remaining, 0))}</strong></span>
        <span><Icon name="circle-half" size={16} />Thanh toán một phần: <strong>{rows.filter((r) => r.state === 'partial').length}</strong></span>
        <span><Icon name="file-pen" size={16} />Nháp: <strong>{rows.filter((r) => r.status === 'draft').length}</strong></span>
      </div>
      <div className={s.toolbar}>
        <label className={s.search}>
          <Icon name="search" size={18} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Số HĐ, tên khách, tên thú cưng" aria-label="Tìm hóa đơn" />
        </label>
        <ChipGroup<Filter> label="Lọc theo trạng thái" value={filter} onChange={setFilter} options={[
          { value: 'all', label: 'Tất cả' }, { value: 'draft', label: 'Nháp' }, { value: 'unpaid', label: 'Chưa thanh toán' },
          { value: 'partial', label: 'Đã thanh toán một phần' }, { value: 'paid', label: 'Đã thanh toán' },
        ]} />
      </div>
      {list.error ? <PageProblem error={list.error} onRetry={list.refetch} /> : !list.data ? <LoadingBlocks /> : list.data.length === 0 ? (
        <EmptyState icon="receipt" title={q ? 'Không tìm thấy hóa đơn phù hợp.' : 'Chưa có hóa đơn ở mục này.'} />
      ) : (
        <DataTable rows={list.data} columns={COLUMNS} rowKey={(r) => r.id} caption="Danh sách hóa đơn" noun="hóa đơn" onOpen={(r) => navigate(paths.nv.invoice(r.id))} />
      )}
    </>
  );
}
