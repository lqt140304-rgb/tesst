import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { useLocation } from 'react-router';
import { AppLink } from '@/app/nav';
import { paths, type SectionId } from '@/app/routes';
import { shortName, useSession } from '@/app/session/SessionProvider';
import { useLogout } from '@/app/session/useLogout';
import { logoUrl } from '@/assets/media';
import { Icon } from '@/ui';
import { cx } from '@/lib/cx';
import { spring } from '@/ui/motion';
import s from './PublicHeader.module.css';

const NAV: { label: string; to: string; section?: SectionId | 'home' }[] = [
  { label: 'Trang chủ', to: paths.home, section: 'home' },
  { label: 'Dịch vụ', to: paths.section('dich-vu'), section: 'dich-vu' },
  { label: 'Giới thiệu', to: paths.section('gioi-thieu'), section: 'gioi-thieu' },
  { label: 'Liên hệ', to: paths.section('lien-he'), section: 'lien-he' },
];

/** Scroll-spy: which homepage section is in view. */
function useActiveSection(): string {
  const loc = useLocation();
  const [active, setActive] = useState('home');
  useEffect(() => {
    if (loc.pathname === paths.icons) return;
    const ids = ['dich-vu', 'dat-lich', 'gioi-thieu', 'tai-khoan-khach-hang', 'lien-he'];
    const onScroll = () => {
      let current = 'home';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) current = id;
      }
      setActive(current === 'dat-lich' ? 'dich-vu' : current === 'tai-khoan-khach-hang' ? 'gioi-thieu' : current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [loc.pathname]);
  return active;
}

export function PublicHeader() {
  const { session, me } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const active = useActiveSection();
  const signOut = useLogout();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Locked menu behaviour: Esc closes and returns focus, outside click closes, link click closes.
  useEffect(() => {
    if (!menuOpen && !userOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (menuOpen) { setMenuOpen(false); menuBtn.current?.focus(); }
      setUserOpen(false);
    };
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuOpen && !menuRef.current?.contains(t) && !menuBtn.current?.contains(t)) setMenuOpen(false);
      if (userOpen && !userRef.current?.contains(t)) setUserOpen(false);
    };
    const onResize = () => { if (window.innerWidth >= 993) setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('resize', onResize);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDoc); window.removeEventListener('resize', onResize); };
  }, [menuOpen, userOpen]);

  async function logout() {
    setMenuOpen(false);
    setUserOpen(false);
    await signOut();
  }

  const name = me?.name ?? '';
  const isCustomer = session?.kind === 'customer';

  return (
    <header className={cx(s.header, scrolled && s.scrolled)}>
      <div className={s.inner}>
        <AppLink to={paths.home} className={s.brand} aria-label="Bệnh viện Thú y Lê Sơn – Về trang chủ">
          <img src={logoUrl} alt="Logo Bệnh viện Thú y Lê Sơn" width={72} height={65} />
          <span className={s.brandText}>
            <span className={s.kicker}>BỆNH VIỆN THÚ Y</span>
            <span className={s.name}>Lê Sơn</span>
          </span>
        </AppLink>

        <nav className={s.nav} aria-label="Menu chính">
          {NAV.map((n) => (
            <AppLink key={n.to} to={n.to} className={s.navLink} aria-current={active === n.section ? 'true' : undefined}>
              {n.label}
              {active === n.section && <m.span layoutId="nav-underline" className={s.underline} transition={spring.glide} />}
            </AppLink>
          ))}
        </nav>

        <div className={s.actions}>
          {!session && (
            <>
              <AppLink to={paths.login} className={cx(s.pill, s.outline)}>Đăng nhập</AppLink>
              <AppLink to={paths.signup} className={cx(s.pill, s.filled)}>Đăng ký</AppLink>
            </>
          )}
          {session && (
            <div ref={userRef}>
              <button type="button" className={s.userBtn} aria-expanded={userOpen} aria-haspopup="true" aria-controls="userDropdownMenu"
                title={name} aria-label={`Tài khoản của ${name}`} onClick={() => { setUserOpen((o) => !o); setMenuOpen(false); }}>
                <span className={s.ava} aria-hidden="true">{name.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() || '·'}</span>
                <span className={s.userName}>{shortName(name)}</span>
              </button>
              <AnimatePresence>
                {userOpen && (
                  <m.div id="userDropdownMenu" className={s.dropdown} initial={{ opacity: 0, scale: 0.96, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.14 } }} transition={{ duration: 0.18 }}>
                    <div className={s.ddHead}>
                      <div className={s.ddName}>{name}</div>
                      {me?.kind === 'customer' && <div className={s.ddPhone}>{me.phoneMasked}</div>}
                      {me?.kind === 'staff' && <div className={s.ddPhone}>{me.title}</div>}
                    </div>
                    {isCustomer ? (
                      <>
                        <AppLink className={s.ddItem} to={paths.kh.home} onClick={() => setUserOpen(false)}><Icon name="house-heart" size={18} /> Tổng quan</AppLink>
                        <AppLink className={s.ddItem} to={paths.kh.appts} onClick={() => setUserOpen(false)}><Icon name="calendar-check" size={18} /> Lịch hẹn của tôi</AppLink>
                        <AppLink className={s.ddItem} to={paths.kh.pets} onClick={() => setUserOpen(false)}><Icon name="paw-line" size={18} /> Thú cưng của tôi</AppLink>
                        <AppLink className={s.ddItem} to={paths.kh.invoices} onClick={() => setUserOpen(false)}>
                          <Icon name="receipt" size={18} /> Hóa đơn {me?.kind === 'customer' && !me.linked && <span className={s.lock}><Icon name="lock" size={14} label="Cần liên kết hồ sơ" /></span>}
                        </AppLink>
                        <AppLink className={s.ddItem} to={paths.kh.account} onClick={() => setUserOpen(false)}><Icon name="circle-user-round" size={18} /> Tài khoản</AppLink>
                      </>
                    ) : (
                      <AppLink className={s.ddItem} to={paths.nv.home} onClick={() => setUserOpen(false)}><Icon name="layout-dashboard" size={18} /> Vào khu nhân viên</AppLink>
                    )}
                    <div className={s.ddDivider} />
                    <button type="button" className={cx(s.ddItem, s.ddDanger)} onClick={() => void logout()}><Icon name="log-out" size={18} /> Đăng xuất</button>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <button ref={menuBtn} type="button" className={s.menuBtn} aria-label={menuOpen ? 'Đóng danh mục điều hướng' : 'Mở danh mục điều hướng'}
            aria-expanded={menuOpen} aria-controls="mobileMenu" onClick={() => { setMenuOpen((o) => !o); setUserOpen(false); }}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>

        <nav ref={menuRef} id="mobileMenu" className={s.mobileMenu} aria-label="Menu chính" hidden={!menuOpen} onClick={(e) => { if ((e.target as HTMLElement).closest('a')) setMenuOpen(false); }}>
          <ul>
            {NAV.map((n) => (
              <li key={n.to}><AppLink to={n.to} aria-current={active === n.section ? 'page' : undefined}>{n.label}</AppLink></li>
            ))}
          </ul>
          {!session ? (
            <div className={s.mobileAuth}>
              <AppLink className={cx(s.pill, s.outline)} to={paths.login}>Đăng nhập</AppLink>
              <AppLink className={cx(s.pill, s.filled)} to={paths.signup}>Đăng ký</AppLink>
            </div>
          ) : (
            <div className={s.mobileAuth}>
              <button type="button" className={cx(s.pill, s.logout)} onClick={() => void logout()}>Đăng xuất</button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
