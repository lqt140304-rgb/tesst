import { useState } from 'react';
import { staff, type StockRow } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { STOCK_KINDS, STOCK_KIND_LABEL, type StockKind } from '@/data/contracts/enums';
import { Button, ChipGroup, Dialog, Field, Icon, Input } from '@/ui';
import { FormError } from '../ui';
import { itemErrors, suggestedMin, toStockInput, type ItemFormValues } from './stockForm';
import { useStockSave } from './useStockSave';
import s from '../Staff.module.css';
import st from './Stock.module.css';

/**
 * One form to add or edit an item. Editing sends the version it opened with, never changes the kind, and has no quantity box:
 * the quantity moves only through Nhập thêm, Xuất ra and Kiểm kê, so the history always adds up.
 */
export function StockItemDialog({ open, onClose, item, onSaved }: { open: boolean; onClose: () => void; item?: StockRow; onSaved?: (id: string) => void }) {
  const settings = useQuery(() => staff.settings.get(), []);
  const [v, setV] = useState<ItemFormValues>({
    name: item?.name ?? '', kind: item?.kind ?? 'thuoc', unit: item?.unit ?? '', qty: '0', minQty: item ? String(item.minQty) : '', expiresOn: item?.expiresOn ?? '',
  });
  const [minTouched, setMinTouched] = useState(!!item); // until the box is touched it follows the system setting, which may arrive a moment late
  const [version] = useState(item?.version);
  const { errors, busy, save } = useStockSave(onClose);
  const patch = (p: Partial<ItemFormValues>) => setV((x) => ({ ...x, ...p }));
  const mode = item ? 'update' : 'create';
  const values: ItemFormValues = { ...v, minQty: minTouched ? v.minQty : suggestedMin(settings.data?.values.stock_default_min) };

  function submit() {
    return save(itemErrors(values, mode), async () => {
      if (item && version !== undefined) {
        await staff.stock.update(item.id, version, toStockInput(values, 'update', item.active));
        return `Đã lưu món ${item.code}.`;
      }
      const id = await staff.stock.create(toStockInput(values, 'create'));
      const code = (await staff.stock.get(id)).item.code;
      onSaved?.(id);
      return `Đã thêm món ${code}.`;
    });
  }

  return (
    <Dialog open={open} onClose={onClose} wide title={item ? 'Sửa món' : 'Thêm món'}
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="check" loading={busy} onClick={() => void submit()}>Lưu món</Button></>}>
      <div className={s.form}>
        <FormError>{errors.form ?? errors.item}</FormError>
        <Field label="Tên món" error={errors.name}><Input value={v.name} onChange={(e) => patch({ name: e.target.value })} autoComplete="off" /></Field>
        {item ? (
          <p className={st.fixedRow}><span className={s.meta}>Loại</span><strong>{STOCK_KIND_LABEL[item.kind]}</strong><span className={s.meta}>Không đổi được loại của món này.</span></p>
        ) : (
          <Field label="Loại" error={errors.kind}>
            <ChipGroup<StockKind> label="Loại" value={v.kind} onChange={(kind) => patch({ kind })} options={STOCK_KINDS.map((k) => ({ value: k, label: STOCK_KIND_LABEL[k] }))} />
          </Field>
        )}
        <Field label="Đơn vị" error={errors.unit} hint="Ví dụ: viên, ống, hộp."><Input value={v.unit} onChange={(e) => patch({ unit: e.target.value })} autoComplete="off" /></Field>
        {item ? (
          <p className={s.hint}><Icon name="info" size={16} /><span>Muốn đổi số tồn, dùng Nhập thêm, Xuất ra hoặc Kiểm kê.</span></p>
        ) : (
          <Field label="Số lượng ban đầu" error={errors.qty}><Input inputMode="numeric" value={v.qty} onChange={(e) => patch({ qty: e.target.value })} /></Field>
        )}
        <Field label="Mức báo hết" error={errors.min_qty} hint="Để 0 nếu không cần báo sắp hết; vẫn báo khi hết hàng.">
          <Input inputMode="numeric" value={values.minQty} onChange={(e) => { setMinTouched(true); patch({ minQty: e.target.value }); }} />
        </Field>
        <Field label="Hạn dùng" optional error={errors.expires_on} hint="Ví dụ: 2027-03-31. Bỏ trống nếu không có hạn.">
          <Input value={v.expiresOn} onChange={(e) => patch({ expiresOn: e.target.value })} autoComplete="off" />
        </Field>
      </div>
    </Dialog>
  );
}
