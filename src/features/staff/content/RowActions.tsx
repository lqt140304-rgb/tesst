import { useState } from 'react';
import { Button, useToast } from '@/ui';
import { saveError } from '../ui';
import c from './Content.module.css';
import { DeleteDialog } from './DeleteDialog';

type Item = { id: string; version: number; visible: boolean };

/** Sửa, Ẩn/Hiện lại (at once) and Xóa (asks first) for one row. The version is read again at click time so a quick second click never conflicts with the first. */
export function RowActions<Row extends Item>({ row, name, noun, list, onEdit }: {
  row: Row; name: string; noun: string; onEdit: () => void;
  list: { list(): Promise<Row[]>; setVisible(id: string, v: number, visible: boolean): Promise<void>; remove(id: string, v: number): Promise<void> };
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  async function toggle() {
    setBusy(true);
    try {
      const fresh = (await list.list()).find((r) => r.id === row.id);
      if (!fresh) return;
      await list.setVisible(row.id, fresh.version, !fresh.visible);
    } catch (e) {
      toast({ tone: 'error', message: saveError(e) });
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className={c.actions}>
      <Button size="sm" variant="secondary" icon="pencil" aria-label={`Sửa ${name}`} onClick={onEdit}>Sửa</Button>
      <Button size="sm" variant="ghost" icon={row.visible ? 'eye-off' : 'eye'} disabled={busy} aria-label={`${row.visible ? 'Ẩn' : 'Hiện lại'} ${name}`} onClick={() => void toggle()}>{row.visible ? 'Ẩn' : 'Hiện lại'}</Button>
      <Button size="sm" variant="ghost" icon="trash-2" aria-label={`Xóa ${name}`} onClick={() => setDeleting(true)}>Xóa</Button>
      {deleting && <DeleteDialog open onClose={() => setDeleting(false)} name={name} noun={noun} onConfirm={async () => {
        const fresh = (await list.list()).find((r) => r.id === row.id);
        if (fresh) await list.remove(row.id, fresh.version);
      }} />}
    </span>
  );
}
