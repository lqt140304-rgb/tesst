import { useState, type FormEvent } from 'react';
import { paths } from '@/app/routes';
import { CAP_LABEL, type Cap } from '@/data/rules/capabilities';
import { staff, type StaffProfile } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { Button, Field, Icon, Input, PasswordInput } from '@/ui';
import { FormError, LoadingBlocks, PageHeader, PageProblem, Panel } from '../ui';
import { groupsFor, rolesText } from './settingsView';
import { useSave } from './useSave';
import s from './Settings.module.css';

/** Hồ sơ của tôi: your name, your password, and what you may do. The title is the manager's to change. */
export function ProfilePage() {
  const q = useQuery(() => staff.profile.get(), []);
  const profile = q.data;
  return (
    <>
      <PageHeader title="Hồ sơ của tôi" sub="Tên, mật khẩu và những việc bạn được làm trong hệ thống." parent={{ label: 'Cài đặt', to: paths.nv.settings }} />
      {q.error && !profile ? <PageProblem error={q.error} onRetry={q.refetch} /> : !profile ? <LoadingBlocks rows={3} /> : (
        <>
          <AboutPanel profile={profile} onSaved={q.refetch} />
          <PasswordPanel />
          <RightsPanel caps={profile.caps} />
        </>
      )}
    </>
  );
}

function AboutPanel({ profile, onSaved }: { profile: StaffProfile; onSaved: () => void }) {
  const [typed, setTyped] = useState<string>();
  const { errors, busy, save, clear } = useSave();
  const name = typed ?? profile.name;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (await save(async () => { await staff.profile.updateName(name); return 'Đã lưu tên.'; })) { setTyped(undefined); onSaved(); }
  };
  return (
    <Panel title="Thông tin" icon="circle-user-round">
      <dl className={s.facts}>
        <div className={s.fact}><dt>Tên đăng nhập</dt><dd><span className="num">{profile.username}</span></dd></div>
        <div className={s.fact}><dt>Chức danh</dt><dd>{profile.title}<span className={s.aside}>Chỉ Quản lý sửa được chức danh.</span></dd></div>
        <div className={s.fact}><dt>Vai</dt><dd>{rolesText(profile.presets)}</dd></div>
      </dl>
      <form className={s.form} onSubmit={submit} noValidate>
        <Field label="Tên hiển thị" error={errors.name} hint="Tên này hiện ở góc màn hình và trong các ghi chú của bạn.">
          <Input value={name} maxLength={80} autoComplete="name" onChange={(e) => { setTyped(e.target.value); clear('name', 'form'); }} />
        </Field>
        <FormError>{errors.form}</FormError>
        <div className={s.actions}><Button type="submit" loading={busy} loadingText="Đang lưu…" disabled={name === profile.name}>Lưu tên</Button></div>
      </form>
    </Panel>
  );
}

const EMPTY = { current: '', next: '', next2: '' };

function PasswordPanel() {
  const [v, setV] = useState(EMPTY);
  const { errors, busy, save, clear } = useSave();
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => { setV((x) => ({ ...x, [k]: e.target.value })); clear(k, 'form'); };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (await save(async () => { await staff.profile.changePassword(v); return 'Đã đổi mật khẩu.'; })) setV(EMPTY);
  };
  return (
    <Panel title="Đổi mật khẩu" icon="lock">
      <form className={s.form} onSubmit={submit} noValidate>
        <Field label="Mật khẩu hiện tại" error={errors.current}><PasswordInput value={v.current} autoComplete="current-password" onChange={set('current')} /></Field>
        <Field label="Mật khẩu mới" error={errors.next} hint="Ít nhất 8 ký tự."><PasswordInput value={v.next} autoComplete="new-password" onChange={set('next')} /></Field>
        <Field label="Nhập lại mật khẩu mới" error={errors.next2}><PasswordInput value={v.next2} autoComplete="new-password" onChange={set('next2')} /></Field>
        <FormError>{errors.form}</FormError>
        <div className={s.actions}><Button type="submit" loading={busy} loadingText="Đang đổi…">Đổi mật khẩu</Button></div>
      </form>
    </Panel>
  );
}

/** What you may do, by work area; only areas where you hold something. */
function RightsPanel({ caps }: { caps: readonly Cap[] }) {
  const held = new Set(caps);
  const groups = groupsFor(new Set()).map((g) => ({ ...g, caps: g.caps.filter((c) => held.has(c)) })).filter((g) => g.caps.length > 0);
  return (
    <Panel title="Quyền của tôi" icon="shield-user">
      <p className={s.sub}>Mỗi màn hình và thao tác kiểm tra theo quyền, không theo chức danh. Cần thêm quyền, hãy nhờ Quản lý.</p>
      <div className={s.rights}>
        {groups.map((g) => (
          <section key={g.key} className={s.rightsGroup}>
            <h3 className={s.h3}>{g.label}</h3>
            <ul className={s.rightsList}>
              {g.caps.map((c) => <li key={c}><Icon name="check" size={16} />{CAP_LABEL[c]}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </Panel>
  );
}
