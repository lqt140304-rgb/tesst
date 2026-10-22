import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { AppNavLink } from '@/app/nav';
import { FrozenOutlet } from '@/app/transition';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import type { Cap } from '@/data/rules/capabilities';
import { Icon, type IconName } from '@/ui';
import { cx } from '@/lib/cx';
import s from './Settings.module.css';

type Page = { to: string; label: string; icon: IconName; cap?: Cap };

/** The pages of the area, in reading order; a page the person may not open is not offered. */
const PAGES: Page[] = [
  { to: paths.nv.settingsProfile, label: 'Hồ sơ của tôi', icon: 'circle-user-round' },
  { to: paths.nv.settingsTeam, label: 'Tài khoản nhân viên', icon: 'users-round', cap: 'staff.manage' },
  { to: paths.nv.settingsSystem, label: 'Cài đặt hệ thống', icon: 'settings' },
  { to: paths.nv.settingsHospital, label: 'Thông tin bệnh viện', icon: 'house-heart' },
];

/** Cài đặt (phần 5C): a side list on wide screens, a wrapping row of links on phones, and the chosen page beside it. */
export function SettingsLayout() {
  const { can } = useSession();
  const { pathname } = useLocation();
  const first = useRef(true);
  // Changing page inside the area keeps this layout mounted, so the shell's focus-to-title step does not run: do it here.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => {
      const h1 = document.querySelector<HTMLElement>('main h1');
      if (h1) { if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    }, 60);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div className={s.layout}>
      <nav aria-label="Cài đặt" className={s.sub}>
        <p className={s.subTitle} aria-hidden="true">Cài đặt</p>
        <ul className={s.subList}>
          {PAGES.filter((p) => !p.cap || can(p.cap)).map((p) => (
            <li key={p.to}>
              <AppNavLink to={p.to} className={({ isActive }) => cx(s.subLink, isActive && s.subActive)}>
                <Icon name={p.icon} size={18} />{p.label}
              </AppNavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className={s.content}><FrozenOutlet /></div>
    </div>
  );
}
