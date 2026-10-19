import { mediaFor } from '@/assets/media';
import type { CustomerVideo } from '@/data/customer';
import { Button, DemoTag, Dialog, VideoPlayer } from '@/ui';
import s from '../Customer.module.css';

/** Player (customer §9.6): muted, inline, previous / next, Esc closes and returns focus (Dialog). No download. */
export function VideoDialog({ videos, index, onIndex }: { videos: CustomerVideo[]; index: number | null; onIndex: (i: number | null) => void }) {
  const v = index === null ? undefined : videos[index];
  const media = v ? mediaFor(v.mediaKey) : null;
  return (
    <Dialog open={!!v} onClose={() => onIndex(null)} wide title={v ? `Bé ${v.petName} · ${v.whenLabel.toLowerCase()}` : ''}>
      {v && (
        <div className={s.player}>
          {media
            ? <VideoPlayer key={v.id} src={media.mp4} poster={media.poster} label={`Video bé ${v.petName}, ${v.whenLabel.toLowerCase()}`} autoPlay />
            : <p className={s.videoMissing}>Video này đã hết thời gian lưu (60 ngày).</p>}
          <p className={s.small}>Video không có âm thanh · Lưu đến hết ngày {v.expiresDate} (còn {v.daysLeft} ngày)</p>
          <div className={s.playerNav}>
            <Button variant="ghost" size="sm" icon="chevron-left" disabled={index === 0} onClick={() => onIndex(index! - 1)}>Video trước</Button>
            <DemoTag>Video minh họa</DemoTag>
            <Button variant="ghost" size="sm" iconRight="chevron-right" disabled={index === videos.length - 1} onClick={() => onIndex(index! + 1)}>Video sau</Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
