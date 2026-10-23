import { useState } from 'react';
import { INQUIRY_STATUS_LABEL, type InquiryStatus } from '@/data/contracts/enums';
import { staff, type StaffInquiryRow } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { useSession } from '@/app/session/SessionProvider';
import { formatPhoneVi } from '@/lib/phone';
import { Button, ChipGroup, useToast } from '@/ui';
import { MiniTag, saveError } from '../ui';
import { whenText } from './inquiryWhen';
import s from './Inquiry.module.css';

/** "Lời nhắn của khách": what visitors left on the intro page. Staff who handle requests call back and tick it; hidden when nothing waits or the person may not handle requests. */
export function InquiryQueue() {
  const { can } = useSession();
  const allowed = can('requests.handle');
  const toast = useToast();
  const [view, setView] = useState<InquiryStatus>('new');
  const [busy, setBusy] = useState<string | null>(null);
  const waiting = useQuery(() => (allowed ? staff.inquiries.list({ status: 'new' }) : Promise.resolve([] as StaffInquiryRow[])), [allowed]);
  const called = useQuery(() => (allowed && view === 'called' ? staff.inquiries.list({ status: 'called' }) : Promise.resolve([] as StaffInquiryRow[])), [allowed, view]);
  const waitingRows = waiting.data ?? [];
  if (!allowed || waitingRows.length === 0) return null;
  const rows = view === 'new' ? waitingRows : called.data ?? [];

  async function markCalled(r: StaffInquiryRow) {
    if (busy) return;
    setBusy(r.id);
    try {
      await staff.inquiries.markCalled(r.id, r.version);
      toast({ message: 'Đã ghi nhận đã gọi lại.' });
    } catch (e) {
      toast({ tone: 'error', message: saveError(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={s.queue} data-inquiry-queue aria-labelledby="inquiry-title">
      <h2 id="inquiry-title" className={s.h2}>Lời nhắn của khách ({waitingRows.length})</h2>
      <ChipGroup<InquiryStatus> label="Lọc lời nhắn" value={view} onChange={setView}
        options={[{ value: 'new', label: 'Chờ gọi lại' }, { value: 'called', label: INQUIRY_STATUS_LABEL.called }]} />
      <ul className={s.list}>
        {rows.map((r) => (
          <li key={r.id} className={s.row} data-inquiry-row>
            <div className={s.body}>
              <p className={s.who}>
                <strong>{r.name}</strong> · <a href={`tel:${r.phone}`} className="num">{formatPhoneVi(r.phone)}</a>
                {r.overdue && <> <MiniTag tone="rose">Quá hạn</MiniTag></>}
              </p>
              <p className={s.text}>{r.text}</p>
              {r.about && <p className={s.about}>Hỏi mua: {r.about}</p>}
              <p className={s.meta}>
                <span className="num">{r.code}</span>{whenText(r.createdAt) && <> · <span className="num">{whenText(r.createdAt)}</span></>}
                {r.status === 'called' && r.handledByName && <> · {INQUIRY_STATUS_LABEL.called}: {r.handledByName}</>}
              </p>
            </div>
            {r.status === 'new' && (
              <div className={s.actions}>
                <Button size="sm" icon="phone" loading={busy === r.id} aria-label={`Đã gọi lại cho ${r.name}`} onClick={() => void markCalled(r)}>Đã gọi lại</Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
