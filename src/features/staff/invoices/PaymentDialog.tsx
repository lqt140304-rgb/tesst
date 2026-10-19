import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { staff, type StaffInvoiceDetail } from '@/data/staff';
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from '@/data/contracts/enums';
import { cashChange } from '@/data/rules/invoice-math';
import { formatVnd } from '@/lib/money';
import { Button, ChipGroup, Dialog, Field, Icon, Input, useToast } from '@/ui';
import { FormError, saveError } from '../ui';
import s from '../Staff.module.css';
import iv from './Invoices.module.css';

const digits = (x: string) => Number(x.replace(/\D/g, '') || 0);

/** "Ghi nhận thanh toán" (staff §6.5): cash with a change helper, transfer, or an illustrative QR (no real bank details). */
export function PaymentDialog({ d, open, onClose }: { d: StaffInvoiceDetail; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [amount, setAmount] = useState(String(d.remaining));
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [given, setGiven] = useState('');
  const [note, setNote] = useState('');
  const [qr, setQr] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const value = digits(amount);
  const givenValue = given ? digits(given) : undefined;
  const over = value > d.remaining;

  async function confirm() {
    const e: Record<string, string> = {};
    if (!(value > 0)) e.amount = 'Bạn nhập số tiền nhé.';
    else if (over) e.amount = `Số tiền không được lớn hơn số còn lại (${formatVnd(d.remaining)}).`;
    if (method === 'cash' && givenValue !== undefined && givenValue < value) e.given = 'Tiền khách đưa chưa đủ.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await staff.invoices.payments.record(d.id, { amount: value, method, cash_given: method === 'cash' ? givenValue : undefined, note: note || undefined });
      toast({ message: `Đã ghi nhận ${formatVnd(value)} bằng ${PAYMENT_METHOD_LABEL[method].charAt(0).toLowerCase()}${PAYMENT_METHOD_LABEL[method].slice(1)}.` });
      setQr(false);
      onClose();
    } catch (x) {
      setErrors({ form: saveError(x) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} title="Ghi nhận thanh toán" intro={<>Hóa đơn {d.code} · còn lại <strong>{formatVnd(d.remaining)}</strong></>}
        footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="check" loading={busy} onClick={() => void confirm()}>Xác nhận đã nhận tiền</Button></>}>
        <div className={s.form}>
          <FormError>{errors.form}</FormError>
          <Field label="Số tiền" error={errors.amount ?? (over ? `Số tiền không được lớn hơn số còn lại (${formatVnd(d.remaining)}).` : undefined)} hint="Nhập ít hơn số còn lại nếu khách trả một phần.">
            <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} />
          </Field>
          <ChipGroup<PaymentMethod> label="Phương thức" value={method} onChange={setMethod}
            options={(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((k) => ({ value: k, label: PAYMENT_METHOD_LABEL[k] }))} />
          {method === 'cash' && (
            <div className={s.two}>
              <Field label="Khách đưa" error={errors.given} optional>
                <Input inputMode="numeric" value={given} onChange={(e) => setGiven(e.target.value.replace(/[^\d.]/g, ''))} />
              </Field>
              <div className={iv.change}>
                <span>Tiền thừa trả khách</span>
                <strong data-change aria-live="polite">{formatVnd(givenValue !== undefined ? cashChange(value, givenValue) : 0)}</strong>
              </div>
            </div>
          )}
          {method === 'transfer' && (
            <Field label="Ghi chú / mã giao dịch" optional><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          )}
          {method === 'qr' && (
            <div className={s.hint}>
              <Icon name="qr-code" size={16} />
              <span>Quay màn hình về phía khách để khách quét. Kiểm tra ứng dụng ngân hàng rồi bấm “Xác nhận đã nhận tiền”.
                <br /><Button size="sm" variant="secondary" icon="maximize" onClick={() => setQr(true)} style={{ marginTop: 8 }}>Hiện mã QR cho khách</Button>
              </span>
            </div>
          )}
        </div>
      </Dialog>
      <QrPanel open={open && qr} amount={value} code={d.code} onClose={() => setQr(false)} />
    </>
  );
}

/** Full-screen panel turned toward the customer. Illustration only: no bank details, watermarked "MẪU". */
function QrPanel({ open, amount, code, onClose }: { open: boolean; amount: number; code: string; onClose: () => void }) {
  const reduce = useReducedMotion();
  const close = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => close.current?.focus(), 40);
    // Window capture runs before the payment dialog's document listener, so Esc closes only this panel.
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); closeRef.current(); } };
    window.addEventListener('keydown', onKey, true);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey, true); };
  }, [open]);
  const transferNote = `LESON ${code.replace(/-/g, '')}`;
  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div className={iv.qrPanel} role="dialog" aria-modal="true" aria-label="Mã QR minh họa" data-qr-panel
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <m.div className={iv.qrCard} initial={reduce ? false : { scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}>
            <p className={iv.qrHospital}>Bệnh viện Thú y Lê Sơn</p>
            <div className={iv.qrBox}>
              <FakeQr seed={code} />
              <span className={iv.qrMark} aria-hidden="false">MẪU — KHÔNG CHUYỂN TIỀN</span>
            </div>
            <p className={iv.qrLabel}>Mã QR minh họa – không dùng để chuyển tiền</p>
            <p className={iv.qrAmount}>{formatVnd(amount)}</p>
            <p className={s.meta}>Nội dung chuyển khoản: <strong className={s.code}>{transferNote}</strong></p>
            <Button ref={close} variant="secondary" icon="x" onClick={onClose}>Đóng</Button>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** A QR-looking grid from a fixed seed (three finder squares + pseudo-random modules). It encodes nothing. */
function FakeQr({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    let h = 2166136261;
    for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const out: [number, number][] = [];
    const N = 25;
    const finder = (x: number, y: number) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      h = Math.imul(h ^ (x * 31 + y), 2654435761) >>> 0;
      if (!finder(x, y) && h % 100 < 46) out.push([x, y]);
    }
    return out;
  }, [seed]);
  const F = (x: number, y: number) => (
    <g key={`${x}-${y}`}><rect x={x} y={y} width={7} height={7} fill="currentColor" /><rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" /><rect x={x + 2} y={y + 2} width={3} height={3} fill="currentColor" /></g>
  );
  return (
    <svg viewBox="-1 -1 27 27" className={iv.qrSvg} role="img" aria-label="Hình mã QR minh họa">
      <rect x={-1} y={-1} width={27} height={27} fill="#fff" />
      {cells.map(([x, y]) => <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />)}
      {F(0, 0)}{F(18, 0)}{F(0, 18)}
    </svg>
  );
}
