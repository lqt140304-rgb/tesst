import { NUDGE_KEYS, type NudgeKey } from '@/data/contracts/enums';
import type { StaffInvoiceRow } from '@/data/staff';
import { paths } from '@/app/routes';

/** Demo threshold, not a hospital figure: a draft untouched this long is worth a reminder. */
export const DRAFT_DAYS = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

export const oldDrafts = (rows: Pick<StaffInvoiceRow, 'status' | 'created_at'>[], now: Date): number =>
  rows.filter((r) => r.status === 'draft' && now.getTime() - new Date(r.created_at).getTime() > DRAFT_DAYS * DAY_MS).length;

export type NudgeLine = { key: NudgeKey; text: string; to: string };

const LINE: Record<NudgeKey, (n: number) => Omit<NudgeLine, 'key'>> = {
  requests: (n) => ({ text: `${n} yêu cầu đặt lịch đang chờ xử lý`, to: paths.nv.requests }),
  reschedules: (n) => ({ text: `${n} khách xin đổi lịch`, to: paths.nv.requests }),
  stock: (n) => ({ text: `${n} món kho đã hết hoặc sắp hết`, to: paths.nv.stock }),
  drafts: (n) => ({ text: `${n} hóa đơn nháp để quá ${DRAFT_DAYS} ngày chưa phát hành`, to: paths.nv.invoices }),
};

/** One line per switched-on kind that has something to do, in the fixed order. */
export function nudgeLines(input: { enabled: Record<NudgeKey, boolean>; requests: number; reschedules: number; stock: number; drafts: number }): NudgeLine[] {
  return NUDGE_KEYS.filter((k) => input.enabled[k] && input[k] > 0).map((k) => ({ key: k, ...LINE[k](input[k]) }));
}

/** The pop-up for a new request follows the requests switch. */
export const toastWanted = (enabled: Record<NudgeKey, boolean>): boolean => enabled.requests;
