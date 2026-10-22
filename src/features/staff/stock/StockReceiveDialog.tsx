import { useState } from 'react';
import { staff, type StockRow } from '@/data/staff';
import { Button, Dialog, Field, Input } from '@/ui';
import { FormError } from '../ui';
import { parseQty, receiveErrors, toReceiveInput, type ReceiveFormValues } from './stockForm';
import { qtyText, receivePreview } from './stockView';
import { useStockSave } from './useStockSave';
import s from '../Staff.module.css';

/** Goods came in. The new lot's expiry only matters when it is nearer than what the item already has (the API keeps the nearest). */
export function StockReceiveDialog({ open, onClose, item }: { open: boolean; onClose: () => void; item: StockRow }) {
  const [v, setV] = useState<ReceiveFormValues>({ qty: '', supplier: '', note: '', expiresOn: '' });
  const [version] = useState(item.version);
  const { errors, busy, save, clear } = useStockSave(onClose);
  const patch = (p: Partial<ReceiveFormValues>) => { setV((x) => ({ ...x, ...p })); clear('qty', 'supplier', 'expires_on', 'note'); };
  const qty = parseQty(v.qty);

  const submit = () => save(receiveErrors(v, item), async () => {
    await staff.stock.receive(item.id, version, toReceiveInput(v));
    return `Đã nhập thêm ${qtyText(qty ?? 0, item.unit)} vào ${item.name}.`;
  });

  return (
    <Dialog open={open} onClose={onClose} wide title="Nhập thêm"
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="check" loading={busy} loadingText="Đang lưu…" onClick={() => void submit()}>Nhập vào kho</Button></>}>
      <div className={s.form}>
        <FormError>{errors.form ?? errors.item}</FormError>
        <p className={s.meta}>{item.name} · đang có {qtyText(item.qty, item.unit)}</p>
        <Field label="Số lượng" error={errors.qty} hint={receivePreview(item.qty, qty, item.unit)}>
          <Input inputMode="numeric" value={v.qty} onChange={(e) => patch({ qty: e.target.value })} />
        </Field>
        <Field label="Nhà cung cấp" optional error={errors.supplier}><Input value={v.supplier} onChange={(e) => patch({ supplier: e.target.value })} autoComplete="off" /></Field>
        <Field label="Hạn dùng lô mới" optional error={errors.expires_on} hint="Ví dụ: 2027-03-31. Món giữ hạn gần nhất giữa hạn cũ và hạn mới.">
          <Input value={v.expiresOn} onChange={(e) => patch({ expiresOn: e.target.value })} autoComplete="off" />
        </Field>
        <Field label="Ghi chú" optional error={errors.note}><Input value={v.note} onChange={(e) => patch({ note: e.target.value })} autoComplete="off" /></Field>
      </div>
    </Dialog>
  );
}
