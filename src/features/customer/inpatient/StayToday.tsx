import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { petPhoto } from '@/assets/media';
import { customer, type CustomerStayCard, type CustomerVideo } from '@/data/customer';
import { useMediaUrls } from '@/data/hooks/useMediaUrls';
import { useQuery } from '@/data/hooks/useQuery';
import { system } from '@/data/public';
import { NotLinkedError } from '@/data/contracts/errors';
import { DIARY_CATEGORY_LABEL, PART_OF_DAY_LABEL } from '@/data/contracts/enums';
import { dayOf, formatDateVi } from '@/lib/dates';
import { cx } from '@/lib/cx';
import { ButtonAnchor, EmptyState, Icon, StatusPill, VideoPlayer, statusPill } from '@/ui';
import { LockedPage } from '../locked/LockedPage';
import { HOTLINE, LoadingBlocks, PageHeader, PageProblem, TEL } from '../ui';
import { clampDay, dayRange, stepDay } from './days';
import o from './Today.module.css';

const clock = (sec: number) => (sec > 0 ? `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}` : '—');

/** The pet's newest stay, a current one first. */
const newest = (stays: CustomerStayCard[]) => [...stays].sort((a, b) => Number(b.current) - Number(a.current) || b.admittedAt.localeCompare(a.admittedAt))[0]!;

/** `#/khach-hang/noi-tru[/:stayId]` — "Hôm nay của bé": pick a pet and a day; that day's video and diary (spec 2026-10-21 §3.6). */
export function StayToday({ stayId }: { stayId?: string }) {
  const q = useQuery(() => customer.stays.list(), []);
  const [pickId, setPickId] = useState(stayId);
  if (q.error instanceof NotLinkedError) return <LockedPage kind="stays" />;
  if (q.error) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <><PageHeader title="Nội trú" /><LoadingBlocks /></>;
  const all = [...q.data.current, ...q.data.past];
  if (all.length === 0) {
    return (
      <>
        <PageHeader title="Nội trú" />
        <EmptyState icon="house-paw" title="Hiện không có bé nào đang nội trú" body="Khi bé ở lại Lê Sơn, nhật ký chăm sóc và video của bé sẽ hiện ở đây." />
      </>
    );
  }
  const stay = all.find((s) => s.id === pickId) ?? (stayId ? undefined : newest(all));
  if (!stay) return <PageProblem error={new Error('Không tìm thấy lượt nội trú này.')} onRetry={q.refetch} />;
  const pets = [...new Set(all.map((s) => s.petName))].map((name) => newest(all.filter((s) => s.petName === name)));
  const earlier = all.filter((s) => s.id !== stay.id);
  return (
    <StayDay key={stay.id} stay={stay} pets={pets} earlier={earlier} onPet={(id) => setPickId(id)} />
  );
}

