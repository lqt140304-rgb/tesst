import { logoUrl } from '@/assets/media';
import type { PaymentState } from '@/data/contracts/enums';
import { formatDateVi } from '@/lib/dates';
import { formatVnd } from '@/lib/money';
import { cx } from '@/lib/cx';
import s from './InvoiceSheet.module.css';

export type InvoiceSheetData = {
  code: string; issuedAt: string; customerName: string; phone: string; petNames: string[];
  lines: { label: string; qty: number | null; unitPrice: number | null; total: number; note?: string }[];
  subtotal: number; discount?: { label: string; amount: number }; total: number; paid: number; remaining: number; state: PaymentState;
  payments: { dateLabel: string; methodLabel: string }[]; note?: string;
};

/** The invoice line customers read (R9): paid / partial (what remains) / unpaid; counter payment only, never a QR. */
export function paymentSentence(d: Pick<InvoiceSheetData, 'state' | 'paid' | 'remaining' | 'payments'>): { title: string; text: string } {
  if (d.state === 'paid') {
    const last = d.payments[d.payments.length - 1];
    return { title: 'Đã thanh toán', text: last ? `${last.dateLabel} · ${last.methodLabel}` : '' };
  }
  if (d.state === 'partial') {
    return { title: 'Đã thanh toán một phần', text: `Đã thanh toán ${formatVnd(d.paid)} · còn lại ${formatVnd(d.remaining)}. Bạn thanh toán phần còn lại tại quầy nhé.` };
  }
  return { title: 'Chưa thanh toán', text: 'Bạn thanh toán tại quầy khi đến Lê Sơn.' };
}

/**
 * A5 paper invoice shared by the customer detail, the customer print preview and staff printing (R21).
 * Treatment items arrive already grouped as "Thuốc và vật tư điều trị" (R7); this component only lays them out.
 */
export function InvoiceSheet({ d, watermark = true, a5, className, issuedBy, footnote }: {
  d: InvoiceSheetData; watermark?: boolean; a5?: boolean; className?: string;
  /** Staff print only: "Người lập" and the internal-document footnote (staff §6.6). */
  issuedBy?: string; footnote?: string;
}) {
  const pay = paymentSentence(d);
  return (
    <article className={cx(s.sheet, className)} data-sheet={a5 ? 'a5' : 'paper'}>
      {watermark && <span className={s.watermark} aria-hidden="true">Dữ liệu mẫu</span>}
      <header className={s.head}>
        <div className={s.brand}>
          <img src={logoUrl} alt="" width={56} height={50} />
          <div>
            <p className={s.brandName}>Bệnh Viện Thú Y Lê Sơn</p>
            <p className={s.small}>101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội</p>
            <p className={s.small}>097 355 51 05</p>
          </div>
        </div>
        <div className={s.docMeta}>
          <p className={s.docTitle}>HÓA ĐƠN</p>
          <p>Số: {d.code}</p>
          <p>Ngày lập: {formatDateVi(d.issuedAt)}</p>
        </div>
      </header>
      <p className={s.party}>
        <span>Khách hàng: <strong>{d.customerName}</strong> · {d.phone}</span>
        {d.petNames.length > 0 && <span>Bé: <strong>{d.petNames.join(', ')}</strong></span>}
      </p>
      <table className={s.table}>
        <thead>
          <tr><th scope="col">Nội dung</th><th scope="col" className={s.num}>SL</th><th scope="col" className={s.num}>Đơn giá</th><th scope="col" className={s.num}>Thành tiền</th></tr>
        </thead>
        <tbody>
          {d.lines.map((l) => (
            <tr key={l.label}>
              <td>{l.label}{l.note && <span className={s.lineNote}>{l.note}</span>}</td>
              <td className={s.num}>{l.qty ?? '—'}</td>
              <td className={s.num}>{l.unitPrice === null ? '—' : formatVnd(l.unitPrice)}</td>
              <td className={s.num}>{formatVnd(l.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className={s.totals}>
        <div><dt>Tạm tính</dt><dd>{formatVnd(d.subtotal)}</dd></div>
        {d.discount && <div><dt>{d.discount.label}</dt><dd>− {formatVnd(d.discount.amount)}</dd></div>}
        <div className={s.grand}><dt>Tổng cộng</dt><dd>{formatVnd(d.total)}</dd></div>
      </dl>
      <p className={cx(s.status, s[d.state])}><strong>{pay.title}</strong>{pay.text && <> · {pay.text}</>}</p>
      {d.note && <p className={s.small}>{d.note}</p>}
      {issuedBy && <p className={s.small}>Người lập: {issuedBy}</p>}
      <p className={s.thanks}>Cảm ơn bạn đã tin tưởng gửi gắm bé cho Lê Sơn.</p>
      {footnote && <p className={s.footnote}>{footnote}</p>}
    </article>
  );
}
