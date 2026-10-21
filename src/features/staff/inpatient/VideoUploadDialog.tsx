import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/app/session/SessionProvider';
import { mediaFor } from '@/assets/media';
import { staff, type StaffStayView, type VideoUploadInput } from '@/data/staff';
import { system } from '@/data/public';
import { useQuery } from '@/data/hooks/useQuery';
import { VIDEO_CAPTION_MAX, VIDEO_MSG, videoFileProblem } from '@/data/rules/video-upload';
import { ValidationError } from '@/data/contracts/errors';
import { toIsoVN } from '@/lib/dates';
import { Button, ChipGroup, Checkbox, DemoTag, Dialog, Field, Icon, Input, Textarea, useToast } from '@/ui';
import { cx } from '@/lib/cx';
import { FormError, saveError } from '../ui';
import { captionHints, readVideoDuration } from './videoProbe';
import s from './Inpatient.module.css';
import st from '../Staff.module.css';

type Source = 'demo' | 'device';
type Step = 1 | 2 | 3;
const TITLES: Record<Step, string> = { 1: 'Chọn video', 2: 'Lời nhắn', 3: 'Chia sẻ' };
const LIMITS = 'MP4, MOV, WebM · tối đa 15 giây · 20 MB';
const R25 = 'Bản demo: video tải từ máy được phát ở chế độ tắt tiếng; bản chính thức sẽ loại bỏ âm thanh khi tải lên.';
const minute = (d: Date) => toIsoVN(d).slice(0, 16);
const stepOfField = (f: string): Step => (f === 'file' || f === 'source' ? 1 : f === 'caption' || f === 'recorded_at' ? 2 : 3);

