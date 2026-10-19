import { useState } from 'react';
import { m } from 'motion/react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { customer, type CustomerInvoiceRow } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { NotLinkedError } from '@/data/contracts/errors';
import { dayOf, formatDateVi } from '@/lib/dates';
import { ChipGroup, EmptyState, Icon, Money, StatusPill, statusPill } from '@/ui';
import { riseIn } from '@/ui/motion';
import { LockedPage } from '../locked/LockedPage';
import { LoadingBlocks, PageHeader, PageProblem } from '../ui';
import s from '../Customer.module.css';

type Filter = 'all' | 'due' | 'paid';

/** Hóa đơn (customer §9.7, R9): peach summary when something is owed, filter chips, rows grouped by month. */
export function InvoicesPage() {
  const q = useQuery(() => customer.invoices.list(), []);
  const [filter, setFilter] = useState<Filter>('all');
  if (q.error instanceof NotLinkedError) return <LockedPage kind="invoices" />;
  const rows = q.data ?? [];
  const due = rows.filter((r) => r.remaining > 0);
  const shown = rows.filter((r) => (filter === 'all' ? true : filter === 'due' ? r.remaining > 0 : r.remaining === 0));
  return (
    <>
      <PageHeader title="Hóa đơn" />
      {q.error ? <PageProblem error={q.error} onRetry={q.refetch} /> : !q.data ? <LoadingBlocks /> : rows.length === 0 ? (
        <EmptyState icon="receipt" title="Bạn chưa có hóa đơn nào." body="Hóa đơn sẽ hiện ở đây sau mỗi lần bé sử dụng dịch vụ tại Lê Sơn." />
      ) : (
        <div className={s.stack}>
          {due.length > 0 && (
            <p className={s.owed} role="note">
              <Icon name="receipt" size={20} />
              <span>Bạn có <strong>{due.length} hóa đơn chưa thanh toán</strong> (<Money value={due.reduce((n, r) => n + r.remaining, 0)} />). Bạn thanh toán tại quầy khi đến Lê Sơn nhé.</span>
            </p>
          )}
          <ChipGroup<Filter> label="Lọc hóa đơn" value={filter} onChange={setFilter}
            options={[{ value: 'all', label: 'Tất cả' }, { value: 'due', label: 'Chưa thanh toán' }, { value: 'paid', label: 'Đã thanh toán' }]} />
          {byMonth(shown).map(([month, list]) => (
            <section key={month} className={s.monthGroup}>
              <h2 className={s.h2}>{month}</h2>
              <ul className={s.invoiceList}>
                {list.map((r, i) => (
                  <m.li key={r.id} {...riseIn(8, i * 0.03)}>
                    <AppLink to={paths.kh.invoice(r.id)} className={s.invoiceRow} data-invoice-row>
                      <span className={s.invoiceMain}>
                        <span className={s.invoiceCode}>{r.code} · {formatDateVi(r.issuedAt)}</span>
                        <span className={s.note}>{r.petNames.length ? `Bé ${r.petNames.join(', ')} · ` : ''}{r.summary}</span>
                      </span>
                      <span className={s.invoiceSide}>
                        <strong className={s.invoiceAmount}><Money value={r.total} /></strong>
                        <StatusPill pill={statusPill('payment', r.state)} dense />
                      </span>
                    </AppLink>
                  </m.li>
                ))}
              </ul>
            </section>
          ))}
          {shown.length === 0 && <p className={s.note}>Không có hóa đơn nào trong mục này.</p>}
        </div>
      )}
    </>
  );
}

function byMonth(rows: CustomerInvoiceRow[]): [string, CustomerInvoiceRow[]][] {
  const out: [string, CustomerInvoiceRow[]][] = [];
  for (const r of rows) {
    const d = dayOf(r.issuedAt);
    const label = `Tháng ${Number(d.slice(5, 7))}/${d.slice(0, 4)}`;
    const last = out[out.length - 1];
    if (last && last[0] === label) last[1].push(r); else out.push([label, [r]]);
  }
  return out;
}
