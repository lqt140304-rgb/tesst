import { useState, type FormEvent } from 'react';
import { useSession } from '@/app/session/SessionProvider';
import { useLogout } from '@/app/session/useLogout';
import { customer } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { ValidationError } from '@/data/contracts/errors';
import { formatDateVi } from '@/lib/dates';
import { paths } from '@/app/routes';
import { Button, ChipGroup, Field, Icon, Input, PasswordInput, SectionCard, useToast } from '@/ui';
import { HOTLINE, LinkCode, LoadingBlocks, PageHeader, PageProblem, TEL } from '../ui';
import s from '../Customer.module.css';

type Salutation = 'anh' | 'chi' | 'ban';

/** Tài khoản (customer §9.8): name and salutation, login details, password change, link status, logout. */
export function AccountPage() {
  const q = useQuery(() => customer.account.get(), []);
  const logout = useLogout();
  if (q.error) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks rows={3} />;
  const a = q.data;
  return (
    <>
      <PageHeader title="Tài khoản" sub="Thông tin đăng nhập và cách Lê Sơn gọi bạn." crumbs={[{ label: 'Trang chủ', to: paths.kh.home }, { label: 'Tài khoản' }]} />
      <div className={s.stack}>
        <Profile key={`${a.display_name}|${a.salutation}`} name={a.display_name} salutation={a.salutation} linked={a.linked} />
        <SectionCard title="Đăng nhập">
          <dl className={s.dl}>
            <div><dt>Số điện thoại</dt><dd><span className="num">{a.phone}</span><span className={s.small}>Số điện thoại dùng để đăng nhập. Muốn đổi số? Bạn gọi {HOTLINE} để Lê Sơn hỗ trợ đổi an toàn.</span></dd></div>
            <div><dt>Tên đăng nhập</dt><dd>{a.username}<span className={s.small}>Tên đăng nhập không thay đổi được.</span></dd></div>
          </dl>
        </SectionCard>
        <SectionCard title="Đổi mật khẩu"><PasswordChange /></SectionCard>
        <SectionCard title="Liên kết hồ sơ">
          {a.linked ? (
            <p className={s.linkedLine}><Icon name="circle-check" size={20} /> Đã liên kết với hồ sơ khách hàng tại Lê Sơn{a.linkedAt ? ` từ ${formatDateVi(a.linkedAt)}` : ''}.</p>
          ) : (
            <>
              <p className={s.note}>Hóa đơn, nhật ký nội trú và video sẽ hiện sau khi nhân viên liên kết tài khoản với hồ sơ của bạn. Lần tới khi đến Lê Sơn, bạn mở trang này và đưa mã cho nhân viên để được liên kết.</p>
              <LinkCode code={a.linkCode} />
            </>
          )}
        </SectionCard>
        <div className={s.logoutRow}>
          <Button variant="danger" icon="log-out" onClick={() => void logout()} className={s.logoutBtn}>Đăng xuất</Button>
          <p className={s.small}>Muốn xóa tài khoản? Bạn gọi <a href={TEL}>{HOTLINE}</a> để được hỗ trợ.</p>
        </div>
      </div>
    </>
  );
}

function Profile({ name, salutation, linked }: { name: string; salutation: Salutation; linked: boolean }) {
  const toast = useToast();
  const { me } = useSession();
  const [v, setV] = useState({ name, salutation });
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  async function save(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    try {
      await customer.account.update({ display_name: v.name, salutation: v.salutation });
      toast({ message: 'Đã lưu thay đổi.' });
    } catch (err) {
      setError(err instanceof ValidationError ? Object.values(err.fields)[0] : 'Chưa lưu được thay đổi. Bạn thử lại nhé.');
    } finally { setPending(false); }
  }
  return (
    <SectionCard title="Thông tin tài khoản">
      <form noValidate onSubmit={save} className={s.petForm}>
        <Field label="Họ và tên" error={error} hint={linked ? 'Đổi tên ở đây không thay đổi hồ sơ tại bệnh viện.' : undefined}>
          <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoComplete="name" />
        </Field>
        <div className={s.groupField}>
          <p className={s.label} aria-hidden="true">Lê Sơn nên gọi bạn là</p>
          <ChipGroup<Salutation> label="Lê Sơn nên gọi bạn là" value={v.salutation} onChange={(x) => setV({ ...v, salutation: x })}
            options={[{ value: 'anh', label: 'Anh' }, { value: 'chi', label: 'Chị' }, { value: 'ban', label: 'Bạn' }]} />
        </div>
        <div className={s.formActions}>
          <Button type="submit" icon="check" loading={pending} loadingText="Đang lưu…" disabled={!me}>Lưu thay đổi</Button>
        </div>
      </form>
    </SectionCard>
  );
}

function PasswordChange() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ current: '', password: '', password2: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  async function save(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    try {
      await customer.account.changePassword(v);
      toast({ message: 'Đã đổi mật khẩu.' });
      setOpen(false);
      setV({ current: '', password: '', password2: '' });
    } catch (err) {
      setErrors(err instanceof ValidationError ? err.fields : { form: 'Chưa lưu được thay đổi. Bạn thử lại nhé.' });
    } finally { setPending(false); }
  }
  if (!open) return <Button variant="secondary" icon="lock" onClick={() => setOpen(true)} className={s.selfStart}>Đổi mật khẩu</Button>;
  return (
    <form noValidate onSubmit={save} className={s.petForm}>
      <Field label="Mật khẩu hiện tại" error={errors.current}>
        <PasswordInput value={v.current} onChange={(e) => setV({ ...v, current: e.target.value })} autoComplete="current-password" />
      </Field>
      <Field label="Mật khẩu mới" hint="Ít nhất 8 ký tự. Một cụm từ dễ nhớ với bạn là lựa chọn tốt." error={errors.password}>
        <PasswordInput value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} autoComplete="new-password" />
      </Field>
      <Field label="Nhập lại mật khẩu mới" error={errors.password2}>
        <PasswordInput value={v.password2} onChange={(e) => setV({ ...v, password2: e.target.value })} autoComplete="new-password" />
      </Field>
      {errors.form && <p className={s.error} role="alert">{errors.form}</p>}
      <div className={s.formActions}>
        <Button variant="ghost" onClick={() => { setOpen(false); setErrors({}); }}>Thôi</Button>
        <Button type="submit" icon="check" loading={pending} loadingText="Đang lưu…">Lưu mật khẩu mới</Button>
      </div>
    </form>
  );
}
