import { formatTimeVi } from '@/lib/dates';
import { Icon } from '@/ui';
import { cx } from '@/lib/cx';
import type { StaffAppointment } from '@/data/staff';
import s from './Calendar.module.css';

const SURNAME = (full: string) => full.trim().split(/\s+/).pop() ?? full;
const SERVICE_SHORT = { kham: 'Khám', spa: 'Spa', noi_tru: 'Nội trú' } as const;

/** One appointment on a grid: time, pet, "service · surname"; tinted by service, faded when past, struck through when cancelled, dimmed when the search skips it. */
export function Block({ a, onOpen, focus, dim }: { a: StaffAppointment; onOpen: () => void; focus?: boolean; dim?: boolean }) {
  return (
    <button type="button" className={cx(s.block, s[`svc_${a.service}`], a.status === 'cancelled' && s.cancelled, a.past && s.past, focus && s.focus, dim && s.dim)}
      onClick={onOpen} data-appointment data-start={a.start_at} data-dim={dim ? 'true' : undefined}
      aria-label={`${formatTimeVi(a.start_at)} · ${a.petName} · ${a.customerName}${a.status === 'cancelled' ? ' · đã hủy' : ''}${a.rescheduleRequest ? ' · đang chờ đổi lịch' : ''}`}>
      <span className={s.blockTime}>
        {formatTimeVi(a.start_at)}
        {a.status === 'cancelled' && <Icon name="circle-x" size={13} />}
        {a.rescheduleRequest && <span className={s.wish} title="Đang chờ đổi lịch" aria-hidden="true" />}
      </span>
      <span className={s.blockPet}>{a.petName}</span>
      <span className={s.blockMeta}>{SERVICE_SHORT[a.service]} · {SURNAME(a.customerName)}</span>
    </button>
  );
}
