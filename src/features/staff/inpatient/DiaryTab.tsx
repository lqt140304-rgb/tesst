import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { useSession } from '@/app/session/SessionProvider';
import { staff, type StaffDiaryRow, type StaffStayView } from '@/data/staff';
import {
  DIARY_CATEGORY_LABEL, GENERAL_STATUS_LABEL, PART_OF_DAY_LABEL, type DiaryCategory, type GeneralStatus, type PartOfDay,
} from '@/data/contracts/enums';
import { partOfDay } from '@/lib/dates';
import { system } from '@/data/public';
import { Banner, Button, Counter, Dialog, Field, Icon, Select, StatusPill, Textarea, statusPill, useToast, type IconName } from '@/ui';
import { FormError, saveError, whenShort } from '../ui';
import s from './Inpatient.module.css';
import st from '../Staff.module.css';

const MAX = 600;
const CATEGORY_ICON: Record<DiaryCategory, IconName> = { an_uong: 'pet-bowl', nghi_ngoi: 'moon', tinh_than: 'heart', van_dong: 'footprints', loi_nhan: 'message-circle' };
/** Warm labels the customer sees (staff §5.2.2); "Lê Sơn muốn trao đổi" is set by staff too. */
const STATUSES: GeneralStatus[] = ['stable', 'recovering', 'watch', 'ready_home', 'want_to_talk'];

