import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { AppLink, AppNavLink } from '@/app/nav';
import { useHandle } from '@/app/handle';
import { ZoneContent } from '@/app/layouts/ZoneContent';
import { paths } from '@/app/routes';
import { shortName, useSession } from '@/app/session/SessionProvider';
import { useLogout } from '@/app/session/useLogout';
import { logoUrl } from '@/assets/media';
import { Icon, type IconName } from '@/ui';
import { cx } from '@/lib/cx';
import s from './Shell.module.css';

type NavItem = { to: string; label: string; icon: IconName; end?: boolean; locked?: boolean };

export function useCustomerNav(): NavItem[] {
  const { me } = useSession();
  const unlinked = me?.kind === 'customer' && !me.linked;
  return [
    { to: paths.kh.home, label: 'Tổng quan', icon: 'house-heart', end: true },
    { to: paths.kh.pets, label: 'Thú cưng', icon: 'paw' },
    { to: paths.kh.appts, label: 'Lịch hẹn', icon: 'calendar-check' },
    { to: paths.kh.stays, label: 'Nội trú', icon: 'house-paw', locked: unlinked },
    { to: paths.kh.invoices, label: 'Hóa đơn', icon: 'receipt', locked: unlinked },
  ];
}

const lockedLabel = (n: NavItem) => (n.locked ? `${n.label} (mở sau khi liên kết hồ sơ)` : undefined);

/** Customer zone shell (customer §8.1): sidebar ≥ 993px; top bar + 5-item bottom bar below. */
export function CustomerShell() {
  const nav = useCustomerNav();
  const { me } = useSession();
  const { title } = useHandle();
  const logout = useLogout();
  const name = me?.name ?? '';
  const initial = name.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() || '·';
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    const onDoc = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDoc);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDoc); };
  }, [menu]);

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <AppLink to={paths.kh.home} className={s.brand}>
          <img src={logoUrl} alt="" width={44} height={40} />
          <span><span className={s.kicker}>Tài khoản</span><span className={s.brandName}>Lê Sơn</span></span>
        </AppLink>
        <nav aria-label="Khu khách hàng" className={s.sideNav}>
          {nav.map((n) => (
            <AppNavLink key={n.to} to={n.to} end={n.end} aria-label={lockedLabel(n)} className={({ isActive }) => cx(s.sideItem, isActive && s.active)}>
              <Icon name={n.icon} size={22} />
              <span>{n.label}</span>
              {n.locked && <Icon name="lock" size={12} className={s.lock} />}
            </AppNavLink>
          ))}
          <AppNavLink to={paths.kh.account} className={({ isActive }) => cx(s.sideItem, isActive && s.active)}>
            <Icon name="circle-user-round" size={22} /><span>Tài khoản</span>
          </AppNavLink>
        </nav>
        <div className={s.help}>
          <p className={s.helpTitle}>Cần hỗ trợ?</p>
          <a href="tel:+84973555105" className={s.helpTel}><Icon name="phone" size={18} /> 097 355 51 05</a>
          <p className={s.helpNote}><Icon name="heart-pulse" size={14} /> Cấp cứu 24/24</p>
        </div>
        <div className={s.sideFoot}>
          <AppLink to={paths.home} className={s.footLink}><Icon name="arrow-left" size={18} /> Trang chủ Lê Sơn</AppLink>
          <button type="button" className={s.footLink} onClick={() => void logout()}><Icon name="log-out" size={18} /> Đăng xuất</button>
        </div>
      </aside>

      <div className={s.body}>
        <header className={s.top}>
          <AppLink to={paths.kh.home} className={s.topLogo} aria-label="Tổng quan"><img src={logoUrl} alt="" width={40} height={36} /></AppLink>
          <span className={s.topTitle} aria-hidden="true">{title}</span>
          <AppLink to={paths.kh.account} className={s.accountChip}>
            <span className={s.ava} aria-hidden="true">{initial}</span>
            <span className={s.chipName}>{shortName(name)}</span>
          </AppLink>
          <div ref={menuRef} className={s.menuWrap}>
            <button type="button" className={s.avaBtn} aria-label={`Tài khoản của ${name}`} aria-expanded={menu} aria-haspopup="true" onClick={() => setMenu((o) => !o)}>
              <span className={s.ava} aria-hidden="true">{initial}</span>
            </button>
            <AnimatePresence>
              {menu && (
                <m.div className={s.menu} initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.18 }} onClick={(e) => { if ((e.target as HTMLElement).closest('a,button')) setMenu(false); }}>
                  <p className={s.menuName}>{name}</p>
                  <AppLink to={paths.kh.account} className={s.menuItem}><Icon name="circle-user-round" size={18} /> Tài khoản</AppLink>
                  <AppLink to={paths.home} className={s.menuItem}><Icon name="house" size={18} /> Trang chủ Lê Sơn</AppLink>
                  <a href="tel:+84973555105" className={s.menuItem}><Icon name="phone" size={18} /> Gọi 097 355 51 05</a>
                  <button type="button" className={cx(s.menuItem, s.danger)} onClick={() => void logout()}><Icon name="log-out" size={18} /> Đăng xuất</button>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main id="noi-dung" tabIndex={-1} className={s.main}>
          <ZoneContent className={s.page} />
        </main>
      </div>

      <nav aria-label="Khu khách hàng (thanh dưới)" className={s.bottom} data-bottom-bar>
        {nav.map((n) => (
          <AppNavLink key={n.to} to={n.to} end={n.end} aria-label={lockedLabel(n)} className={({ isActive }) => cx(s.tab, isActive && s.tabActive)}>
            <span className={s.tabIcon}><Icon name={n.icon} size={24} />{n.locked && <Icon name="lock" size={12} className={s.tabLock} />}</span>
            <span className={s.tabLabel}>{n.label}</span>
          </AppNavLink>
        ))}
      </nav>
    </div>
  );
}
