import { useParams } from 'react-router';
import { paths } from '@/app/routes';
import { customer } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { NotLinkedError } from '@/data/contracts/errors';
import { InvoiceSheet } from '@/features/shared/InvoiceSheet';
import { ButtonLink, Icon } from '@/ui';
import { LockedPage } from '../locked/LockedPage';
import { LoadingBlocks, PageHeader, PageProblem, Section } from '../ui';
import s from '../Customer.module.css';

/** Invoice detail (customer §9.7): the paper sheet, the payments made (date + method only), and the print preview link. */
export function InvoicePage() {
  const { id = '' } = useParams();
  const q = useQuery(() => customer.invoices.get(id), [id]);
  if (q.error instanceof NotLinkedError) return <LockedPage kind="invoices" />;
  if (q.error) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks />;
  const d = q.data;
  return (
    <>
      <PageHeader eyebrow={<ButtonLink to={paths.kh.invoices} variant="ghost" size="sm" icon="arrow-left">Danh sách hóa đơn</ButtonLink>}
        title={<>Hóa đơn <strong>{d.code}</strong></>}
        actions={<ButtonLink to={paths.kh.invoicePrint(d.id)} variant="secondary" icon="printer">In hóa đơn</ButtonLink>} />
      <div className={s.stack}>
        <InvoiceSheet d={{ ...d, phone: d.phoneMasked }} />
        <Section title="Các lần thanh toán">
          {d.payments.length === 0 ? <p className={s.note}>Chưa có lần thanh toán nào. Bạn thanh toán tại quầy khi đến Lê Sơn nhé.</p> : (
            <ul className={s.miniList}>
              {d.payments.map((p, i) => <li key={i} className={s.payRow}><Icon name="circle-check" size={16} /> {p.dateLabel} · {p.methodLabel}</li>)}
            </ul>
          )}
        </Section>
      </div>
    </>
  );
}
