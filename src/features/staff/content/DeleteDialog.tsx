import { useState } from 'react';
import { ConflictError } from '@/data/contracts/errors';
import { Button, Dialog, useToast } from '@/ui';
import { FormError } from '../ui';
import { contentError, endsDialog } from './saveContent';
import c from './Content.module.css';
import s from '../Staff.module.css';

/** Asks before removing an item for good; sends the version of the row as the person saw it. */
export function DeleteDialog({ open, onClose, name, noun, onConfirm }: { open: boolean; onClose: () => void; name: string; noun: string; onConfirm: () => Promise<void> }) {
  const toast = useToast();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
      toast({ message: `Đã xóa ${name}.` });
      onClose();
    } catch (e) {
      if (e instanceof ConflictError || endsDialog(e)) { toast({ tone: 'error', message: contentError(e) }); onClose(); return; } // the list reloads itself
      setError(contentError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onClose={onClose} title={`Xóa ${noun} này?`}
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button variant="danger" loading={busy} onClick={() => void confirm()}>Xóa</Button></>}>
      <div className={s.form}>
        <FormError>{error}</FormError>
        <p className={c.long}><strong>{name}</strong></p>
        <p>Bạn sẽ xóa hẳn {noun} này, cả ảnh. Khách không còn thấy và bạn không lấy lại được.</p>
        <p className={s.meta}>Muốn tạm cất đi thì bạn bấm Ẩn thay vì Xóa.</p>
      </div>
    </Dialog>
  );
}
