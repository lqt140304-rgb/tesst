import { useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { AppLink, useAppNavigate } from '@/app/nav';
import { paths } from '@/app/routes';
import { useStableLocation } from '@/app/transition';
import { auth } from '@/data/public';
import { AuthError } from '@/data/contracts/errors';
import { Banner, Button, Field, Icon, Input, PasswordInput, Tabs } from '@/ui';
import { dur, ease } from '@/ui/motion';
import { DemoAccountChips } from './DemoAccountChips';
import { ForgotPanel } from './ForgotPanel';
import s from './Auth.module.css';

type Tab = 'customer' | 'staff';

export const LOGIN_MSG = {
  identifier: 'Bạn nhập số điện thoại hoặc tên đăng nhập.',
  username: 'Bạn nhập tên đăng nhập.',
  password: 'Bạn nhập mật khẩu.',
  wrong: 'Thông tin đăng nhập chưa đúng. Bạn kiểm tra lại rồi thử lần nữa nhé.',
  offline: 'Chưa kết nối được. Bạn kiểm tra mạng rồi thử lại nhé.',
} as const;

/**
 * One portal, two tabs (customer §5). The URL follows the tab; correct credentials always go to the
 * account's real zone whichever tab was used (RequireGuest does the routing, honouring `?tiep`).
 */
export function LoginPage() {
  const loc = useStableLocation();
  const navigate = useAppNavigate();
  const forgot = loc.pathname === paths.forgot;
  const tab: Tab = loc.pathname === paths.loginStaff ? 'staff' : 'customer';
  const fromLink = new URLSearchParams(loc.search).has('tiep');

  const [form, setForm] = useState({ tab, identifier: '', password: '' });
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);
  if (form.tab !== tab) {
    setForm({ tab, identifier: '', password: '' });
    setError(undefined);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!form.identifier.trim()) return setError(tab === 'staff' ? LOGIN_MSG.username : LOGIN_MSG.identifier);
    if (!form.password) return setError(LOGIN_MSG.password);
    setError(undefined);
    setPending(true);
    try {
      await auth.login({ identifier: form.identifier, password: form.password });
    } catch (err) {
      setError(err instanceof AuthError ? LOGIN_MSG.wrong : LOGIN_MSG.offline);
      setPending(false);
    }
  }

  function pick(username: string, password: string) {
    setForm({ tab, identifier: username, password });
    setError(undefined);
    submitRef.current?.focus();
  }

  if (forgot) {
    return <div className={s.card} data-auth-card><ForgotPanel /></div>;
  }

  return (
    <>
      <div className={s.card} data-auth-card>
        <h1 className={s.h1}>Đăng nhập</h1>
        <Tabs<Tab> label="Loại tài khoản" value={tab} className={s.tabs}
          onChange={(v) => navigate(`${v === 'staff' ? paths.loginStaff : paths.login}${loc.search}`, { replace: true })}
          items={[
            { value: 'customer', label: <><Icon name="paw-heart" size={18} /> Khách hàng</> },
            { value: 'staff', label: <><Icon name="shield-user" size={18} /> Nhân viên</> },
          ]} />

        <AnimatePresence mode="wait" initial={false}>
          <m.form key={tab} noValidate onSubmit={onSubmit} className={s.form}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: dur.s, ease: ease.out }}>
            <p className={s.sub}>{tab === 'customer' ? 'Chào mừng bạn quay lại với Lê Sơn.' : 'Đăng nhập bằng tài khoản được quản lý cấp.'}</p>
            {fromLink && <Banner tone="info">Bạn đăng nhập để tiếp tục nhé.</Banner>}

            <Field label={tab === 'customer' ? 'Số điện thoại hoặc tên đăng nhập' : 'Tên đăng nhập'}>
              <Input value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                placeholder={tab === 'customer' ? 'Ví dụ: 0912 345 678 hoặc nguyenlan' : 'Tên đăng nhập của bạn'}
                autoComplete="username" autoCapitalize="none" spellCheck={false} />
            </Field>
            <div className={s.pwField}>
              {tab === 'customer' && <AppLink to={paths.forgot} className={s.forgotLink}>Quên mật khẩu?</AppLink>}
              <Field label="Mật khẩu">
                <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
              </Field>
            </div>

            {error && <p className={s.alert} role="alert"><Icon name="info" size={18} />{error}</p>}
            <Button ref={submitRef} type="submit" size="lg" full icon="log-in" loading={pending} loadingText="Đang đăng nhập…">Đăng nhập</Button>

            {tab === 'customer' ? (
              <>
                <div className={s.divider}><span>hoặc</span></div>
                <p className={s.center}>Chưa có tài khoản? <AppLink to={paths.signup} className={s.textLink}>Tạo tài khoản</AppLink></p>
                <p className={s.comfort}>
                  Bạn không cần tài khoản để gửi yêu cầu đặt lịch. <AppLink to={paths.section('dat-lich')} className={s.textLink}>Gửi yêu cầu ngay</AppLink>
                </p>
              </>
            ) : (
              <>
                <p className={s.small}>Quên mật khẩu? Bạn liên hệ quản lý để được cấp lại.</p>
                <p className={s.small}>
                  Bạn là khách hàng?{' '}
                  <AppLink to={`${paths.login}${loc.search}`} replace className={s.textLink}>Chuyển sang thẻ Khách hàng</AppLink>.
                </p>
              </>
            )}
          </m.form>
        </AnimatePresence>
      </div>
      <DemoAccountChips tab={tab} onPick={pick} />
    </>
  );
}
