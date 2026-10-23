import { useState } from 'react';
import { FEATURED_CATEGORIES, FEATURED_CATEGORY_LABEL, type FeaturedCategory } from '@/data/contracts/enums';
import { ConflictError, ValidationError } from '@/data/contracts/errors';
import { staff, type StaffFeaturedProductRow } from '@/data/staff';
import { Button, Counter, Dialog, Field, Input, Select, useToast } from '@/ui';
import { FormError, saveError } from '../ui';
import { PRODUCT_LIMITS } from './contentView';
import { ImageField } from './ImageField';
import { contentError, endsDialog, saveWithImage, type ImageChange } from './saveContent';
import s from '../Staff.module.css';
import c from './Content.module.css';

/** Add or edit one featured product. After the words are saved the dialog stays on that product, so a picture that failed can be retried without making a second one. */
export function ProductDialog({ open, onClose, row }: { open: boolean; onClose: () => void; row?: StaffFeaturedProductRow }) {
  const toast = useToast();
  const [v, setV] = useState({ name: row?.name ?? '', category: (row?.category ?? 'food') as FeaturedCategory, note: row?.note ?? '' });
  const [change, setChange] = useState<ImageChange>(undefined);
  const [at, setAt] = useState(row ? { id: row.id, version: row.version } : undefined);
  const imageKey = row?.imageKey;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const patch = (p: Partial<typeof v>) => setV((x) => ({ ...x, ...p }));

  async function save() {
    setBusy(true);
    setErrors({});
    try {
      const note = v.note.trim();
      // Keep the price the data layer may hold: this screen has no price box, and an edit must not wipe it.
      const input = { name: v.name.trim(), category: v.category, ...(note ? { note } : {}), ...(row?.priceVnd !== undefined ? { priceVnd: row.priceVnd } : {}) };
      const done = await saveWithImage(staff.content.products, input, change, at);
      if (done.imageError) {
        setAt({ id: done.id, version: done.version });
        setErrors({ file: done.imageError });
        return;
      }
      toast({ message: at ? 'Đã lưu sản phẩm.' : 'Đã thêm sản phẩm.' });
      onClose();
    } catch (e) {
      if (e instanceof ConflictError || endsDialog(e)) { toast({ tone: 'error', message: contentError(e) }); onClose(); return; } // the list reloads itself
      setErrors(e instanceof ValidationError ? e.fields : { form: saveError(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} wide title={at ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="check" loading={busy} onClick={() => void save()}>Lưu sản phẩm</Button></>}>
      <div className={s.form}>
        <FormError>{errors.form}</FormError>
        <Field label="Tên" error={errors.name}>
          <Input value={v.name} maxLength={PRODUCT_LIMITS.name + 20} onChange={(e) => patch({ name: e.target.value })} autoComplete="off" />
        </Field>
        <Field label="Nhóm" error={errors.category}>
          <Select value={v.category} onChange={(e) => patch({ category: e.target.value as FeaturedCategory })}>
            {FEATURED_CATEGORIES.map((k) => <option key={k} value={k}>{FEATURED_CATEGORY_LABEL[k]}</option>)}
          </Select>
        </Field>
        <Field label="Ghi chú" optional error={errors.note} hint={<Counter value={v.note.length} max={PRODUCT_LIMITS.note} />}>
          <Input value={v.note} onChange={(e) => patch({ note: e.target.value })} autoComplete="off" />
        </Field>
        <ImageField imageKey={imageKey} change={change} onChange={setChange} error={errors.file} />
        <p className={c.reminder}>Đừng ghi tên thuốc, liều dùng, họ tên khách hay số điện thoại. Hệ thống sẽ từ chối.</p>
        <p className={s.meta}>Giá sẽ có khi Lê Sơn gửi bảng giá.</p>
      </div>
    </Dialog>
  );
}