/** Upload a video in three visible steps: choose (sample or device file), add a message, share. Limits are shown up front and checked as soon as a file is chosen. */
export function VideoUploadDialog({ open, onClose, stay, onUploaded }: { open: boolean; onClose: () => void; stay: Pick<StaffStayView, 'id' | 'petName'>; onUploaded?: (id: string) => void }) {
  const { can } = useSession();
  const toast = useToast();
  const clips = useQuery(() => staff.inpatient.videos.demoClips(), []);
  const device = useQuery(() => staff.inpatient.videos.deviceUploadAvailable(), []);
  const [now] = useState(() => system.now());
  const [step, setStep] = useState<Step>(1);
  const [source, setSource] = useState<Source>('demo');
  const [clipKey, setClipKey] = useState<string | undefined>();
  const [file, setFile] = useState<File | undefined>();
  const [duration, setDuration] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | undefined>();
  const [caption, setCaption] = useState('');
  const [recorded, setRecorded] = useState(minute(now));
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const [busy, setBusy] = useState<'draft' | 'share' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const previewRef = useRef<string | undefined>(undefined);
  const latestFile = useRef<File | undefined>(undefined); // the file the person picked last: a slower earlier reading must not overwrite it
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);
  const canShare = can('inpatient.share');
  const deviceOff = device.data === false;

  async function pickFile(f: File | undefined) {
    latestFile.current = f;
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = undefined;
    setPreview(undefined);
    setFile(f);
    setDuration(0);
    setProblem(null);
    if (!f) return;
    const early = videoFileProblem(f); // type and size first: no need to open a file that is not a video
    if (early) { setProblem(early); return; }
    previewRef.current = URL.createObjectURL(f);
    setPreview(previewRef.current);
    const seconds = await readVideoDuration(f);
    if (latestFile.current !== f) return;
    setDuration(seconds);
    setProblem(videoFileProblem(f, seconds));
  }

  const ready = source === 'demo' ? !!clipKey : !!file && !problem;
  const canNext = step === 1 ? ready : true;

  async function submit(shareNow: boolean) {
    setBusy(shareNow ? 'share' : 'draft');
    setErrors({});
    const input: VideoUploadInput = {
      source: source === 'demo' ? { kind: 'demo', key: clipKey! } : { kind: 'device', file: file! },
      caption: caption.trim() || undefined, recorded_at: `${recorded}:00+07:00`,
      duration_s: source === 'device' && duration > 0 ? duration : undefined,
      share: shareNow ? { only_this_pet: true, no_people_or_private_info: true } : undefined,
    };
    try {
      const id = await staff.inpatient.videos.upload(stay.id, input);
      toast({ message: shareNow ? 'Đã tải video lên và chia sẻ với chủ nuôi.' : 'Đã tải video lên.' });
      onUploaded?.(id);
      onClose();
    } catch (e) {
      if (e instanceof ValidationError) {
        setErrors(e.fields);
        setStep(stepOfField(Object.keys(e.fields)[0] ?? ''));
      } else setErrors({ form: saveError(e) });
    } finally {
      setBusy(null);
    }
  }

  const footer = (
    <>
      {step > 1 ? <Button variant="ghost" onClick={() => setStep((n) => (n - 1) as Step)}>Quay lại</Button> : <Button variant="ghost" onClick={onClose}>Để sau</Button>}
      {step < 3 && <Button disabled={!canNext} onClick={() => setStep((n) => (n + 1) as Step)}>Tiếp</Button>}
      {step === 3 && !canShare && <Button icon="send" loading={busy === 'draft'} onClick={() => void submit(false)}>Tải lên (bản nháp)</Button>}
      {step === 3 && canShare && (
        <>
          <Button variant="secondary" loading={busy === 'draft'} onClick={() => void submit(false)}>Lưu nháp</Button>
          <Button icon="send" disabled={!a || !b} loading={busy === 'share'} onClick={() => void submit(true)}>Tải lên và chia sẻ</Button>
        </>
      )}
    </>
  );

  return (
    <Dialog open={open} onClose={onClose} wide title="Tải video lên" footer={footer}
      intro={<span className={s.stepHead} aria-live="polite">Bước {step}/3 · {TITLES[step]}</span>}>
      <div className={st.form}>
        <FormError>{errors.form}</FormError>
        {step === 1 && (
          <>
            <p className={s.limits}><Icon name="info" size={16} /> {LIMITS}</p>
            <ChipGroup<Source> label="Nguồn video" value={source} onChange={(v) => setSource(v)} options={[
              { value: 'demo', label: 'Video mẫu' }, { value: 'device', label: 'Chọn từ máy' },
            ]} />
            {source === 'demo' && (
              <ul className={s.clipGrid}>
                {(clips.data ?? []).map((c) => (
                  <li key={c.key}>
                    <button type="button" data-demo-clip aria-pressed={clipKey === c.key} className={cx(s.clip)} onClick={() => setClipKey(c.key)}>
                      {mediaFor(c.key) && <img src={mediaFor(c.key)!.thumb} alt="" loading="lazy" />}
                      <span>{c.label}</span>
                      <span className={cx(s.meta, 'num')}>{c.duration_s} giây</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {source === 'demo' && <p className={st.meta}><DemoTag>Video minh họa</DemoTag></p>}
            {source === 'device' && (
              deviceOff ? <p className={st.hint}><Icon name="info" size={16} /><span>{VIDEO_MSG.storage}</span></p> : (
                <div className={s.drop}>
                  <input type="file" accept="video/*" aria-label="Chọn tệp video từ máy" onChange={(e) => void pickFile(e.target.files?.[0])} />
                  {problem && <p className={s.fileProblem} role="alert"><Icon name="triangle-alert" size={16} /> {problem}</p>}
                  {file && !problem && (
                    <div className={s.previewBox}>
                      {preview && <video data-upload-preview src={preview} muted controls playsInline className={s.preview} />}
                      <p className={st.meta} data-upload-duration>Thời lượng: <span className="num">{duration > 0 ? `${duration} giây` : '—'}</span></p>
                      <p className={st.meta}>{R25}</p>
                      <span className={cx(st.tag, st.tag_grey)}>Chỉ lưu trên trình duyệt này</span>
                    </div>
                  )}
                </div>
              )
            )}
            <FormError>{errors.file ?? errors.source}</FormError>
          </>
        )}
        {step === 2 && (
          <>
            <Field label="Lời nhắn kèm video" optional error={errors.caption} hint={`${caption.length}/${VIDEO_CAPTION_MAX}`}>
              <Textarea rows={2} maxLength={VIDEO_CAPTION_MAX} value={caption} onChange={(e) => setCaption(e.target.value)} />
            </Field>
            <div className={s.hints}>
              {captionHints(stay.petName).map((h) => <button key={h} type="button" data-caption-hint className={s.hintBtn} onClick={() => setCaption(h)}>{h}</button>)}
            </div>
            <Field label="Thời điểm quay" error={errors.recorded_at}>
              <Input type="datetime-local" value={recorded} max={minute(now)} onChange={(e) => setRecorded(e.target.value)} />
            </Field>
            <span className={st.chipsWrap}><span className={cx(st.tag, st.tag_grey)}>Âm thanh: đã loại bỏ</span><span className={cx(st.tag, st.tag_grey)}>Tự xóa sau 60 ngày</span></span>
          </>
        )}
        {step === 3 && (
          canShare ? (
            <>
              <Checkbox label="Video không có người hay thú cưng của khách khác" checked={a} onChange={(e) => setA(e.target.checked)} />
              <Checkbox label="Không thấy tên thuốc, y lệnh hay giấy tờ nội bộ" checked={b} onChange={(e) => setB(e.target.checked)} />
              <p className={st.meta}>Chọn "Lưu nháp" nếu bạn muốn xem lại rồi chia sẻ sau.</p>
              <FormError>{errors.share}</FormError>
            </>
          ) : <p className={st.meta}>Video được lưu ở dạng bản nháp. Người có quyền chia sẻ sẽ kiểm tra rồi gửi cho chủ nuôi.</p>
        )}
      </div>
    </Dialog>
  );
}
