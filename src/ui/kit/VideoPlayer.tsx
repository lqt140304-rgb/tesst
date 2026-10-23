import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons/Icon';
import { clipLimit, shouldStop } from './videoClip';
import s from './VideoPlayer.module.css';

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

/**
 * Inpatient video player: always muted (audio removed by rule), plays inline, no volume control,
 * custom controls; falls back to fetch → blob URL if the direct URL fails (Artifact host).
 * `clipEnd`: seconds where playback stops (owner's rule: viewers see the first 15 seconds of a longer video); it pauses there and cannot be seeked past.
 */
export function VideoPlayer({ src, poster, label, autoPlay, clipEnd }: { src: string; poster?: string; label: string; autoPlay?: boolean; clipEnd?: number }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [url, setUrl] = useState(src);
  const [failed, setFailed] = useState(false);
  const triedBlob = useRef(false);
  const limit = clipLimit(duration, clipEnd);

  useEffect(() => {
    if (url.startsWith('blob:')) return () => URL.revokeObjectURL(url);
  }, [url]);

  async function onError() {
    if (triedBlob.current) return setFailed(true);
    triedBlob.current = true;
    try {
      const blob = await (await fetch(src)).blob();
      setUrl(URL.createObjectURL(blob));
    } catch {
      setFailed(true);
    }
  }

  function toggle() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      if (shouldStop(v.currentTime, limit)) v.currentTime = 0; // played to the end of the clip: start again
      void v.play();
    } else v.pause();
  }

  return (
    <div className={s.wrap}>
      <video
        ref={ref} className={s.video} src={url} poster={poster} muted playsInline preload="metadata" autoPlay={autoPlay} aria-label={label}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (shouldStop(v.currentTime, limit)) { v.pause(); v.currentTime = limit; }
          setTime(Math.min(v.currentTime, limit || v.currentTime));
        }} onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onVolumeChange={(e) => { e.currentTarget.muted = true; }} onError={() => void onError()} onClick={toggle}
      />
      <span className={s.chip}><Icon name="volume-x" size={14} /> Không có âm thanh</span>
      {failed ? (
        <div className={s.error}>Video này chưa phát được trên trình duyệt của bạn. Bạn thử tải lại trang nhé.</div>
      ) : (
        <div className={s.controls}>
          <button type="button" className={s.btn} onClick={toggle} aria-label={playing ? 'Tạm dừng video' : 'Phát video'}>
            <Icon name={playing ? 'pause' : 'play'} size={18} />
          </button>
          <input className={s.range} type="range" min={0} max={limit} step={0.1} value={time} aria-label="Tua video"
            onChange={(e) => { if (ref.current) ref.current.currentTime = Math.min(Number(e.target.value), limit || Number(e.target.value)); }} />
          <span className={s.time}>{fmt(time)} / {fmt(limit)}</span>
          <button type="button" className={s.btn} aria-label="Toàn màn hình" onClick={() => void ref.current?.requestFullscreen?.().catch(() => {})}>
            <Icon name="maximize" size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