/** "Nhật ký cho chủ nuôi" (staff §5.2.2 with R2 part of day + category and R7 soft lint). */
export function DiaryTab({ v }: { v: StaffStayView }) {
  const { can } = useSession();
  const toast = useToast();
  const [part, setPart] = useState<PartOfDay>(partOfDay(system.now()));
  const [category, setCategory] = useState<DiaryCategory>('an_uong');
  const [status, setStatus] = useState<GeneralStatus>('stable');
  const [text, setText] = useState('');
  const [hits, setHits] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<'draft' | 'share' | null>(null);
  const [preview, setPreview] = useState(false);
  const canShare = can('inpatient.share');
  const canWrite = can('inpatient.diary_write') && !v.discharged_at;

  // Soft lint (R7): a debounced check against drug names and dose patterns; it warns, never blocks.
  useEffect(() => {
    if (!text.trim()) return;
    let alive = true;
    const t = setTimeout(() => { void staff.inpatient.diary.lint(text).then((h) => { if (alive) setHits(h); }); }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [text]);
  const warn = text.trim() ? hits : [];

  async function save(share: boolean) {
    setBusy(share ? 'share' : 'draft');
    setErr('');
    try {
      const id = await staff.inpatient.diary.saveDraft(v.id, { part_of_day: part, category, general_status: status, text });
      if (share) await staff.inpatient.diary.share(id);
      toast({ message: share ? 'Đã chia sẻ nhật ký với chủ nuôi.' : 'Đã lưu nháp nhật ký.' });
      setText('');
      setHits([]);
    } catch (e) {
      setErr(saveError(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={s.customerSide}>
      <p className={s.customerBanner}><span className={s.eyeChip}><Icon name="eye" size={13} /> Khách sẽ thấy</span>Nội dung ở đây sẽ hiển thị cho chủ nuôi sau khi bạn chia sẻ.</p>
      {v.ownerWeb !== 'linked' && (
        <Banner tone="warm" icon="unlink">Chủ nuôi chưa liên kết tài khoản web. Nhật ký và video đã chia sẻ sẽ hiển thị cho khách sau khi liên kết.</Banner>
      )}
      <div className={s.diaryCols}>
        {canWrite && (
          <section className={s.composer} aria-label="Viết nhật ký cho chủ nuôi">
            <h2 className={st.h2}><Icon name="file-pen" size={18} />Viết nhật ký cho chủ nuôi</h2>
            <div className={s.three}>
              <Field label="Buổi">
                <Select value={part} onChange={(e) => setPart(e.target.value as PartOfDay)}>{(Object.keys(PART_OF_DAY_LABEL) as PartOfDay[]).map((k) => <option key={k} value={k}>{PART_OF_DAY_LABEL[k]}</option>)}</Select>
              </Field>
              <Field label="Loại">
                <Select value={category} onChange={(e) => setCategory(e.target.value as DiaryCategory)}>{(Object.keys(DIARY_CATEGORY_LABEL) as DiaryCategory[]).map((k) => <option key={k} value={k}>{DIARY_CATEGORY_LABEL[k]}</option>)}</Select>
              </Field>
              <Field label="Tình trạng chung">
                <Select value={status} onChange={(e) => setStatus(e.target.value as GeneralStatus)}>{STATUSES.map((k) => <option key={k} value={k}>{GENERAL_STATUS_LABEL[k]}</option>)}</Select>
              </Field>
            </div>
            <Field label="Nội dung" hint="Không ghi tên thuốc, liều lượng hay giờ tiêm.">
              <Textarea rows={4} maxLength={MAX} value={text} onChange={(e) => setText(e.target.value)}
                placeholder={`Ví dụ: Sáng nay ${v.petName} ăn hết phần pate, đi lại nhẹ nhàng và ngủ trưa rất ngon.`} />
            </Field>
            <Counter value={text.length} max={MAX} />
            <AnimatePresence>
              {warn.length > 0 && (
                <m.p className={st.warn} role="status" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Icon name="triangle-alert" size={16} />
                  <span>Nội dung có thể chứa thông tin thuốc hoặc liều dùng. Vui lòng kiểm tra lại trước khi chia sẻ. <span className={st.meta}>({warn.join(', ')})</span></span>
                </m.p>
              )}
            </AnimatePresence>
            <FormError>{err}</FormError>
            <div className={st.pageActions}>
              <Button variant="secondary" icon="file-pen" loading={busy === 'draft'} onClick={() => void save(false)}>Lưu nháp</Button>
              <Button variant="ghost" icon="eye" disabled={!text.trim()} onClick={() => setPreview(true)}>Xem như chủ nuôi</Button>
              {canShare && <Button icon="send" loading={busy === 'share'} onClick={() => void save(true)}>Chia sẻ ngay</Button>}
            </div>
          </section>
        )}
        <section className={s.entries} aria-label="Các mục nhật ký">
          {v.diary.length === 0 ? <p className={st.empty}>Chưa có mục nhật ký nào.</p> : (
            <ul className={s.entryList}>
              {v.diary.map((e) => <Entry key={e.id} e={e} canShare={canShare && !v.discharged_at} />)}
            </ul>
          )}
        </section>
      </div>
      <Dialog open={preview} onClose={() => setPreview(false)} title="Xem như chủ nuôi" intro="Khách sẽ thấy mục này như sau khi bạn chia sẻ.">
        <CustomerPreview petName={v.petName} part={part} category={category} status={status} text={text} />
      </Dialog>
    </div>
  );
}

function Entry({ e, canShare }: { e: StaffDiaryRow; canShare: boolean }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function act(fn: () => Promise<void>, done: string) {
    setBusy(true);
    try { await fn(); toast({ message: done }); } catch (x) { toast({ tone: 'error', message: saveError(x) }); } finally { setBusy(false); }
  }
  return (
    <li className={s.entry} data-diary-entry>
      <div className={s.entryTop}>
        <StatusPill pill={statusPill('share', e.status)} dense />
        <span className={st.meta}><Icon name={CATEGORY_ICON[e.category]} size={13} /> {PART_OF_DAY_LABEL[e.part_of_day]} · {DIARY_CATEGORY_LABEL[e.category]} · {GENERAL_STATUS_LABEL[e.general_status]}</span>
      </div>
      <p className={s.entryText}>{e.text}</p>
      <p className={st.meta}>
        {e.authorName ?? 'Nhân viên'} · {whenShort(e.created_at)}
        {e.status === 'shared' && e.shared_at && <> · Chia sẻ lúc {whenShort(e.shared_at)}{e.sharedByName ? ` bởi ${e.sharedByName}` : ''}</>}
      </p>
      {e.status === 'draft' && !canShare && <p className={s.waiting}>Chờ bác sĩ hoặc quản lý chia sẻ</p>}
      {canShare && e.status === 'draft' && (
        <div><Button size="sm" icon="send" loading={busy} onClick={() => void act(() => staff.inpatient.diary.share(e.id), 'Đã chia sẻ nhật ký với chủ nuôi.')}>Chia sẻ với chủ nuôi</Button></div>
      )}
      {canShare && e.status === 'shared' && (
        <div><Button size="sm" variant="ghost" icon="eye-off" loading={busy} onClick={() => void act(() => staff.inpatient.diary.withdraw(e.id), 'Đã thu hồi. Chủ nuôi sẽ không còn thấy mục này.')}>Thu hồi</Button></div>
      )}
    </li>
  );
}

/** The customer's diary card, so staff see exactly what the owner will read (part of day, never a clock time). */
function CustomerPreview({ petName, part, category, status, text }: { petName: string; part: PartOfDay; category: DiaryCategory; status: GeneralStatus; text: string }) {
  return (
    <div className={s.preview}>
      <p className={st.meta}>Bé {petName} · {GENERAL_STATUS_LABEL[status]}</p>
      <div className={s.previewEntry}>
        <span className={s.previewPart}>{PART_OF_DAY_LABEL[part]}</span>
        <div>
          <p className={s.previewCat}><Icon name={CATEGORY_ICON[category]} size={16} /> {DIARY_CATEGORY_LABEL[category]}</p>
          <p className={s.entryText}>{text}</p>
          <p className={st.meta}>Lê Sơn</p>
        </div>
      </div>
    </div>
  );
}
