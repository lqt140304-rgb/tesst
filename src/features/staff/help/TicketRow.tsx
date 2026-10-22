import { useState } from 'react';
import { SUPPORT_KIND_LABEL, SUPPORT_STATUS_LABEL } from '@/data/contracts/enums';
import type { SupportTicketRow } from '@/data/staff';
import { formatDateVi } from '@/lib/dates';
import { Icon } from '@/ui';
import { MiniTag } from '../ui';
import { statusTone } from './helpView';
import h from './Help.module.css';

/** One of my tickets: a line that opens to the text sent and, when there is one, the answer. */
export function TicketRow({ t }: { t: SupportTicketRow }) {
  const [open, setOpen] = useState(false);
  const id = `phieu-${t.id}`;
  return (
    <li className={h.ticket} data-ticket>
      <button type="button" className={h.ticketHead} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <span className={h.ticketMain}>
          <span className={`${h.ticketCode} num`}>{t.code}</span>
          <strong>{t.title}</strong>
        </span>
        <span className={h.ticketMeta}>
          <MiniTag>{SUPPORT_KIND_LABEL[t.kind]}</MiniTag>
          <MiniTag tone={statusTone(t.status)}>{SUPPORT_STATUS_LABEL[t.status]}</MiniTag>
          <span className="num">{formatDateVi(t.createdAt)}</span>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} />
        </span>
      </button>
      {open && (
        <div id={id} className={h.ticketBody}>
          <p className={h.ticketText}>{t.body}</p>
          {t.screen && <p className={h.hint}>Màn hình: {t.screen}</p>}
          {t.replyText && (
            <div className={h.reply}>
              <p className={h.replyHead}>Câu trả lời của {t.repliedByName}{t.repliedAt && <> · <span className="num">{formatDateVi(t.repliedAt)}</span></>}</p>
              <p className={h.ticketText}>{t.replyText}</p>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
