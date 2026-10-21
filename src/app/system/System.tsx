import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useLocation } from 'react-router';
import { system } from '@/data/public';
import { Button, ButtonLink, Dialog, Icon, useToast } from '@/ui';
import { formatDateVi } from '@/lib/dates';
import { browserStore, DEFAULT_PRESET, isDeviceFrame, writeMode } from '../device/devices';
const DevicePreview = lazy(() => import('../device/DevicePreview').then((m) => ({ default: m.DevicePreview })));
import { AppLink, useAppNavigate } from '../nav';
import { ALIASES, paths } from '../routes';
import s from './System.module.css';

export function NotFoundOrAlias() {
  const loc = useLocation();
  const alias = ALIASES[loc.pathname.replace(/^\//, '')];
  if (alias) return <Navigate to={alias} replace />;
  return (
    <main className={s.center} id="noi-dung">
      <div className={s.box}>
        <span className={s.art}><Icon name="paw-line" size={64} /></span>
        <h1 className={s.title} tabIndex={-1}>Không tìm thấy trang này</h1>
        <p className={s.body}>Có thể đường dẫn đã thay đổi. Bạn quay về trang chủ để tiếp tục nhé.</p>
        <ButtonLink to={paths.home} icon="house">Về trang chủ</ButtonLink>
      </div>
    </main>
  );
}

export function Forbidden({ home }: { home: string }) {
  return (
    <div className={s.center}>
      <div className={s.box}>
        <span className={s.art}><Icon name="lock" size={56} /></span>
        <h1 className={s.title} tabIndex={-1}>Mục này dành cho người có quyền phù hợp</h1>
        <p className={s.body}>Nếu bạn cần dùng, hãy nhờ quản lý cấp quyền.</p>
        <ButtonLink to={home} icon="layout-dashboard">Về Tổng quan</ButtonLink>
      </div>
    </div>
  );
}

export function RouteError() {
  return (
    <main className={s.center}>
      <div className={s.box}>
        <span className={s.art}><Icon name="yarn-ball" size={64} /></span>
        <h1 className={s.title}>Có chút trục trặc</h1>
        <p className={s.body}>Trang chưa hiển thị được. Bạn tải lại trang giúp Lê Sơn nhé.</p>
        <Button onClick={() => location.reload()} icon="refresh-cw">Tải lại trang</Button>
      </div>
    </main>
  );
}

/** True while a text field has focus, so on a phone the chip stays clear of the open keyboard (review 21/10). */
function useTyping() {
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const field = (t: EventTarget | null) => t instanceof HTMLElement && (t.matches('textarea, select') || (t instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit'].includes(t.type)));
    const on = (e: FocusEvent) => setTyping(field(e.target));
    const off = () => setTyping(false);
    document.addEventListener('focusin', on);
    document.addEventListener('focusout', off);
    return () => { document.removeEventListener('focusin', on); document.removeEventListener('focusout', off); };
  }, []);
  return typing;
}

/** One global honest marker for the demo, with a small menu: reset data, icon sheet, per-browser note (R26). */
export function DemoChip() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  // "Xem như…": opened over the app so it works even where the browser blocks storage (a sandboxed host such as an Artifact).
  const [preview, setPreview] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const typing = useTyping();
  const toast = useToast();
  const navigate = useAppNavigate();
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div className={s.chipWrap} ref={wrap} data-typing={typing || undefined}>
      {open && (
        <div className={s.menu} role="menu" aria-label="Bản demo">
          <p className={s.menuNote}>Đây là bản demo với dữ liệu mẫu. Dữ liệu mẫu lưu riêng trên từng trình duyệt.</p>
          <button type="button" role="menuitem" className={s.menuItem} onClick={() => { setOpen(false); setConfirm(true); }}>
            <Icon name="rotate-ccw" size={18} /> Khôi phục dữ liệu mẫu
          </button>
          {!isDeviceFrame() && (['pc', 'mobile'] as const).map((k) => (
            <button key={k} type="button" role="menuitem" className={s.menuItem} onClick={() => { writeMode(browserStore(), { kind: k, presetId: DEFAULT_PRESET[k] }); setOpen(false); setPreview(DEFAULT_PRESET[k]); }}>
              <Icon name={k === 'pc' ? 'layout-dashboard' : 'phone'} size={18} /> {k === 'pc' ? 'Xem như máy tính' : 'Xem như điện thoại'}
            </button>
          ))}
          <AppLink to={paths.icons} role="menuitem" className={s.menuItem} onClick={() => setOpen(false)}>
            <Icon name="paw-line" size={18} /> Xem bộ icon
          </AppLink>
          <AppLink to={paths.uiGallery} role="menuitem" className={s.menuItem} onClick={() => setOpen(false)}>
            <Icon name="layout-dashboard" size={18} /> Xem bộ giao diện
          </AppLink>
        </div>
      )}
      <button type="button" className={s.chip} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="info" size={16} /> <span className={s.chipText}>Bản demo · dữ liệu mẫu</span>
      </button>
      {preview && createPortal(
        <Suspense fallback={null}>
          <DevicePreview presetId={preview} onExit={(hash) => { setPreview(null); if (hash && hash !== location.hash) location.hash = hash; }} />
        </Suspense>,
        document.body,
      )}
      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Khôi phục dữ liệu mẫu?"
        intro="Mọi thay đổi bạn đã thử trên trình duyệt này sẽ được xóa và bạn sẽ được đăng xuất."
        footer={<>
          <Button variant="ghost" onClick={() => setConfirm(false)}>Để sau</Button>
          <Button variant="primary" icon="rotate-ccw" onClick={async () => {
            await system.resetDemo();
            setConfirm(false);
            navigate(paths.home);
            toast({ message: 'Đã đưa dữ liệu mẫu về trạng thái ban đầu.' });
          }}>Khôi phục</Button>
        </>} />
    </div>
  );
}

/** Storage fallback / stale-data banners (tech §8.2). */
export function StorageBanner() {
  const rev = useSyncExternalStore(system.subscribe, system.rev);
  const st = system.storageStatus();
  const toast = useToast();
  void rev;
  if (!st.persistent) {
    return <div className={s.storage} role="status"><strong>Bản demo không lưu được trên trình duyệt này.</strong> Mọi thay đổi sẽ mất khi bạn tải lại trang.</div>;
  }
  if (st.needsRefresh) {
    return (
      <div className={s.storage} role="status">
        Dữ liệu mẫu được tạo ngày {formatDateVi(`${st.seededAt}T12:00:00+07:00`)}. Khôi phục để cập nhật theo hôm nay?
        <button type="button" onClick={async () => { await system.resetDemo(); toast({ message: 'Đã đưa dữ liệu mẫu về trạng thái ban đầu.' }); }}>Khôi phục</button>
      </div>
    );
  }
  return null;
}
