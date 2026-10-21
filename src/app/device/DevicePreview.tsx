import { useEffect, useMemo, useRef, useState } from 'react';
import { browserStore, DEFAULT_PRESET, DEVICE_PRESETS, FRAME_NAME, fitScale, presetOf, writeMode, type DeviceKind, type DevicePreset } from './devices';
import s from './DevicePreview.module.css';

const TOOLBAR_H = 64;
const GAP = 16;
const BEZEL = 12; // phone body around the screen
const READY_MS = 6000;

const KIND_LABEL: Record<DeviceKind, string> = { pc: 'Máy tính', mobile: 'Điện thoại' };

/**
 * The demo inside a frame of a chosen screen size. The app runs in an iframe because its layout follows the window width
 * (media queries): shrinking a picture of the page would not show the phone layout. The page inside tells us when it is up
 * (`ready`) and where it is (`hash`), by postMessage so it also works when the host page is itself framed.
 */
export function DevicePreview({ presetId, onExit }: { presetId: string; onExit?: (lastHash?: string) => void }) {
  // `onExit` = opened over the running app (from the chip); without it the page is only this shell (a remembered size at load).
  const overlay = !!onExit;
  const [preset, setPreset] = useState<DevicePreset>(() => presetOf(presetId) ?? presetOf(DEFAULT_PRESET.pc)!);
  const [avail, setAvail] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const [ready, setReady] = useState(false);
  const [late, setLate] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const lastHash = useRef<string | undefined>(undefined);
  // Fixed for the life of the page: changing `src` would reload the app inside.
  const [src] = useState(() => location.href);

  useEffect(() => {
    const onResize = () => setAvail({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const d = e.data as { leson?: string; hash?: string } | null;
      if (d?.leson === 'device-frame-ready') setReady(true);
      if (d?.leson === 'device-frame-hash' && typeof d.hash === 'string') {
        lastHash.current = d.hash;
        // Alone on the page, the address keeps the place so a reload returns to it; over the app, closing hands it back instead.
        if (!overlay) { try { history.replaceState(null, '', d.hash || '#/'); } catch { /* sandboxed host: the place is not remembered */ } }
      }
    };
    window.addEventListener('message', onMessage);
    const t = setTimeout(() => setLate(true), READY_MS);
    return () => { window.removeEventListener('message', onMessage); clearTimeout(t); };
  }, [overlay]);

  // Over the running app: the app underneath is out of reach (no focus, no scroll) while the view is open.
  useEffect(() => {
    if (!overlay) return;
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { root?.removeAttribute('inert'); document.body.style.overflow = overflow; };
  }, [overlay]);

  const body = preset.kind === 'mobile' ? BEZEL : 0;
  const total = { width: preset.width + 2 * body, height: preset.height + 2 * body };
  const scale = useMemo(
    () => fitScale({ width: avail.width - 2 * GAP, height: avail.height - TOOLBAR_H - 2 * GAP }, total),
    [avail, total.width, total.height], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const percent = Math.round(scale * 100);

  const choose = (id: string) => {
    const p = presetOf(id);
    if (!p) return;
    setPreset(p);
    writeMode(browserStore(), { kind: p.kind, presetId: p.id });
  };
  const exit = () => {
    writeMode(browserStore(), { kind: 'auto' });
    if (onExit) onExit(lastHash.current);
    else location.reload();
  };

  return (
    <div className={`${s.shell} ${overlay ? s.overlay : ''}`} data-device-shell>
      <div className={s.bar} role="toolbar" aria-label="Xem như">
        <div className={s.kinds}>
          {(['pc', 'mobile'] as const).map((k) => (
            <button key={k} type="button" className={s.kind} aria-pressed={preset.kind === k} onClick={() => choose(DEFAULT_PRESET[k])}>{KIND_LABEL[k]}</button>
          ))}
        </div>
        <label className={s.size}>
          <span>Cỡ màn hình</span>
          <select value={preset.id} onChange={(e) => choose(e.target.value)}>
            {DEVICE_PRESETS.filter((p) => p.kind === preset.kind).map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <span className={s.scale} role="status">{scale < 1 ? `Thu nhỏ còn ${percent}% cho vừa cửa sổ` : 'Hiện đúng cỡ'}</span>
        <button type="button" className={s.exit} onClick={exit}>Xem bình thường</button>
      </div>
      {late && !ready && (
        <p className={s.late} role="status">Khung xem chưa mở được ở đây. Bạn bấm "Xem bình thường", hoặc mở bản đầy đủ của trang để dùng tính năng này.</p>
      )}
      <div className={s.stage}>
        <div className={s.fit} style={{ width: total.width * scale, height: total.height * scale }}>
          <div className={s.device} data-kind={preset.kind} style={{ width: total.width, height: total.height, padding: body, transform: `scale(${scale})` }}>
            <iframe ref={frame} className={s.screen} name={FRAME_NAME} src={src} width={preset.width} height={preset.height}
              title={`Bản demo — ${KIND_LABEL[preset.kind].toLowerCase()} ${preset.width} × ${preset.height}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
