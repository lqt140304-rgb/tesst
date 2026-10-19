import { useState } from 'react';
import { system } from '@/data/public';
import { Button, Dialog, useToast } from '@/ui';
import s from './Auth.module.css';

/** Quiet reset link under the demo chips, with a confirm step. */
export function ResetDemoLink() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  return (
    <>
      <button type="button" className={s.quietLink} onClick={() => setOpen(true)}>Khôi phục dữ liệu mẫu ban đầu</button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Khôi phục dữ liệu mẫu?" intro="Đưa toàn bộ dữ liệu demo về trạng thái ban đầu?"
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>Thôi</Button>
          <Button icon="rotate-ccw" loading={busy} onClick={async () => {
            setBusy(true);
            await system.resetDemo();
            setBusy(false);
            setOpen(false);
            toast({ message: 'Đã đưa dữ liệu mẫu về trạng thái ban đầu.' });
          }}>Khôi phục</Button>
        </>} />
    </>
  );
}
