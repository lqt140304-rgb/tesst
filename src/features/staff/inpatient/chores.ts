import type { StaffStayView } from '@/data/staff';
import type { Cap } from '@/data/rules/capabilities';
import { dayOf, todayVN } from '@/lib/dates';

export type Chore = { key: 'diary' | 'videos' | 'invoice'; label: string; tab: 'diary' | 'videos' | 'invoice' };
type Can = (c: Cap | Cap[]) => boolean;
type ChoreSource = Pick<StaffStayView, 'diary' | 'videos' | 'billing' | 'discharged_at'>;

const BILLING: Cap[] = ['invoices.create', 'payments.record'];
const draftVideos = (v: ChoreSource) => v.videos.filter((x) => x.share_status === 'draft' && !x.deleted).length;

/** Gentle suggestions on a stay page; they never block anything. */
export function stayChores(v: ChoreSource, can: Can, now: Date): Chore[] {
  if (v.discharged_at) return [];
  const out: Chore[] = [];
  const today = todayVN(now);
  if (can('inpatient.share') && !v.diary.some((e) => e.status === 'shared' && e.shared_at && dayOf(e.shared_at) === today)) {
    out.push({ key: 'diary', label: 'Chưa gửi nhật ký hôm nay', tab: 'diary' });
  }
  const videos = draftVideos(v);
  if (can('inpatient.share') && videos > 0) out.push({ key: 'videos', label: `${videos} video chưa chia sẻ`, tab: 'videos' });
  if (v.billing?.status === 'draft' && can(BILLING)) out.push({ key: 'invoice', label: 'Hóa đơn chưa phát hành', tab: 'invoice' });
  return out;
}

/** What to mention in the discharge dialog: reminders only, never a block. */
export function dischargeReminders(v: ChoreSource, can: Can): string[] {
  const out: string[] = [];
  const drafts = v.diary.filter((e) => e.status === 'draft').length;
  if (drafts > 0) out.push(`Còn ${drafts} nhật ký nháp chưa chia sẻ`);
  const videos = draftVideos(v);
  if (videos > 0) out.push(`Còn ${videos} video nháp`);
  if (v.billing?.status === 'draft' && can(BILLING)) out.push('Hóa đơn chưa phát hành');
  return out;
}
