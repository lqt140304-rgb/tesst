import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { FrozenOutlet, useStableLocation } from '@/app/transition';
import { Icon } from '@/ui';
import { PortalPanel, type PortalMode } from './PortalPanel';
import s from './Auth.module.css';

/** Login / sign-up shell (customer §5.1): split screen on desktop, plum band + overlapping card on mobile. */
export function AuthLayout() {
  const { pathname } = useStableLocation();
  const mode: PortalMode = pathname.startsWith(paths.signup) ? 'signup' : pathname === paths.loginStaff ? 'staff' : 'customer';
  return (
    <div className={s.shell}>
      <PortalPanel mode={mode} />
      <main id="noi-dung" tabIndex={-1} className={s.main} data-page>
        <AppLink to={paths.home} className={s.homeLink}><Icon name="arrow-left" size={16} /> Về trang chủ</AppLink>
        <div className={s.column}><FrozenOutlet /></div>
      </main>
    </div>
  );
}

export { LoginPage } from './LoginPage';
export { SignupPage } from './SignupPage';
