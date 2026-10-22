import { useState } from 'react';
import { staff, type StockRow } from '@/data/staff';
import { Button, Dialog, Field, Icon, Input } from '@/ui';
import { cx } from '@/lib/cx';
import { FormError } from '../ui';
import { adjustErrors, parseQty, toAdjustInput, type AdjustFormValues } from './stockForm';
import { adjustDiff, qtyText } from './stockView';
import { useStockSave } from './useStockSave';
import s from '../Staff.module.css';
import st from './Stock.module.css';

/** Stock-take: the person types what they counted; the item becomes that number and the difference is written to the history. */
export function StockAdjustDialog({ open, onClose, item }: { open: boolean; onClose: () => void; item: StockRow }) {
  const [v, setV] = useState<AdjustFormValues>({ counted: '', note: '' });
  const [version] = useState(item.version);
  const { errors, busy, save } = useStockSave(onClose);
  const counted = parseQty(v.counted);
  const diff = adjustDiff(item.qty, counted, item.unit);

  const submit = () => save(adjustErrors(v, item), async () => {
    await staff.stock.adjust(item.id, version, toAdjustInput(v));
    return `Đã kiểm kê ${item.name}: tồn nay là ${qtyText(counted ?? 0, item.unit)}.`;
  });

  return (
    <Dialog open={open} onClose={onClose} wide title="Kiểm kê"
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="check" loading={busy} onClick={() => void submit()}>Lưu kiểm kê</Button></>}>
      <div className={s.form}>
        <FormError>{errors.form ?? errors.item}</FormError>
        <p className={s.meta}>{item.name}</p>
        <p className={st.sentence}>Tồn trên sổ: <strong>{qtyText(item.qty, item.unit)}</strong></p>
        <Field label="Số đếm được" error={errors.counted_qty}>
          <Input inputMode="numeric" value={v.counted} onChange={(e) => setV((x) => ({ ...x, counted: e.target.value }))} />
        </Field>
        <p className={cx(st.diff, diff && st[`diff_${diff.tone}`])} aria-live="polite">{diff?.text}</p>
        <Field label="Ghi chú" optional error={errors.note}><Input value={v.note} onChange={(e) => setV((x) => ({ ...x, note: e.target.value }))} autoComplete="off" /></Field>
        <p className={s.hint}><Icon name="info" size={16} /><span>Lưu xong, số tồn sẽ thành số bạn đếm và một dòng Kiểm kê được ghi vào lịch sử.</span></p>
      </div>
    </Dialog>
  );
}
