import { useState } from 'react';
import { staff, type StaffPriceItem } from '@/data/staff';
import { PRICE_CATEGORIES, PRICE_CATEGORY_LABEL, TREATMENT_LINE_LABEL, type CustomerGroup, type PriceCategory } from '@/data/contracts/enums';
import { ConflictError, ValidationError } from '@/data/contracts/errors';
import { Button, ChipGroup, Dialog, Field, Icon, Input, Select, useToast } from '@/ui';
import { FormError, saveError } from '../ui';
import { fixedGroupNote, isDayItemCode, parseVnd, priceSummary, toPriceInput, type PriceFormValues } from './priceForm';
import s from '../Staff.module.css';
import pr from './Prices.module.css';

const dots = (n: number | undefined) => (n === undefined ? '' : n.toLocaleString('vi-VN'));

/** One form to add or edit a service. Editing sends the version it opened with; the group cannot change after creation. */
export function PriceDialog({ open, onClose, item }: { open: boolean; onClose: () => void; item?: StaffPriceItem }) {
  const toast = useToast();
  const [v, setV] = useState<PriceFormValues>({
    category: item?.category ?? 'exam', name: item?.name ?? '', unit: item?.unit ?? '', mode: item?.price_mode ?? 'fixed',
    price: item?.price_mode === 'fixed' ? dots(item.price) : '', reference: dots(item?.reference_price), group: item?.customer_group ?? 'itemized',
  });
  const [version] = useState(item?.version);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const patch = (p: Partial<PriceFormValues>) => setV((x) => ({ ...x, ...p }));
  const dayItem = !!item && isDayItemCode(item.code);
  const tidy = (key: 'price' | 'reference') => () => { const n = parseVnd(v[key]); if (n !== undefined) patch({ [key]: dots(n) }); };

  async function save() {
    setBusy(true);
    setErrors({});
    try {
      if (item && version !== undefined) {
        await staff.prices.update(item.id, version, toPriceInput(v));
        toast({ message: `Đã lưu dịch vụ ${item.code}.` });
      } else {
        const id = await staff.prices.create(toPriceInput(v));
        const code = (await staff.prices.list()).find((p) => p.id === id)?.code ?? '';
        toast({ message: `Đã thêm dịch vụ ${code}.` });
      }
      onClose();
    } catch (e) {
      if (e instanceof ConflictError) { toast({ tone: 'error', message: saveError(e) }); onClose(); return; } // the table reloads itself: reopen to edit the new data
      setErrors(e instanceof ValidationError ? e.fields : { form: saveError(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} wide title={item ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="check" loading={busy} onClick={() => void save()}>Lưu dịch vụ</Button></>}>
      <div className={s.form}>
        <FormError>{errors.form ?? errors.active}</FormError>
        {item ? (
          <p className={pr.fixedRow}><span className={s.meta}>Nhóm</span><strong>{PRICE_CATEGORY_LABEL[item.category]}</strong><span className={s.meta}>Nhóm không đổi được.</span></p>
        ) : (
          <Field label="Nhóm" error={errors.category}>
            <Select value={v.category} onChange={(e) => patch({ category: e.target.value as PriceCategory })}>
              {PRICE_CATEGORIES.map((c) => <option key={c} value={c}>{PRICE_CATEGORY_LABEL[c]}</option>)}
            </Select>
          </Field>
        )}
        <div className={s.two}>
          <Field label="Tên" error={errors.name}><Input value={v.name} onChange={(e) => patch({ name: e.target.value })} autoComplete="off" /></Field>
          <Field label="Đơn vị" error={errors.unit} hint="Ví dụ: lần, mũi, ngày."><Input value={v.unit} onChange={(e) => patch({ unit: e.target.value })} autoComplete="off" /></Field>
        </div>
        {dayItem ? (
          <p className={s.hint}><Icon name="info" size={16} /><span>Mục tính tiền nội trú không đổi sang nhập giá.</span></p>
        ) : (
          <Field label="Cách tính giá" error={errors.price_mode}>
            <ChipGroup<'fixed' | 'open'> label="Cách tính giá" value={v.mode} onChange={(mode) => patch({ mode })} options={[
              { value: 'fixed', label: 'Giá cố định' }, { value: 'open', label: 'Nhập khi lập hóa đơn' },
            ]} />
          </Field>
        )}
        {v.mode === 'fixed' ? (
          <Field label="Giá (₫)" error={errors.price}><Input inputMode="numeric" value={v.price} onChange={(e) => patch({ price: e.target.value })} onBlur={tidy('price')} /></Field>
        ) : (
          <Field label="Giá gợi ý (₫)" optional error={errors.reference_price} hint="Chỉ để điền sẵn khi lập hóa đơn, bạn vẫn sửa được lúc đó.">
            <Input inputMode="numeric" value={v.reference} onChange={(e) => patch({ reference: e.target.value })} onBlur={tidy('reference')} />
          </Field>
        )}
        {v.category === 'exam' ? (
          <Field label="Khách thấy trong">
            <ChipGroup<CustomerGroup> label="Khách thấy trong" value={v.group} onChange={(group) => patch({ group })} options={[
              { value: 'itemized', label: 'Từng dòng' }, { value: 'treatment', label: TREATMENT_LINE_LABEL },
            ]} />
          </Field>
        ) : <p className={s.meta}>{fixedGroupNote(v.category)}</p>}
        {item && <p className={s.hint}><Icon name="info" size={16} /><span>Giá mới chỉ áp dụng cho hóa đơn lập sau. Hóa đơn cũ giữ nguyên.</span></p>}
        <p className={pr.summary}><Icon name="clipboard-list" size={16} /> {priceSummary(v)}</p>
      </div>
    </Dialog>
  );
}
