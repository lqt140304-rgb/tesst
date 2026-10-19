import { useState } from 'react';
import { useParams } from 'react-router';
import { AnimatePresence, m } from 'motion/react';
import { paths } from '@/app/routes';
import { mediaFor } from '@/assets/media';
import { customer, type CustomerDiaryEntry, type CustomerVideo } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { NotLinkedError } from '@/data/contracts/errors';
import { DIARY_CATEGORY_LABEL, PART_OF_DAY_LABEL, type DiaryCategory } from '@/data/contracts/enums';
import { formatDateVi } from '@/lib/dates';
import { ButtonAnchor, ButtonLink, EmptyState, Icon, StatusPill, Tabs, statusPill, type IconName } from '@/ui';
import { dur, ease, riseIn } from '@/ui/motion';
import { LockedPage } from '../locked/LockedPage';
import { HOTLINE, LoadingBlocks, PageHeader, PageProblem, PetAvatar, TEL } from '../ui';
import { VideoDialog } from './VideoDialog';
import s from '../Customer.module.css';

const CATEGORY_ICON: Record<DiaryCategory, IconName> = {
  an_uong: 'pet-bowl', nghi_ngoi: 'moon', tinh_than: 'heart', van_dong: 'footprints', loi_nhan: 'message-circle',
};
export const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;

type Tab = 'diary' | 'videos';

/** Stay detail (customer §9.6 with R2): part of day only, category icons, "Lê Sơn" as the only author, muted videos. */
export function StayPage() {
  const { stayId = '' } = useParams();
  const q = useQuery(() => customer.stays.get(stayId), [stayId]);
  const [tab, setTab] = useState<Tab>('diary');
  const [playing, setPlaying] = useState<number | null>(null);
  if (q.error instanceof NotLinkedError) return <LockedPage kind="stays" />;
  if (q.error) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks />;
  const { stay, diary, videos } = q.data;
  const message = diary.find((e) => e.category === 'loi_nhan');
  const days = groupByDay(diary);

  return (
    <>
      <PageHeader eyebrow={<ButtonLink to={paths.kh.stays} variant="ghost" size="sm" icon="arrow-left">Nội trú</ButtonLink>}
        title={<span className={s.petHead}><PetAvatar name={stay.petName} species={stay.species} size={56} /><span>Bé {stay.petName}</span></span>}
        sub={stay.current
          ? <>nội trú từ {formatDateVi(`${stay.admittedAt}T12:00:00+07:00`)} · ngày thứ {stay.dayNumber}</>
          : <>nội trú {formatDateVi(`${stay.admittedAt}T12:00:00+07:00`)} – {stay.dischargedAt ? formatDateVi(`${stay.dischargedAt}T12:00:00+07:00`) : ''} · Bé đã về nhà</>}
        actions={stay.latestStatus && (
          <span className={s.stayStatus}><StatusPill pill={statusPill('general', stay.latestStatus)} />{stay.updatedLabel && <span className={s.muted}>{stay.updatedLabel}</span>}</span>
        )} />

      <div className={s.stack}>
        {stay.latestStatus === 'want_to_talk' && (
          <div className={s.talk} role="note">
            <Icon name="phone" size={20} />
            <p>Lê Sơn muốn trao đổi thêm với bạn về bé. Bạn gọi {HOTLINE} khi có thể nhé.</p>
            <ButtonAnchor href={TEL} size="sm" icon="phone">Gọi Lê Sơn</ButtonAnchor>
          </div>
        )}
        {message && (
          <m.section className={s.messageCard} {...riseIn(10)}>
            <p className={s.messageLabel}><Icon name="message-circle" size={18} /> Lời nhắn từ Lê Sơn</p>
            <p>{message.text}</p>
          </m.section>
        )}

        <Tabs<Tab> label="Nhật ký và video" value={tab} onChange={setTab} className={s.segTabs}
          items={[{ value: 'diary', label: 'Nhật ký' }, { value: 'videos', label: 'Video', count: videos.length }]} />

        <AnimatePresence mode="wait" initial={false}>
          <m.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: dur.m, ease: ease.out }}>
            {tab === 'diary' ? (
              days.length === 0 ? <EmptyState icon="diary" title="Nhật ký của bé sẽ được cập nhật tại đây." /> : (
                <div className={s.diary} data-diary>
                  {days.map(([day, entries]) => (
                    <section key={day} className={s.diaryDay}>
                      <h2 className={s.diaryDayTitle}>{day}</h2>
                      <ol className={s.diaryList}>
                        {entries.map((e, i) => (
                          <m.li key={e.id} className={s.diaryEntry} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
                            <span className={s.diaryPart}>{PART_OF_DAY_LABEL[e.part_of_day]}</span>
                            <div className={s.diaryBody}>
                              <p className={s.diaryCat}><Icon name={CATEGORY_ICON[e.category]} size={16} /> {DIARY_CATEGORY_LABEL[e.category]}</p>
                              <p className={s.diaryText}>{e.text}</p>
                              <p className={s.diaryBy}>Lê Sơn</p>
                            </div>
                          </m.li>
                        ))}
                      </ol>
                    </section>
                  ))}
                </div>
              )
            ) : videos.length === 0 ? <EmptyState icon="video" title="Video của bé sẽ hiện ở đây khi được đăng." /> : (
              <>
                <ul className={s.videoGrid}>
                  {videos.map((v, i) => <VideoCard key={v.id} v={v} onPlay={() => setPlaying(i)} />)}
                </ul>
                <p className={s.small}>Video được lưu 60 ngày kể từ ngày đăng, sau đó tự động xóa.</p>
              </>
            )}
          </m.div>
        </AnimatePresence>

        <p className={s.note}>Muốn hỏi thêm về bé? Gọi <a href={TEL}>{HOTLINE}</a>.</p>
      </div>
      <VideoDialog videos={videos} index={playing} onIndex={setPlaying} />
    </>
  );
}

function groupByDay(diary: CustomerDiaryEntry[]): [string, CustomerDiaryEntry[]][] {
  const out: [string, CustomerDiaryEntry[]][] = [];
  for (const e of diary) {
    const last = out[out.length - 1];
    if (last && last[0] === e.dayLabel) last[1].push(e);
    else out.push([e.dayLabel, [e]]);
  }
  return out;
}

function VideoCard({ v, onPlay }: { v: CustomerVideo; onPlay: () => void }) {
  const media = mediaFor(v.mediaKey);
  return (
    <li className={s.videoCard} data-video-card>
      <button type="button" className={s.videoThumb} onClick={onPlay} aria-label={`Xem video: bé ${v.petName} · ${v.whenLabel.toLowerCase()}`}>
        {media ? <img src={media.thumb} alt="" loading="lazy" /> : <span className={s.videoMissing}>Video này đã hết thời gian lưu (60 ngày).</span>}
        <span className={s.playGlyph} aria-hidden="true"><Icon name="play" size={22} /></span>
        <span className={s.videoDuration}>{clock(v.durationS)}</span>
      </button>
      <div className={s.videoMeta}>
        <p className={s.videoWhen}>{v.whenLabel}</p>
        {v.caption && <p className={s.small}>{v.caption}</p>}
        <div className={s.rowTop}>
          <span className={s.greyTag}><Icon name="volume-x" size={13} /> Không có âm thanh</span>
          <StatusPill pill={statusPill('expiry', v.daysLeft)} dense />
        </div>
      </div>
    </li>
  );
}
