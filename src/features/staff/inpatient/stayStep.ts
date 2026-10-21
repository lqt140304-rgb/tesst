import type { StaffStayView } from '@/data/staff';
import { dayOf, todayVN } from '@/lib/dates';

export type StayStep = 'caring' | 'ready' | 'discharged';
/** Orientation strip: the first step is always done, so the current one is index 1–3. */
export const STAY_STEP_LABELS = ['Nhập viện', 'Đang chăm sóc', 'Sẵn sàng về', 'Đã xuất viện'] as const;

export function currentStayStep(v: Pick<StaffStayView, 'discharged_at' | 'expected_discharge_at' | 'diary'>, now: Date): StayStep {
  if (v.discharged_at) return 'discharged';
  const latest = v.diary
    .filter((e) => e.status === 'shared' && e.shared_at)
    .sort((a, b) => Date.parse(b.shared_at!) - Date.parse(a.shared_at!))[0];
  if (latest?.general_status === 'ready_home') return 'ready';
  if (v.expected_discharge_at && dayOf(v.expected_discharge_at) <= todayVN(now)) return 'ready';
  return 'caring';
}

export const stepIndex = (s: StayStep): 1 | 2 | 3 => (s === 'caring' ? 1 : s === 'ready' ? 2 : 3);
