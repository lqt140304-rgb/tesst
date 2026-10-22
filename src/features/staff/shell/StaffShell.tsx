import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { AppLink, AppNavLink, useAppNavigate } from '@/app/nav';
import { useHandle } from '@/app/handle';
import { ZoneContent } from '@/app/layouts/ZoneContent';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { useLogout } from '@/app/session/useLogout';
import { Forbidden } from '@/app/system/System';
import { logoUrl } from '@/assets/media';
import { system } from '@/data/public';
import { staff } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { CAP_LABEL, CAPS, type Cap } from '@/data/rules/capabilities';
import { Button, DemoTag, Dialog, Icon, useToast, type IconName } from '@/ui';
import { cx } from '@/lib/cx';
import { useMedia } from '@/lib/useMedia';
import s from './Shell.module.css';

type NavItem = { key: string; to: string; label: string; short?: string; icon: IconName; cap?: Cap | Cap[]; end?: boolean };

const NAV: NavItem[] = [
  { key: 'home', to: paths.nv.home, label: 'Tổng quan', icon: 'layout-dashboard', end: true },
  { key: 'requests', to: paths.nv.requests, label: 'Yêu cầu đặt lịch', short: 'Yêu cầu', icon: 'inbox', cap: 'requests.handle' },
  { key: 'calendar', to: paths.nv.calendar, label: 'Lịch hẹn', icon: 'calendar-days', cap: 'appointments.view' },
  { key: 'customers', to: paths.nv.customers, label: 'Khách hàng', icon: 'users-round', cap: 'customers.view' },
  { key: 'accounts', to: paths.nv.accounts, label: 'Tài khoản web', icon: 'link-2', cap: 'accounts.link' },
  { key: 'board', to: paths.nv.board, label: 'Nội trú', icon: 'house-paw', cap: 'inpatient.view' },
  { key: 'invoices', to: paths.nv.invoices, label: 'Hóa đơn', icon: 'receipt', cap: ['invoices.create', 'payments.record'] },
  { key: 'stock', to: paths.nv.stock, label: 'Kho', icon: 'package', cap: 'stock.view' },
  { key: 'prices', to: paths.nv.prices, label: 'Bảng giá', icon: 'tags' },
  { key: 'reports', to: paths.nv.reports, label: 'Báo cáo', icon: 'activity', cap: 'reports.operations' },
  { key: 'revenue', to: paths.nv.revenue, label: 'Doanh thu', icon: 'chart-column', cap: 'reports.revenue' },
  { key: 'settings', to: paths.nv.settings, label: 'Cài đặt', icon: 'settings' },
];
const TAB_FIRST = ['home', 'requests', 'calendar', 'board'];

/** Open requests for the nav badge; pops a toast when a new request or a call-back flag arrives (staff §4.1 live hook). */
function useQueueBadge(enabled: boolean) {
  const q = useQuery(() => (enabled ? staff.requests.list({ tab: 'can_xu_ly' }) : Promise.resolve([])), [enabled]);
  const toast = useToast();
  const navigate = useAppNavigate();
  const seen = useRef<{ ids: Set<string>; flags: Set<string> } | null>(null);
  const rows = q.data;
  useEffect(() => {
    // No baseline until the session's capabilities are known, so the first real list never reads as "new".
    if (!rows || !enabled) { seen.current = null; return; }
    const ids = new Set(rows.map((r) => r.id));
    const flags = new Set(rows.filter((r) => r.flaggedAt).map((r) => r.id));
    const prev = seen.current;
    seen.current = { ids, flags };
    if (!prev) return;
    const fresh = rows.find((r) => !prev.ids.has(r.id) && r.status === 'pending');
    const flagged = rows.find((r) => r.flaggedAt && !prev.flags.has(r.id));
    const hit = flagged ?? fresh;
    if (hit) {
      toast({
        tone: 'info',
        message: flagged ? `Khách vừa gửi lại — cần gọi lại · ${hit.code}` : `Có yêu cầu đặt lịch mới · ${hit.code}`,
        action: { label: 'Xem', onClick: () => navigate(paths.nv.request(hit.id)) },
      });
    }
  }, [rows, enabled, toast, navigate]);
  return { count: rows?.length ?? 0, flagged: !!rows?.some((r) => r.flaggedAt) };
}

