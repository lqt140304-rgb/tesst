import { paths } from '@/app/routes';
import { customer } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { NotLinkedError } from '@/data/contracts/errors';
import { formatDateVi } from '@/lib/dates';
import { InvoiceSheet } from '@/features/shared/InvoiceSheet';
import { ButtonLink, Icon, Money, StatusPill, statusPill } from '@/ui';
import { LoadingBlocks, PageProblem } from '../ui';
import o from './Invoices.module.css';

/** One invoice: code and total on top (they never move), the download button, the paper sheet and the payments made (date + method only). */
export function InvoiceDetail({ id }: { id: string }) {
  const q = useQuery(() => customer.invoices.get(id), [id]);
  if (q.error instanceof NotLinkedError) return null;
  if (q.error) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks rows={2} />;
  const d = q.data;
  return (
    <div className={o.detail}>
      <h2 tabIndex={-1} className={o.dTitle}>Hóa đơn <span className="num">{d.code}</span></h2>
      <div className={o.summary} data-invoice-total>
        <span>
          <span className={o.big}><Money value={d.total} /></span>
          <span className={o.sumSub}>{formatDateVi(d.issuedAt)}{d.remaining > 0 ? <> · còn lại <Money value={d.remaining} /></> : null}</span>
        </span>
        <StatusPill pill={statusPill('payment', d.state)} />
        <ButtonLink to={paths.kh.invoicePrint(d.id)} variant="secondary" icon="printer">Tải hóa đơn</ButtonLink>
      </div>
      <div className={o.sheet}><InvoiceSheet d={{ ...d, phone: d.phoneMasked }} /></div>
      <h3 className={o.h3}>Các lần thanh toán</h3>
      {d.payments.length === 0
        ? <p>Chưa có lần thanh toán nào. Bạn thanh toán tại quầy khi đến Lê Sơn nhé.</p>
        : <ul className={o.pay}>{d.payments.map((p, i) => <li key={i}><Icon name="circle-check" size={16} /> {p.dateLabel} · {p.methodLabel}</li>)}</ul>}
    </div>
  );
}
