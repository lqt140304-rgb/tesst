import { useState } from 'react';
import { staff, type StockRow } from '@/data/staff';
import { STOCK_ISSUE_REASONS, STOCK_REASON_LABEL, type StockIssueReason } from '@/data/contracts/enums';
import { Button, ChipGroup, Dialog, Field, Input } from '@/ui';
import { FormError } from '../ui';
import { issueErrors, parseQty, toIssueInput, type IssueFormValues } from './stockForm';
import { issuePreview, qtyText } from './stockView';
import { useStockSave } from './useStockSave';
import s from '../Staff.module.css';

/** Goods went out. Asking for more than is on hand is explained under the box, not blocked beforehand. */
export function StockIssueDialog({ open, onClose, item }: { open: boolean; onClose: () => void; item: StockRow }) {
  const [v, setV] = useState<IssueFormValues>({ qty: '', reason: 'dung_tai_phong', note: '' });
  const [version] = useState(item.version);
  const { errors, busy, save, clear } = useStockSave(onClose);
  const patch = (p: Partial<IssueFormValues>) => { setV((x) => ({ ...x, ...p })); clear('qty', 'reason', 'note'); };
  const qty = parseQty(v.qty);

  const submit = () => save(issueErrors(v, item), async () => {
    await staff.stock.issue(item.id, version, toIssueInput(v));
    return `Đã xuất ${qtyText(qty ?? 0, item.unit)} khỏi ${item.name}.`;
  });

  return (
    <Dialog open={open} onClose={onClose} wide title="Xuất ra"
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="check" loading={busy} loadingText="Đang lưu…" onClick={() => void submit()}>Xuất khỏi kho</Button></>}>
      <div className={s.form}>
        <FormError>{errors.form ?? errors.item}</FormError>
        <p className={s.meta}>{item.name} · đang có {qtyText(item.qty, item.unit)}</p>
        <Field label="Số lượng" error={errors.qty} hint={issuePreview(item.qty, qty, item.unit)}>
          <Input inputMode="numeric" value={v.qty} onChange={(e) => patch({ qty: e.target.value })} />
        </Field>
        <Field label="Lý do" error={errors.reason}>
          <ChipGroup<StockIssueReason> label="Lý do" value={v.reason} onChange={(reason) => patch({ reason })}
            options={STOCK_ISSUE_REASONS.map((r) => ({ value: r, label: STOCK_REASON_LABEL[r] }))} />
        </Field>
        <Field label="Ghi chú" optional error={errors.note}><Input value={v.note} onChange={(e) => patch({ note: e.target.value })} autoComplete="off" /></Field>
      </div>
    </Dialog>
  );
}