function StayDay({ stay, pets, earlier, onPet }: { stay: CustomerStayCard; pets: CustomerStayCard[]; earlier: CustomerStayCard[]; onPet: (id: string) => void }) {
  const q = useQuery(() => customer.stays.get(stay.id), [stay.id]);
  const [params, setParams] = useSearchParams();
  const [videoId, setVideoId] = useState<string>();
  const today = dayOf(system.now());
  const start = stay.admittedAt;
  const end = stay.dischargedAt && stay.dischargedAt < today ? stay.dischargedAt : today;
  const day = clampDay(params.get('ngay'), start, end);
  const goTo = (d: string) => { setVideoId(undefined); setParams(d === end ? {} : { ngay: d }, { replace: true }); };
  const first = dayRange(start, end)[0]!;

  const entries = q.data?.diary.filter((e) => e.date === day) ?? [];
  const videos = q.data?.videos.filter((v) => v.date === day) ?? [];
  const video = videos.find((v) => v.id === videoId) ?? videos[0];
  const isToday = day === today;
  const title = stay.current ? `Hôm nay của ${stay.petName}` : `Nhật ký của ${stay.petName}`;
  const photo = stay.photoKey ? petPhoto(stay.photoKey, 'card') : undefined;

  return (
    <>
      <section className={o.band} aria-labelledby="stay-title">
        <div>
          <h1 id="stay-title" tabIndex={-1} className={o.h1}>{title}</h1>
          <p className={o.sub}>Cập nhật tình trạng và sinh hoạt hằng ngày của bé trong thời gian nội trú.</p>
          <div className={o.status}>
            {stay.latestStatus && <StatusPill pill={statusPill('general', stay.latestStatus)} />}
            <span className="sr-only">{stay.current ? 'Đang nội trú' : 'Đã về nhà'}</span>
            <span className={o.tag}>{stay.current ? `Ngày thứ ${stay.dayNumber}` : `Đã về nhà ${stay.dischargedAt ? formatDateVi(`${stay.dischargedAt}T12:00:00+07:00`) : ''}`}</span>
          </div>
        </div>
        {photo && <figure className={o.photo}><img src={photo} alt="" width={220} height={130} /></figure>}
      </section>

      {stay.latestStatus === 'want_to_talk' && (
        <div className={o.talk} role="note">
          <Icon name="phone" size={20} />
          <p>Lê Sơn muốn trao đổi thêm với bạn về bé. Bạn gọi {HOTLINE} khi có thể nhé.</p>
          <ButtonAnchor href={TEL} size="sm" icon="phone">Gọi Lê Sơn</ButtonAnchor>
        </div>
      )}

      <div className={o.pick}>
        <label className={o.field}>
          <span>Chọn thú cưng</span>
          <select value={pets.find((p) => p.petName === stay.petName)?.id} onChange={(e) => onPet(e.target.value)}>
            {pets.map((p) => <option key={p.id} value={p.id}>{p.petName}</option>)}
          </select>
        </label>
        <div className={o.field}>
          <label htmlFor="stay-day"><span>Chọn ngày</span></label>
          <span className={o.days}>
            <button type="button" className={o.arrow} aria-label="Ngày trước" disabled={day <= first} onClick={() => goTo(stepDay(day, -1, start, end))}><Icon name="chevron-left" size={20} /></button>
            <input id="stay-day" type="date" value={day} min={start} max={end} onChange={(e) => goTo(clampDay(e.target.value, start, end))} />
            <button type="button" className={o.arrow} aria-label="Ngày sau" disabled={day >= end} onClick={() => goTo(stepDay(day, 1, start, end))}><Icon name="chevron-right" size={20} /></button>
          </span>
        </div>
      </div>

      {q.error ? <PageProblem error={q.error} onRetry={q.refetch} /> : !q.data ? <LoadingBlocks rows={2} /> : (
        <div className={o.grid} data-video={video ? '' : undefined}>
          {video && (
            <section className={o.box} aria-label="Video của ngày" data-video-main>
              <VideoBlock video={video} />
              <ul className={o.thumbs}>
                {videos.map((v) => <li key={v.id}><VideoThumb v={v} on={v.id === video.id} onPick={() => setVideoId(v.id)} /></li>)}
              </ul>
              <div className={o.meta}>
                <StatusPill pill={statusPill('expiry', video.daysLeft)} dense />
                {video.isLocal && <span className={o.tag}>Chỉ lưu trên trình duyệt này</span>}
              </div>
              <p className={o.meta}><Icon name="info" size={16} /> Video được lưu trong 60 ngày · còn {video.daysLeft} ngày (đến hết ngày {video.expiresDate}).</p>
            </section>
          )}
          <section className={o.box} data-diary aria-labelledby="diary-title">
            <h2 id="diary-title" className={o.h2}>{isToday ? 'Nhật ký hôm nay' : `Nhật ký ngày ${formatDateVi(`${day}T12:00:00+07:00`)}`}</h2>
            {entries.length === 0 ? <p className={o.none}>Lê Sơn chưa cập nhật nhật ký ngày này.</p> : (
              <ol className={o.entries}>
                {entries.map((e) => (
                  <li key={e.id} className={o.entry}>
                    <span className={o.dot} aria-hidden="true" />
                    <div>
                      <p className={o.part}><span>{PART_OF_DAY_LABEL[e.part_of_day]}</span> <StatusPill pill={statusPill('general', e.general_status)} dense /></p>
                      <p className={o.cat}>{DIARY_CATEGORY_LABEL[e.category]}</p>
                      <p className={o.text}>{e.text}</p>
                      <p className={o.by}>Lê Sơn</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}

      <section className={o.together} data-card="together" aria-labelledby="together-title">
        <figure><img src={petPhoto('meo-trang-ngu', 'card')} alt="" width={240} height={150} loading="lazy" /></figure>
        <div>
          <p className={cx('t-upper', o.eyebrow)}>Bệnh viện Thú y Lê Sơn</p>
          <h2 id="together-title" className={o.h2}>Luôn đồng hành cùng bé</h2>
          <p className={o.text}>Nếu bạn có bất kỳ thắc mắc nào về tình trạng của bé, đừng ngần ngại liên hệ với Lê Sơn.</p>
          <ButtonAnchor href={TEL} variant="secondary" icon="phone">Liên hệ bệnh viện</ButtonAnchor>
        </div>
      </section>

      {earlier.length > 0 && (
        <section aria-labelledby="past-title" className={o.box}>
          <h2 id="past-title" className={o.h2}>Các lần nội trú khác</h2>
          <ul className={o.past}>
            {earlier.map((s) => (
              <li key={s.id}>
                <AppLink to={paths.kh.stay(s.id)}>Bé {s.petName} · {formatDateVi(`${s.admittedAt}T12:00:00+07:00`)}{s.dischargedAt ? ` – ${formatDateVi(`${s.dischargedAt}T12:00:00+07:00`)}` : ' · đang nội trú'}</AppLink>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function VideoBlock({ video }: { video: CustomerVideo }) {
  const m = useMediaUrls(video.mediaKey);
  return (
    <div className={o.player}>
      {m.urls
        ? <VideoPlayer key={video.id} src={m.urls.mp4} poster={m.urls.poster} label={`Video bé ${video.petName}, ${video.whenLabel.toLowerCase()}`} />
        : <p className={o.missing}>{m.loading ? 'Đang tải…' : 'Video này đã hết thời gian lưu (60 ngày).'}</p>}
    </div>
  );
}

function VideoThumb({ v, on, onPick }: { v: CustomerVideo; on: boolean; onPick: () => void }) {
  const m = useMediaUrls(v.mediaKey);
  return (
    <button type="button" data-video-thumb className={o.thumb} aria-current={on ? 'true' : undefined} onClick={onPick}
      aria-label={`Xem video: bé ${v.petName} · ${v.whenLabel.toLowerCase()}`}>
      {m.urls?.thumb && <img src={m.urls.thumb} alt="" loading="lazy" />}
      <span className={o.dur}>{clock(v.durationS)}</span>
    </button>
  );
}
