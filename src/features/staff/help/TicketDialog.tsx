import { useState } from 'react';
import { SUPPORT_KIND_LABEL, SUPPORT_STATUS_LABEL } from '@/data/contracts/enums';
import { staff, type SupportTicketRow } from '@/data/staff';
import { formatDateVi } from '@/lib/dates';
import { Button, Dialog, Field, Textarea } from '@/ui';
import { FormError, MiniTag } from '../ui';
import { useSave } from '../settings/useSave';
import { LIMITS, countText, statusTone } from './helpView';
import h from './Help.module.css';

/** One ticket in the inbox: read it, mark it as being looked at, answer it (again, if need be). The version is the one read on opening. */
export function TicketDialog({ open, onClose, row }: { open: boolean; onClose: () => void; row: SupportTicketRow }) {
  const [version] = useState(row.version);
  const [text, setText] = useState(row.replyText ?? '');
  const { errors, busy, save, clear } = useSave(onClose);
  const answered = row.status === 'answered';
  async function seen() {
    if (await save(async () => { await staff.support.setStatus(row.id, version, 'seen'); return `Phiếu ${row.code} đang được xem.`; })) onClose();
  }
  async function reply() {
    if (await save(async () => { await staff.support.reply(row.id, version, text); return `Đã trả lời phiếu ${row.code}.`; })) onClose();
  }
  return (
    <Dialog open={open} onClose={onClose} title={`Phiếu ${row.code}`} wide
      footer={<>
        <Button variant="ghost" onClick={onClose}>Đóng</Button>
        {row.status === 'new' && <Button variant="secondary" icon="eye" loading={busy} onClick={() => void seen()}>Đánh dấu đang xem</Button>}
        <Button icon="check" loading={busy} loadingText="Đang gửi…" onClick={() => void reply()}>Gửi trả lời</Button>
      </>}>
      <div className={h.form}>
        <FormError>{errors.form}</FormError>
        <div className={h.ticketMeta}>
          <MiniTag>{SUPPORT_KIND_LABEL[row.kind]}</MiniTag>
          <MiniTag tone={statusTone(row.status)}>{SUPPORT_STATUS_LABEL[row.status]}</MiniTag>
          <span>{row.createdByName}</span>
          <span className="num">{formatDateVi(row.createdAt)}</span>
        </div>
        <strong>{row.title}</strong>
        <p className={h.ticketText}>{row.body}</p>
        {row.screen && <p className={h.hint}>Màn hình: {row.screen}</p>}
        <Field label="Trả lời" error={errors.reply} hint={answered ? `Đã trả lời. ${countText(text, LIMITS.reply)}` : countText(text, LIMITS.reply)}>
          <Textarea rows={4} value={text} onChange={(e) => { setText(e.target.value); clear('reply', 'form'); }} />
        </Field>
      </div>
    </Dialog>
  );
}
