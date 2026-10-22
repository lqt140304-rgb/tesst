import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { system } from '@/data/public';
import { staff, type StaffInvoiceRow } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { daysBetween } from '@/lib/dates';
import { formatVnd } from '@/lib/money';
import { DataTable, EmptyState, type Column } from '@/ui';
import { Panel } from '../ui';
import s from '../Staff.module.css';

/** Invoices that still owe money (not tied to the chosen period), oldest first. */
export function OpenInvoices() {
  const { can } = useSession();
  const q = useQuery(async () => [...await staff.invoices.list({ state: 'unpaid' }), ...await staff.invoices.list({ state: 'partial' })]
    .sort((a, b) => (a.issued_at ?? '').localeCompare(b.issued_at ?? '')), []);
  const age = (i: StaffInvoiceRow) => (i.issued_at ? daysBetween(i.issued_at, system.now()) : 0);
  const columns: Column<StaffInvoiceRow>[] = [
    { key: 'code', header: 'Hóa đơn', primary: true, cell: (i) => <span className="num">{i.code}</span> },
    { key: 'customer', header: 'Khách hàng', cell: (i) => i.customerName },
    { key: 'age', header: 'Đã qua', cell: (i) => <span className="num">{age(i) > 10 ? `Quá ${age(i)} ngày` : `${age(i)} ngày`}</span> },
    { key: 'owe', header: 'Còn nợ', align: 'end', cell: (i) => <span className={`${s.owe} num`}>{formatVnd(i.remaining)}</span> },
    ...(can(['invoices.create', 'payments.record']) ? [{ key: 'open', header: 'Mở', align: 'end' as const, cell: (i: StaffInvoiceRow) => <AppLink to={paths.nv.invoice(i.id)} className={s.linkBtn} aria-label={`Mở hóa đơn ${i.code}`}>Mở</AppLink> }] : []),
  ];
  return (
    <Panel title="Hóa đơn còn nợ" icon="clock">
      {!q.data ? null : q.data.length === 0 ? <EmptyState icon="receipt" title="Không có hóa đơn còn nợ." />
        : <DataTable rows={q.data} columns={columns} rowKey={(i) => i.id} caption="Hóa đơn còn nợ" noun="hóa đơn" />}
    </Panel>
  );
}
