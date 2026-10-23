import { useState } from 'react';
import { SPECIES_LABEL, type Species } from '@/data/contracts/enums';
import { ConflictError, ValidationError } from '@/data/contracts/errors';
import { FEATURED_SPECIES } from '@/data/rules/content';
import { staff, type StaffFeaturedCaseRow } from '@/data/staff';
import { Button, Checkbox, Counter, Dialog, Field, Input, Select, Textarea, useToast } from '@/ui';
import { FormError, saveError } from '../ui';
import { CASE_LIMITS } from './contentView';
import { ImageField } from './ImageField';
import { saveWithImage, type ImageChange } from './saveContent';
import s from '../Staff.module.css';
import c from './Content.module.css';

/** Add or edit one treatment story. The owner's consent is asked every time: it is a statement about this exact text. */
export function CaseDialog({ open, onClose, row }: { open: boolean; onClose: () => void; row?: StaffFeaturedCaseRow }) {
  const toast = useToast();
  const [v, setV] = useState({ title: row?.title ?? '', petName: row?.petName ?? '', species: (row?.species ?? 'dog') as Species, story: row?.story ?? '', consent: false });
  const [change, setChange] = useState<ImageChange>(undefined);
  const [at, setAt] = useState(row ? { id: row.id, version: row.version } : undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const patch = (p: Partial<typeof v>) => setV((x) => ({ ...x, ...p }));

  async function save() {
    setBusy(true);
    setErrors({});
    try {
      const input = { title: v.title.trim(), story: v.story.trim(), petName: v.petName.trim(), species: v.species, consent: v.consent };
      const done = await saveWithImage(staff.content.cases, input, change, at);
      if (done.imageError) {
        setAt({ id: done.id, version: done.version });
        setErrors({ file: done.imageError });
        return;
      }
      toast({ message: at ? 'Đã lưu câu chuyện.' : 'Đã thêm câu chuyện.' });
      onClose();
    } catch (e) {
      if (e instanceof ConflictError) { toast({ tone: 'error', message: saveError(e) }); onClose(); return; } // the list reloads itself
      setErrors(e instanceof ValidationError ? e.fields : { form: saveError(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} wide title={at ? 'Sửa câu chuyện' : 'Thêm câu chuyện'}
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="check" loading={busy} onClick={() => void save()}>Lưu câu chuyện</Button></>}>
      <div className={s.form}>
        <FormError>{errors.form}</FormError>
        <Field label="Tiêu đề" error={errors.title}><Input value={v.title} onChange={(e) => patch({ title: e.target.value })} autoComplete="off" /></Field>
        <div className={s.two}>
          <Field label="Tên bé" error={errors.petName}><Input value={v.petName} onChange={(e) => patch({ petName: e.target.value })} autoComplete="off" /></Field>
          <Field label="Loài" error={errors.species}>
            <Select value={v.species} onChange={(e) => patch({ species: e.target.value as Species })}>
              {FEATURED_SPECIES.map((k) => <option key={k} value={k}>{SPECIES_LABEL[k]}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Câu chuyện" error={errors.story} hint={<Counter value={v.story.length} max={CASE_LIMITS.story} />}>
          <Textarea rows={6} value={v.story} onChange={(e) => patch({ story: e.target.value })} />
        </Field>
        <ImageField imageKey={row?.imageKey} change={change} onChange={setChange} error={errors.file} />
        <div>
          <Checkbox checked={v.consent} onChange={(e) => patch({ consent: e.target.checked })} aria-invalid={errors.consent ? true : undefined}
            label="Chủ nuôi đã đồng ý cho đăng câu chuyện này" />
          {errors.consent && <p className={c.reminder} role="alert">{errors.consent}</p>}
        </div>
        <p className={c.reminder}>Đừng ghi tên thuốc, liều dùng, họ tên khách hay số điện thoại. Hệ thống sẽ từ chối.</p>
      </div>
    </Dialog>
  );
}