/** Staff zone shell (staff §2): dark plum sidebar ≥ 1024 px, icon rail 768–1023 px, top bar + tab bar + "Thêm" sheet below. */
export function StaffShell() {
  const { me, can, meLoaded } = useSession();
  const { title, cap } = useHandle();
  const nav = NAV.filter((n) => !n.cap || can(n.cap));
  const badge = useQueueBadge(can('requests.handle'));
  // Rendered only on phones, so the global demo chip lifts above it there and not beside the sidebar.
  const phone = useMedia('(max-width: 767px)');
  const [more, setMore] = useState(false);
  const [perms, setPerms] = useState(false);
  const [reset, setReset] = useState(false);

  const tabs = [...nav.filter((n) => TAB_FIRST.includes(n.key)), ...nav.filter((n) => !TAB_FIRST.includes(n.key))].slice(0, 4);
  const rest = nav.filter((n) => !tabs.includes(n));
  const blocked = meLoaded && cap !== undefined && !can(cap);
  const name = me?.kind === 'staff' ? me.name : '';
  const role = me?.kind === 'staff' ? me.title : '';

  const badgeFor = (n: NavItem) => n.key === 'requests' && badge.count > 0
    ? <span className={cx(s.badge, badge.flagged && s.badgeFlag)} aria-label={`${badge.count} yêu cầu cần xử lý${badge.flagged ? ', có khách cần gọi lại' : ''}`}>{badge.count}</span>
    : null;

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <AppLink to={paths.nv.home} className={s.brand} aria-label="Khu nhân viên Lê Sơn – Tổng quan">
          <img src={logoUrl} alt="" width={40} height={36} />
          <span className={s.brandText}><span className={s.kicker}>Khu nhân viên</span><span className={s.brandName}>Lê Sơn</span></span>
        </AppLink>
        <nav aria-label="Khu nhân viên" className={s.sideNav}>
          {nav.map((n) => (
            <AppNavLink key={n.key} to={n.to} end={n.end} title={n.label} className={({ isActive }) => cx(s.sideItem, isActive && s.active)}>
              <Icon name={n.icon} size={20} />
              <span className={s.sideLabel}>{n.label}</span>
              {badgeFor(n)}
            </AppNavLink>
          ))}
        </nav>
        <div className={s.sideFoot}>
          <ProfileMenu name={name} role={role} placement="up" onPerms={() => setPerms(true)} onReset={() => setReset(true)} />
        </div>
      </aside>

      <div className={s.body}>
        <header className={s.top}>
          <AppLink to={paths.nv.home} className={s.topLogo} aria-label="Tổng quan"><img src={logoUrl} alt="" width={36} height={32} /></AppLink>
          <span className={s.topTitle} aria-hidden="true">{title}</span>
          <ProfileMenu name={name} role={role} placement="down" compact onPerms={() => setPerms(true)} onReset={() => setReset(true)} />
        </header>
        <main id="noi-dung" tabIndex={-1} className={s.main}>
          {!meLoaded ? null : blocked ? <Forbidden home={paths.nv.home} /> : <ZoneContent className={s.page} distance={4} />}
        </main>
      </div>

      {phone && <nav aria-label="Khu nhân viên (thanh dưới)" className={s.bottom} data-bottom-bar>
        {tabs.map((n) => (
          <AppNavLink key={n.key} to={n.to} end={n.end} className={({ isActive }) => cx(s.tab, isActive && s.tabActive)}>
            <span className={s.tabIcon}><Icon name={n.icon} size={22} />{badgeFor(n)}</span>
            <span className={s.tabLabel}>{n.short ?? n.label}</span>
          </AppNavLink>
        ))}
        <button type="button" className={s.tab} onClick={() => setMore(true)} aria-haspopup="dialog">
          <span className={s.tabIcon}><Icon name="grid-2x2" size={22} /></span>
          <span className={s.tabLabel}>Thêm</span>
        </button>
      </nav>}

      <Dialog open={more} onClose={() => setMore(false)} title="Thêm">
        <nav aria-label="Các mục khác" className={s.moreList} onClick={(e) => { if ((e.target as HTMLElement).closest('a')) setMore(false); }}>
          {rest.map((n) => (
            <AppLink key={n.key} to={n.to} className={s.moreItem}><Icon name={n.icon} size={20} />{n.label}</AppLink>
          ))}
          <button type="button" className={s.moreItem} onClick={() => { setMore(false); setPerms(true); }}><Icon name="shield-user" size={20} />Quyền của tôi</button>
        </nav>
      </Dialog>
      <PermsDialog open={perms} onClose={() => setPerms(false)} />
      <ResetDialog open={reset} onClose={() => setReset(false)} />
    </div>
  );
}

