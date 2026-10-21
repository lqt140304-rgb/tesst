import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/app/session/SessionProvider';
import { system } from '@/data/public';
import { staff, type StaffStayView, type StaffVideoRow } from '@/data/staff';
import { useMediaUrls } from '@/data/hooks/useMediaUrls';
import { daysBetween } from '@/lib/dates';
import { Button, Checkbox, DemoTag, Dialog, Icon, StatusPill, VideoPlayer, statusPill, useToast } from '@/ui';
import { cx } from '@/lib/cx';
import { FormError, saveError, whenShort } from '../ui';
import { VideoUploadDialog } from './VideoUploadDialog';
import s from './Inpatient.module.css';
import st from '../Staff.module.css';

const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;

/** Videos (staff §5.2.3): muted, 60-day auto-delete, two checks before anything reaches the owner. */
export function VideosTab({ v }: { v: StaffStayView }) {
  const [playing, setPlaying] = useState<StaffVideoRow | null>(null);
  const [sharing, setSharing] = useState<StaffVideoRow | null>(null);
  const [deleting, setDeleting] = useState<StaffVideoRow | null>(null);
  const [uploading, setUploading] = useState(false);
  const { can } = useSession();
  const justAdded = useRef<string | null>(null);
  const live = v.videos.filter((x) => !x.deleted);
  const gone = v.videos.filter((x) => x.deleted);
  // After an upload, bring the new video into view once the list has it.
  useEffect(() => {
    const id = justAdded.current;
    if (id && live.some((x) => x.id === id)) {
      justAdded.current = null;
      document.querySelector(`[data-staff-video="${id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [live]);
  return (
    <div className={s.customerSide}>
      <p className={s.customerBanner}><span className={s.eyeChip}><Icon name="eye" size={13} /> Khách sẽ thấy</span>Video đã chia sẻ hiển thị cho chủ nuôi, không có âm thanh, tự xóa sau 60 ngày.</p>
      {can('inpatient.diary_write') && !v.discharged_at && (
        <div><Button icon="plus" onClick={() => setUploading(true)}>Tải video lên</Button></div>
      )}
      {live.length === 0 ? <p className={st.empty}>Chưa có video nào cho lượt nội trú này.</p> : (
        <ul className={s.videoGrid}>
          {live.map((x) => <Card key={x.id} x={x} onPlay={() => setPlaying(x)} onShare={() => setSharing(x)} onDelete={() => setDeleting(x)} />)}
        </ul>
      )}
      {gone.length > 0 && <p className={st.meta}>{gone.length} video đã được xóa (tự xóa sau 60 ngày hoặc do nhân viên xóa).</p>}
      <Dialog open={!!playing} onClose={() => setPlaying(null)} wide title={playing?.caption ?? 'Video'}>
        {playing && <PlayerBody x={playing} />}
      </Dialog>
      {can('inpatient.diary_write') && !v.discharged_at && <VideoUploadDialog key={`up-${uploading}`} open={uploading} onClose={() => setUploading(false)} stay={v} onUploaded={(id) => { justAdded.current = id; }} />}
      <ShareDialog key={sharing?.id ?? 'none'} x={sharing} onClose={() => setSharing(null)} />
      <DeleteDialog x={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}

function PlayerBody({ x }: { x: StaffVideoRow }) {
  const { urls, loading, missing } = useMediaUrls(x.media_key);
  if (loading) return <p className={st.meta}>Đang mở video…</p>;
  if (missing || !urls) return <p className={st.empty}>Không còn tệp video.</p>;
  return (
    <div className={st.form}>
      <VideoPlayer src={urls.mp4} poster={urls.poster} label={x.caption ?? 'Video nội trú'} autoPlay />
      <p className={st.meta}>Không có âm thanh · {whenShort(x.uploaded_at)} {x.isLocal ? 'Chỉ lưu trên trình duyệt này' : <DemoTag>Video minh họa</DemoTag>}</p>
    </div>
  );
}

function Card({ x, onPlay, onShare, onDelete }: { x: StaffVideoRow; onPlay: () => void; onShare: () => void; onDelete: () => void }) {
  const { can } = useSession();
  const toast = useToast();
  const { urls, missing } = useMediaUrls(x.media_key);
  const left = Math.max(0, daysBetween(system.now(), x.expires_at));
  return (
    <li className={s.videoCard} data-staff-video={x.id}>
      <button type="button" className={s.thumb} onClick={onPlay} aria-label={`Xem video: ${x.caption ?? 'video nội trú'}`}>
        {urls?.thumb ? <img src={urls.thumb} alt="" loading="lazy" /> : missing ? <span className={st.meta}>Không còn tệp video</span> : null}
        <span className={s.play} aria-hidden="true"><Icon name="play" size={20} /></span>
        <span className={s.duration}>{clock(x.duration_s)}</span>
      </button>
      <div className={s.videoBody}>
        <p className={s.videoCaption}>{x.caption ?? 'Video nội trú'}</p>
        <p className={st.meta}>Quay lúc {whenShort(x.uploaded_at)}{x.uploaderName ? ` · ${x.uploaderName}` : ''}</p>
        <span className={st.chipsWrap}>
          <StatusPill pill={statusPill('share', x.share_status)} dense />
          <span className={cx(st.tag, st.tag_grey)}><Icon name="volume-x" size={13} />Không có âm thanh</span>
          {x.isLocal && <span className={cx(st.tag, st.tag_grey)}>Chỉ lưu trên trình duyệt này</span>}
        </span>
        <div className={s.expiry}>
          <span className={cx(st.meta, left <= 7 && s.expirySoon)}>{left <= 7 ? `Còn ${left} ngày sẽ tự xóa` : `Tự xóa sau ${left} ngày`}</span>
          <span className={s.bar}><span style={{ width: `${Math.min(100, (left / 60) * 100)}%` }} className={cx(left <= 7 && s.barSoon)} /></span>
        </div>
        {can('inpatient.share') && (
          <div className={st.pageActions}>
            {x.share_status !== 'shared'
              ? <Button size="sm" icon="send" onClick={onShare}>Chia sẻ…</Button>
              : <Button size="sm" variant="secondary" icon="eye-off" onClick={async () => {
                  try { await staff.inpatient.videos.unshare(x.id); toast({ message: 'Đã ngừng chia sẻ video.' }); } catch (e) { toast({ tone: 'error', message: saveError(e) }); }
                }}>Ngừng chia sẻ</Button>}
            <Button size="sm" variant="ghost" icon="trash-2" onClick={onDelete}>Xóa video</Button>
          </div>
        )}
      </div>
    </li>
  );
}

function ShareDialog({ x, onClose }: { x: StaffVideoRow | null; onClose: () => void }) {
  const toast = useToast();
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function share() {
    if (!x) return;
    if (!a || !b) { setErr('Vui lòng kiểm tra đủ hai mục trước khi chia sẻ.'); return; }
    setBusy(true);
    try {
      await staff.inpatient.videos.share(x.id, { only_this_pet: true, no_people_or_private_info: true });
      toast({ message: 'Đã chia sẻ video với chủ nuôi.' });
      onClose();
    } catch (e) {
      setErr(saveError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={!!x} onClose={onClose} title="Chia sẻ video với chủ nuôi" intro="Kiểm tra lại video trước khi chủ nuôi xem được."
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="send" loading={busy} onClick={() => void share()}>Chia sẻ</Button></>}>
      <div className={st.form}>
        <Checkbox label="Video không có người hay thú cưng của khách khác" checked={a} onChange={(e) => setA(e.target.checked)} />
        <Checkbox label="Không thấy tên thuốc, y lệnh hay giấy tờ nội bộ" checked={b} onChange={(e) => setB(e.target.checked)} />
        <span className={st.chipsWrap}><span className={cx(st.tag, st.tag_grey)}>Âm thanh: đã loại bỏ</span><span className={cx(st.tag, st.tag_grey)}>Tự xóa sau 60 ngày</span></span>
        <FormError>{err}</FormError>
      </div>
    </Dialog>
  );
}

function DeleteDialog({ x, onClose }: { x: StaffVideoRow | null; onClose: () => void }) {
  const toast = useToast();
  return (
    <Dialog open={!!x} onClose={onClose} title="Xóa video?" intro="Video sẽ bị xóa vĩnh viễn và chủ nuôi không xem được nữa."
      footer={<>
        <Button variant="ghost" onClick={onClose}>Giữ lại</Button>
        <Button variant="danger" icon="trash-2" onClick={async () => {
          if (!x) return;
          try { await staff.inpatient.videos.delete(x.id); toast({ message: 'Đã xóa video.' }); onClose(); } catch (e) { toast({ tone: 'error', message: saveError(e) }); }
        }}>Xóa video</Button>
      </>} />
  );
}
