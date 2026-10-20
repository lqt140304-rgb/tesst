import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { FrozenOutlet } from '@/app/transition';
import { Icon } from '@/ui';
import { logoUrl } from '@/assets/media';
import { AuthPhoto } from './AuthPhoto';
import s from './Auth.module.css';

/** Login / sign-up shell (part 2 §3.3): photo column + card on wide screens, card only on phones. */
export function AuthLayout() {
  return (
    <div className={s.shell}>
      <AuthPhoto />
      <main id="noi-dung" tabIndex={-1} className={s.main} data-page>
        <div className={s.topRow}>
          <AppLink to={paths.home} className={s.homeLink}><Icon name="arrow-left" size={16} /> Về trang chủ</AppLink>
          <AppLink to={paths.home} className={s.logoLink} aria-label="Lê Sơn — trang chủ"><img src={logoUrl} alt="" width={44} height={40} /></AppLink>
        </div>
        <div className={s.column}><FrozenOutlet /></div>
      </main>
    </div>
  );
}

export { LoginPage } from './LoginPage';
export { SignupPage } from './SignupPage';
