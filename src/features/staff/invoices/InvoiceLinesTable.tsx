import { AnimatePresence, m } from 'motion/react';
import { formatVnd } from '@/lib/money';
import { formatQty } from '@/lib/units';
import { Icon, Input } from '@/ui';
import type { Line } from './draft-lines';
import s from '../Staff.module.css';
import iv from './Invoices.module.css';

/** The draft's lines: name, price (typed for open-price items), quantity stepper, line total, remove. Prices come only from the price list. */
export function InvoiceLinesTable({ lines, onChange }: { lines: Line[]; onChange: (fn: (ls: Line[]) => Line[]) => void }) {
  if (lines.length === 0) return <p className={s.empty}>Chưa có dòng nào. Bấm "Thêm dịch vụ" để chọn từ bảng giá.</p>;
  return (
    <div>
      <div className={iv.linesHead} aria-hidden="true"><span>Tên dịch vụ</span><span>Đơn giá</span><span>SL</span><span>Thành tiền</span><span /></div>
      <ul className={iv.lines}>
        <AnimatePresence initial={false}>
          {lines.map((l) => {
            const unit = l.item.price_mode === 'open' ? l.unit_price ?? 0 : l.unit_price ?? l.item.price;
            return (
              <m.li key={l.key} className={iv.line} data-line layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 12 }}>
                <span className={iv.lineName}>{l.item.name}<span className={s.meta}> · {l.item.unit}</span></span>
                {l.item.price_mode === 'open'
                  ? <Input aria-label={`Đơn giá ${l.item.name}`} inputMode="numeric" className={iv.price} value={l.unit_price ?? ''} placeholder="Giá linh hoạt"
                      onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, '')); onChange((ls) => ls.map((x) => (x === l ? { ...x, unit_price: e.target.value ? n : undefined } : x))); }} />
                  : <span className="num">{formatVnd(unit)}</span>}
                <span className={iv.stepper}>
                  <button type="button" aria-label={`Giảm số lượng ${l.item.name}`} onClick={() => onChange((ls) => ls.map((x) => (x === l ? { ...x, qty: Math.max(1, x.qty - 1) } : x)))}>−</button>
                  <span aria-live="polite">{formatQty(l.qty)}</span>
                  <button type="button" aria-label={`Tăng số lượng ${l.item.name}`} onClick={() => onChange((ls) => ls.map((x) => (x === l ? { ...x, qty: x.qty + 1 } : x)))}>+</button>
                </span>
                <span className={iv.lineTotal}>{formatVnd(unit * l.qty)}</span>
                <button type="button" className={iv.remove} aria-label={`Bỏ ${l.item.name}`} onClick={() => onChange((ls) => ls.filter((x) => x !== l))}><Icon name="x" size={16} /></button>
              </m.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
