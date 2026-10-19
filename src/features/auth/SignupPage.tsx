import { useEffect, useId, useState, type FormEvent } from 'react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { auth } from '@/data/public';
import { ValidationError } from '@/data/contracts/errors';
import { suggestUsername } from '@/data/rules/validation';
import { Button, Checkbox, ChipGroup, DemoTag, Field, Icon, Input, PasswordInput, useToast } from '@/ui';
import s from './Auth.module.css';

type Salutation = 'anh' | 'chi' | 'ban';
const FIELDS = ['full_name', 'phone', 'username', 'password', 'password2', 'consent'] as const;
type SignupField = (typeof FIELDS)[number];
const OFFLINE = 'Chưa kết nối được. Bạn kiểm tra mạng rồi thử lại nhé.';

/** Customer sign-up (customer §6): no OTP, auto login, then the customer zone with a welcome toast. */
export function SignupPage() {
  const uid = useId();
  const id = (f: string) => `su${uid}${f}`;
  const toast = useToast();
  const [v, setV] = useState({ full_name: '', salutation: 'ban' as Salutation, phone: '', username: '', password: '', password2: '', consent: false });
  const [errors, setErrors] = useState<Partial<Record<SignupField, string>>>({});
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [check, setCheck] = useState<{ username: string; error: string | null }>();

  const suggestion = suggestUsername(v.full_name);
  const username = v.username.trim();

  useEffect(() => {
    if (!username) return;
    let alive = true;
    const t = setTimeout(() => {
      void auth.checkUsername(username).then((error) => { if (alive) setCheck({ username, error }); });
    }, 300);
    return () => { alive = false; clearTimeout(t); };
  }, [username]);
  const live = check?.username === username ? check : undefined;

  function set<K extends keyof typeof v>(key: K, value: (typeof v)[K]) {
    setV((p) => ({ ...p, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setFormError(undefined);
    try {
      await auth.signup({ ...v, username });
      toast({ message: 'Đã tạo tài khoản. Chào mừng bạn đến với Lê Sơn!', tone: 'success' });
    } catch (err) {
      setPending(false);
      if (err instanceof ValidationError) {
        setErrors(err.fields as Partial<Record<SignupField, string>>);
        const first = FIELDS.find((f) => err.fields[f]);
        if (first) requestAnimationFrame(() => document.getElementById(id(first))?.focus());
      } else {
        setFormError(OFFLINE);
      }
    }
  }

  const usernameError = errors.username ?? (live?.error ?? undefined);
  return (
    <>
      <div className={s.card} data-auth-card>
        <h1 className={s.h1}>Tạo tài khoản</h1>
        <p className={s.sub}>Chỉ cần vài thông tin cơ bản. Bạn không cần nhập mã xác minh.</p>
        <form noValidate onSubmit={onSubmit} className={s.form}>
          <Field label="Họ và tên" hint="Tên để Lê Sơn xưng hô và nhận ra bạn khi gọi điện." error={errors.full_name}>
            <Input id={id('full_name')} value={v.full_name} onChange={(e) => set('full_name', e.target.value)} autoComplete="name" placeholder="Ví dụ: Nguyễn Thị Lan" />
          </Field>
          <div className={s.groupField}>
            <p className={s.label} aria-hidden="true">Lê Sơn nên gọi bạn là <span className={s.optional}>(không bắt buộc)</span></p>
            <ChipGroup<Salutation> label="Lê Sơn nên gọi bạn là" value={v.salutation} onChange={(x) => set('salutation', x)}
              options={[{ value: 'anh', label: 'Anh' }, { value: 'chi', label: 'Chị' }, { value: 'ban', label: 'Bạn' }]} />
          </div>
          <Field label="Số điện thoại" hint="Dùng để đăng nhập và để nhân viên liên hệ với bạn." error={errors.phone}>
            <Input id={id('phone')} type="tel" inputMode="tel" value={v.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" placeholder="Ví dụ: 0912 345 678" />
          </Field>
          <div className={s.groupField}>
            <Field label="Tên đăng nhập" error={usernameError}
              hint="4–30 ký tự: chữ thường không dấu, số, dấu gạch dưới (_) hoặc gạch ngang (-), có ít nhất một chữ cái.">
              <Input id={id('username')} value={v.username} onChange={(e) => set('username', e.target.value.toLowerCase())}
                autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Ví dụ: nguyenlan" />
            </Field>
            {live && !live.error && !errors.username && <p className={s.okLine} role="status"><Icon name="circle-check" size={16} /> Tên này dùng được</p>}
            {suggestion.length >= 4 && suggestion !== username && (
              <button type="button" className={s.suggest} onClick={() => set('username', suggestion)}>
                Gợi ý: <strong>{suggestion}</strong>
              </button>
            )}
          </div>
          <Field label="Mật khẩu" hint="Ít nhất 8 ký tự. Một cụm từ dễ nhớ với bạn là lựa chọn tốt." error={errors.password}>
            <PasswordInput id={id('password')} value={v.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Nhập lại mật khẩu" error={errors.password2}>
            <PasswordInput id={id('password2')} value={v.password2} onChange={(e) => set('password2', e.target.value)} autoComplete="new-password" />
          </Field>
          <div className={s.groupField}>
            <Checkbox id={id('consent')} checked={v.consent} onChange={(e) => set('consent', e.target.checked)}
              aria-invalid={errors.consent ? true : undefined} aria-describedby={errors.consent ? id('consent-err') : undefined}
              label={<>Tôi đồng ý để Lê Sơn lưu và sử dụng thông tin này để liên hệ và chăm sóc bé. <DemoTag>Nội dung mẫu</DemoTag></>} />
            {errors.consent && <p id={id('consent-err')} className={s.fieldError}><Icon name="info" size={16} />{errors.consent}</p>}
          </div>

          {formError && <p className={s.alert} role="alert"><Icon name="info" size={18} />{formError}</p>}
          <Button type="submit" size="lg" full icon="circle-user-round" loading={pending} loadingText="Đang tạo tài khoản…">Tạo tài khoản</Button>
          <p className={s.center}>Đã có tài khoản? <AppLink to={paths.login} className={s.textLink}>Đăng nhập</AppLink></p>
        </form>
      </div>
      <div className={s.expect}>
        <Icon name="info" size={20} />
        <div>
          <p>Sau khi tạo tài khoản, bạn có thể thêm hồ sơ bé và gửi yêu cầu đặt lịch ngay.</p>
          <p>Hóa đơn, nhật ký và video nội trú sẽ hiện khi nhân viên liên kết tài khoản với hồ sơ của bạn tại bệnh viện.</p>
        </div>
      </div>
    </>
  );
}
