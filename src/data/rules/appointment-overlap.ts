import { formatTimeVi } from '../../lib/dates';

export interface BusySlot { id: string; assignee_id?: string; start_at: string; duration_min: number; status: 'scheduled' | 'cancelled'; pet_id: string }

const MIN = 60_000;
const endOf = (s: { start_at: string; duration_min: number }) => Date.parse(s.start_at) + s.duration_min * MIN;

/** The earliest live appointment of the same person that shares time with the candidate; touching ends do not count. */
export function findOverlap(existing: readonly BusySlot[], c: { assignee_id?: string; start_at: string; duration_min: number; ignoreId?: string }): BusySlot | undefined {
  if (!c.assignee_id) return undefined;
  const from = Date.parse(c.start_at);
  const to = endOf(c);
  return existing
    .filter((s) => s.assignee_id === c.assignee_id && s.status === 'scheduled' && s.id !== c.ignoreId && Date.parse(s.start_at) < to && from < endOf(s))
    .sort((a, b) => Date.parse(a.start_at) - Date.parse(b.start_at))[0];
}

export function overlapMessage(s: BusySlot, petName: string): string {
  return `Người phụ trách đã có lịch ${formatTimeVi(s.start_at)}–${formatTimeVi(new Date(endOf(s)))} (bé ${petName}). Bạn chọn giờ khác hoặc người khác nhé.`;
}
