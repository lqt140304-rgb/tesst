import { useState } from 'react';
import { staff, type StaffAdminRow } from '@/data/staff';
import { Button, Dialog, Field, PasswordInput } from '@/ui';
import { FormError } from '../ui';
import { useSave } from './useSave';
import ss from '../Staff.module.css';

/** The manager types a new password for someone else; the person changes it again in their own profile. */
export function ResetPasswordDialog({ open, onClose, row }: { open: boolean; onClose: () => void; row: StaffAdminRow }) {
  const [password, setPassword] = useState('');
  const [version] = useState(row.version);
  const { errors, busy, save, clear } = useSave(onClose);
  async function submit() {
    if (await save(async () => { await staff.team.resetPassword(row.id, version, { password }); return `Đã đặt lại mật khẩu của ${row.name}.`; })) onClose();
  }
  return (
    <Dialog open={open} onClose={onClose} title={`Đặt lại mật khẩu của ${row.name}`}
      intro="Hãy báo cho họ; họ đổi lại ở Hồ sơ của họ."
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="check" loading={busy} loadingText="Đang lưu…" onClick={() => void submit()}>Đặt lại mật khẩu</Button></>}>
      <div className={ss.form}>
        <FormError>{errors.form}</FormError>
        <Field label="Mật khẩu mới" error={errors.password} hint="Ít nhất 8 ký tự.">
          <PasswordInput value={password} autoComplete="new-password" onChange={(e) => { setPassword(e.target.value); clear('password', 'form'); }} />
        </Field>
      </div>
    </Dialog>
  );
}