function ProfileMenu({ name, role, placement, compact, onPerms, onReset }: {
  name: string; role: string; placement: 'up' | 'down'; compact?: boolean; onPerms: () => void; onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const logout = useLogout();
  const initial = name.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() || '·';
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); } };
    const onDoc = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDoc);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDoc); };
  }, [open]);
  const pick = (fn: () => void) => () => { setOpen(false); fn(); };
  return (
    <div ref={wrap} className={cx(s.profile, compact && s.profileCompact)}>
      <button ref={btn} type="button" className={s.userChip} aria-label={`Tài khoản của ${name}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className={s.ava} aria-hidden="true">{initial}</span>
        {!compact && (
          <span className={s.userText} aria-hidden="true">
            <span className={s.userName}>{name}</span>
            <span className={s.userRole}>{role} <span className={s.sample}>Mẫu</span></span>
          </span>
        )}
        {!compact && <Icon name="chevron-up" size={16} className={s.userCaret} />}
      </button>
      <AnimatePresence>
        {open && (
          <m.div role="menu" aria-label="Tài khoản" className={cx(s.menu, placement === 'up' ? s.menuUp : s.menuDown)}
            initial={{ opacity: 0, y: placement === 'up' ? 6 : -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.18 }}>
            <p className={s.menuHead}><strong>{name}</strong><span>{role} · Tài khoản mẫu</span></p>
            <button type="button" role="menuitem" className={s.menuItem} onClick={pick(onPerms)}><Icon name="shield-user" size={18} />Quyền của tôi</button>
            <button type="button" role="menuitem" className={s.menuItem} onClick={pick(onReset)}><Icon name="rotate-ccw" size={18} />Khôi phục dữ liệu mẫu</button>
            <AppLink to={paths.home} role="menuitem" className={s.menuItem} onClick={() => setOpen(false)}><Icon name="house" size={18} />Trang chủ Lê Sơn</AppLink>
            <button type="button" role="menuitem" className={cx(s.menuItem, s.danger)} onClick={pick(() => void logout())}><Icon name="log-out" size={18} />Đăng xuất</button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** "Quyền của tôi": the capability model made visible without a staff-admin screen (staff §1.3). */
function PermsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { me, can } = useSession();
  if (me?.kind !== 'staff') return null;
  return (
    <Dialog open={open} onClose={onClose} title="Quyền của tôi"
      intro={<>Nhóm quyền: <strong>{me.presets.join(', ')}</strong>. Mỗi màn hình và thao tác kiểm tra theo quyền, không theo chức danh.</>}
      footer={<Button onClick={onClose}>Đã hiểu</Button>}>
      <ul className={s.perms}>
        {CAPS.filter((c) => can(c)).map((c) => <li key={c}><Icon name="check" size={16} />{CAP_LABEL[c]}</li>)}
      </ul>
      <DemoTag>Tài khoản mẫu</DemoTag>
    </Dialog>
  );
}

function ResetDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const navigate = useAppNavigate();
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onClose={onClose} title="Khôi phục dữ liệu mẫu?"
      intro="Mọi thay đổi trong bản demo trên trình duyệt này sẽ được xóa và dữ liệu mẫu được tạo lại theo ngày hôm nay. Bạn sẽ được đăng xuất."
      footer={<>
        <Button variant="ghost" onClick={onClose}>Để sau</Button>
        <Button icon="rotate-ccw" loading={busy} onClick={async () => {
          setBusy(true);
          await system.resetDemo();
          setBusy(false);
          onClose();
          navigate(paths.loginStaff);
          toast({ message: 'Đã đưa dữ liệu mẫu về trạng thái ban đầu.' });
        }}>Khôi phục</Button>
      </>} />
  );
}
