import { useState } from 'react';
import { useParams } from 'react-router';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { staff, type StaffInvoiceDetail } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { PAYMENT_METHOD_LABEL } from '@/data/contracts/enums';
import { formatVnd } from '@/lib/money';
import { InvoiceSheet } from '@/features/shared/InvoiceSheet';
import { Button, ButtonLink, Icon, StatusPill, type IconName } from '@/ui';
import { cx } from '@/lib/cx';
import { LoadingBlocks, PageHeader, PageProblem, Panel, Tel, whenShort } from '../ui';
import { invoicePill } from './InvoicesPage';
import { DraftEditor } from './DraftEditor';
import { PaymentDialog } from './PaymentDialog';
import { toSheet } from './sheet';
import s from '../Staff.module.css';
import iv from './Invoices.module.css';

const METHOD_ICON: Record<keyof typeof PAYMENT_METHOD_LABEL, IconName> = { cash: 'banknote', transfer: 'landmark', qr: 'qr-code' };

/** Invoice detail (staff §6.4); a draft opens in the editor (§6.3). */
export function InvoicePage() {
  const { id = '' } = useParams();
  const q = useQuery(() => staff.invoices.get(id), [id]);
  if (q.error) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks rows={3} />;
  return q.data.status === 'draft' ? <DraftEditor key={q.data.id} d={q.data} /> : <Detail d={q.data} />;
}

function Detail({ d }: { d: StaffInvoiceDetail }) {
  const { can } = useSession();
  const [paying, setPaying] = useState(false);
  const [asCustomer, setAsCustomer] = useState(false);
  return (
    <>
      <PageHeader title={`Hóa đơn ${d.code}`}
        eyebrow={<ButtonLink to={paths.nv.invoices} variant="ghost" size="sm" icon="arrow-left">Hóa đơn</ButtonLink>}
        sub={<span className={s.recordHead}><StatusPill pill={invoicePill(d)} />{can('customers.view') ? <AppLink to={paths.nv.customer(d.customerId)} className={s.cellLink}>{d.customerName}</AppLink> : d.customerName}<Tel e164={d.customerPhone} /><span>{d.petNames.join(', ')}</span></span>}
        actions={<>
          {can('payments.record') && d.status === 'issued' && d.remaining > 0 && <Button icon="banknote" onClick={() => setPaying(true)}>Ghi nhận thanh toán</Button>}
          <ButtonLink to={paths.nv.invoicePrint(d.id)} variant="secondary" icon="printer">In hóa đơn</ButtonLink>
        </>} />
      <div className={iv.detailCols}>
        <div className={s.stack}>
          <Panel title="Dịch vụ & hàng hóa" icon="receipt">
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead><tr><th>Tên</th><th>Thú cưng</th><th>Đơn vị</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th></tr></thead>
                <tbody>
                  {d.lines.map((l) => (
                    <tr key={l.id} data-line>
                      <td>{l.name}{l.customer_group === 'treatment' && <span className={s.meta}> · khách thấy là “Thuốc và vật tư điều trị”</span>}</td>
                      <td>{l.petName ?? '—'}</td><td>{l.unit}</td>
                      <td className={s.num}>{formatVnd(l.unit_price)}</td><td className={s.num}>{l.qty}</td><td className={s.num}>{formatVnd(l.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className={iv.totals}>
              <div><dt>Tạm tính</dt><dd>{formatVnd(d.subtotal)}</dd></div>
              {d.discount && <div><dt>Giảm giá ({d.discount.reason})</dt><dd>− {formatVnd(d.discount.amount)}</dd></div>}
              <div className={iv.grand}><dt>Tổng cộng</dt><dd data-total>{formatVnd(d.total)}</dd></div>
              <div><dt>Đã thu</dt><dd>{formatVnd(d.paid)}</dd></div>
              <div className={cx(d.remaining > 0 && iv.remaining)}><dt>Còn lại</dt><dd>{formatVnd(d.remaining)}</dd></div>
            </dl>
            {d.note_customer && <p className={s.small}>Ghi chú trên hóa đơn: {d.note_customer}</p>}
            <p className={s.meta}>{d.createdByName && `Người lập: ${d.createdByName}`}{d.issuedByName && ` · Phát hành bởi ${d.issuedByName}`}{d.issued_at && ` · ${whenShort(d.issued_at)}`}</p>
          </Panel>
          <Panel title="Các lần thanh toán" icon="banknote">
            {d.payments.length === 0 ? <p className={s.empty}>Chưa có lần thanh toán nào.</p> : (
              <ul className={s.rows}>
                {d.payments.map((p) => (
                  <li key={p.id} className={cx(s.row, p.reversed_at && s.rowPast)}>
                    <span className={iv.method}><Icon name={METHOD_ICON[p.method]} size={18} /></span>
                    <div className={s.rowMain}>
                      <span className={s.rowTitle}>{formatVnd(p.amount)} · {PAYMENT_METHOD_LABEL[p.method]}</span>
                      <span className={s.meta}>{p.code} · {whenShort(p.received_at)}{p.receivedByName ? ` · ${p.receivedByName}` : ''}{p.cash_given ? ` · khách đưa ${formatVnd(p.cash_given)}, thối ${formatVnd(p.change ?? 0)}` : ''}{p.reversed_at ? ' · đã hủy phiếu' : ''}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <aside className={s.stack}>
          <Panel title="Khách sẽ thấy" icon="eye" action={<Button size="sm" variant="ghost" onClick={() => setAsCustomer((x) => !x)}>{asCustomer ? 'Ẩn' : 'Xem như khách'}</Button>}>
            {asCustomer ? <InvoiceSheet d={toSheet(d)} /> : <p className={s.small}>Thuốc, vật tư và thủ thuật điều trị được gộp thành một dòng “Thuốc và vật tư điều trị” khi khách xem.</p>}
          </Panel>
        </aside>
      </div>
      {can('payments.record') && <PaymentDialog key={String(paying)} d={d} open={paying} onClose={() => setPaying(false)} />}
    </>
  );
}
