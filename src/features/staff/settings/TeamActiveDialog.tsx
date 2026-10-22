import { useState } from 'react';
import { staff, type StaffAdminRow } from '@/data/staff';
import { Button, Dialog } from '@/ui';
import { FormError } from '../ui';
import { useSave } from './useSave';

/** Switching someone off asks first and says what follows. Switching on again needs no question, so it has no dialog. */
export function TeamActiveDialog({ open, onClose, row }: { open: boolean; onClose: () => void; row: StaffAdminRow }) {
  const [version] = useState(row.version);
  const { errors, busy, save } = useSave(onClose);
  async function submit() {
    if (await save(async () => { await staff.team.setActive(row.id, version, false); return `Đã tắt tài khoản ${row.username}.`; })) onClose();
  }
  return (
    <Dialog open={open} onClose={onClose} title={`Tắt tài khoản của ${row.name}?`}
      intro="Người này sẽ không đăng nhập được nữa. Lịch sử vẫn giữ tên."
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button variant="danger" icon="eye-off" loading={busy} loadingText="Đang tắt…" onClick={() => void submit()}>Tắt tài khoản</Button></>}>
      <FormError>{errors.active ?? errors.form}</FormError>
    </Dialog>
  );
}
