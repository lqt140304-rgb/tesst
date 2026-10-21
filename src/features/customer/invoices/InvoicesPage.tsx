import { useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { AppLink, useAppNavigate } from '@/app/nav';
import { paths } from '@/app/routes';
import { customer, type CustomerInvoiceRow } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { NotFoundError, NotLinkedError } from '@/data/contracts/errors';
import { dayOf, formatDateVi } from '@/lib/dates';
import { cx } from '@/lib/cx';
import { useMedia } from '@/lib/useMedia';
import { ChipGroup, EmptyState, Icon, MasterDetail, Money, StatusPill, statusPill, useListState } from '@/ui';
import { LockedPage } from '../locked/LockedPage';
import { LoadingBlocks, PageHeader, PageProblem } from '../ui';
import { InvoiceDetail } from './InvoiceDetail';
import o from './Invoices.module.css';

type Filter = 'all' | 'due' | 'paid';

/** Hóa đơn (spec 2026-10-21 §3.7): filter chips, rows by month, the invoice beside the list (a full page on phones). Payment is at the counter. */
export function InvoicesPage() {
  const q = useQuery(() => customer.invoices.list(), []);
  const { id: paramId } = useParams();
  const [list, setList] = useListState('kh-invoices', { filter: 'all', id: '' });
  const wide = useMedia('(min-width: 1024px)');
  const nav = useAppNavigate();
  const fromList = (useLocation().state as { fromList?: boolean } | null)?.fromList === true;
  // A link to one invoice shows every invoice, so the remembered filter cannot hide the one asked for.
  const [filter, setFilterState] = useState<Filter>(!paramId && (list.filter === 'due' || list.filter === 'paid') ? list.filter : 'all');
  const [sel, setSel] = useState<string>(paramId ?? list.id);
  if (q.error instanceof NotLinkedError) return <LockedPage kind="invoices" />;
  const head = <PageHeader title="Hóa đơn của bạn" sub="Xem hóa đơn và tình trạng thanh toán của các bé."
    crumbs={[{ label: 'Trang chủ', to: paths.kh.home }, { label: 'Hóa đơn' }]} />;
  if (q.error) return <>{head}<PageProblem error={q.error} onRetry={q.refetch} /></>;
  if (!q.data) return <>{head}<LoadingBlocks /></>;
  const rows = q.data;
  if (paramId && !rows.some((r) => r.id === paramId)) return <PageProblem error={new NotFoundError()} onRetry={q.refetch} />;
  if (rows.length === 0) return <>{head}<EmptyState icon="receipt" title="Bạn chưa có hóa đơn nào." body="Hóa đơn sẽ hiện ở đây sau mỗi lần bé sử dụng dịch vụ tại Lê Sơn." /></>;

  const due = rows.filter((r) => r.remaining > 0);
  const shown = rows.filter((r) => (filter === 'all' ? true : filter === 'due' ? r.remaining > 0 : r.remaining === 0));
  // Side by side the choice is page state; on a phone the open invoice is the address, so the system Back returns to the list.
  const chosen = wide ? shown.find((r) => r.id === sel) ?? shown[0] : shown.find((r) => r.id === paramId);
  const pick = (id: string) => {
    if (wide) { setSel(id); setList({ id }); } else nav(paths.kh.invoice(id), { state: { fromList: true } });
  };
  const back = () => {
    if (wide) pick('');
    else if (fromList) nav(-1);
    else nav(paths.kh.invoices, { replace: true });
  };
  const setFilter = (f: Filter) => { setFilterState(f); setSel(''); setList({ filter: f, id: '' }); };

  return (
    <>
      {head}
      {due.length > 0 && (
        <p className={o.owed} role="note">
          <Icon name="receipt" size={20} />
          <span>Bạn có <strong>{due.length} hóa đơn chưa thanh toán</strong> (<Money value={due.reduce((n, r) => n + r.remaining, 0)} />).</span>
        </p>
      )}
      <p className={o.note}><Icon name="info" size={18} /><span><strong>Thanh toán tại quầy.</strong> Bạn thanh toán khi đến Lê Sơn. Cảm ơn bạn!</span></p>
      {(wide || !chosen) && <ChipGroup<Filter> label="Lọc hóa đơn" value={filter} onChange={setFilter}
        options={[{ value: 'all', label: 'Tất cả' }, { value: 'due', label: 'Chưa thanh toán' }, { value: 'paid', label: 'Đã thanh toán' }]} />}
      <div style={{ marginTop: 14 }}>
        <MasterDetail label="Chi tiết hóa đơn" backLabel="Danh sách hóa đơn" detailKey={chosen?.id} onBack={back}
          list={shown.length === 0 ? <p>Không có hóa đơn nào trong mục này.</p> : (
            <>
              {byMonth(shown).map(([month, group]) => (
                <section key={month} className={o.group} aria-label={month}>
                  <h2 className={o.month}>{month}</h2>
                  <ul className={o.list}>
                    {group.map((r) => {
                      const on = chosen?.id === r.id;
                      return (
                        <li key={r.id}>
                          <AppLink to={paths.kh.invoice(r.id)} data-invoice-row aria-current={on ? 'true' : undefined} className={cx(o.item, on && o.sel)}
                            onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); pick(r.id); }}>
                            <span className={o.icon} aria-hidden="true"><Icon name="receipt" size={20} /></span>
                            <span>
                              <span className={o.code}>{r.code} · {formatDateVi(r.issuedAt)}</span>
                              <span className={o.sub}>{r.petNames.length ? `Bé ${r.petNames.join(', ')} · ` : ''}{r.summary}</span>
                            </span>
                            <span className={o.side}>
                              <span className={o.money}><Money value={r.total} /></span>
                              <StatusPill pill={statusPill('payment', r.state)} dense />
                            </span>
                          </AppLink>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </>
          )}
          detail={chosen ? <InvoiceDetail id={chosen.id} /> : null} />
      </div>
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
