import { useState } from 'react';
import { staff, type StaffPriceItem } from '@/data/staff';
import { ConflictError } from '@/data/contracts/errors';
import { Button, Dialog, useToast } from '@/ui';
import { FormError, saveError } from '../ui';
import s from '../Staff.module.css';

/** Asks before switching a service off: what changes and what stays. Sends the version of the row as the person saw it. */
export function DeactivateDialog({ open, onClose, item }: { open: boolean; onClose: () => void; item: StaffPriceItem }) {
  const toast = useToast();
  const [version] = useState(item.version);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      await staff.prices.setActive(item.id, version, false);
      toast({ message: `Đã ngừng dùng ${item.name}.` });
      onClose();
    } catch (e) {
      if (e instanceof ConflictError) { toast({ tone: 'error', message: saveError(e) }); onClose(); return; } // the table reloads itself
      setError(saveError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={`Ngừng dùng ${item.name}?`}
      footer={<><Button variant="ghost" onClick={onClose}>Giữ lại</Button><Button variant="danger" loading={busy} onClick={() => void confirm()}>Ngừng dùng</Button></>}>
      <div className={s.form}>
        <FormError>{error}</FormError>
        <p>Dịch vụ sẽ không thêm được vào hóa đơn mới. Hóa đơn nháp đang có dịch vụ này vẫn lưu được và hóa đơn cũ giữ nguyên.</p>
        <p className={s.meta}>Bạn có thể dùng lại bất cứ lúc nào.</p>
      </div>
    </Dialog>
  );
}
