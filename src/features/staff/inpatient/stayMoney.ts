import type { StayBilling } from '@/data/staff';
import { billableDays, formatDaysVi } from '@/data/rules/stay-billing';
import { formatVnd } from '@/lib/money';

const charge = (b: StayBilling, admittedAt: string, until: string | Date) => {
  const days = billableDays(admittedAt, until);
  return { days, total: Math.round((b.dayPrice ?? 0) * days) };
};

/** The running or final day charge shown on the stay page. An issued or voided invoice keeps its own quantity and says so; a draft is running until discharge, then settled. */
export function infoMoneyLine(billing: StayBilling | undefined, admittedAt: string, until: string | Date, discharged: boolean): string {
  if (!billing) return 'Chưa có hóa đơn';
  if (!billing.dayItemName || billing.dayPrice === undefined) return 'Chưa ghi tiền nội trú';
  const fixed = billing.status !== 'draft' && billing.dayQty !== undefined;
  const computed = charge(billing, admittedAt, until);
  const days = fixed ? billing.dayQty! : discharged && billing.dayQty !== undefined ? billing.dayQty : computed.days;
  const total = Math.round(billing.dayPrice * days);
  const note = billing.status === 'issued' ? 'hóa đơn đã phát hành' : billing.status === 'voided' ? 'hóa đơn đã hủy' : discharged ? `đã tính ${formatDaysVi(days)} ngày` : 'tạm tính tới bây giờ';
  return `${billing.dayItemName} × ${formatDaysVi(days)} ngày = ${formatVnd(total)} · ${note}`;
}

/** The bill summary in the discharge dialog; `invalid` when the chosen time cannot be a discharge time. */
export function dischargeMoneyLine(billing: StayBilling | undefined, admittedAt: string, at: string | Date): { text: string; invalid: boolean } {
  const minutes = Math.floor((new Date(at).getTime() - new Date(admittedAt).getTime()) / 60_000);
  if (!Number.isFinite(minutes) || minutes < 0) return { text: 'Thời điểm xuất viện chưa đúng.', invalid: true };
  if (!billing) return { text: 'Lượt nội trú này chưa có hóa đơn.', invalid: false };
  if (billing.status === 'issued') return { text: 'Hóa đơn đã phát hành — không thay đổi', invalid: false };
  if (billing.status === 'voided') return { text: 'Hóa đơn đã hủy — không thay đổi', invalid: false };
  if (!billing.dayItemName || billing.dayPrice === undefined) return { text: 'Chưa ghi tiền nội trú — bạn có thể thêm trong hóa đơn.', invalid: false };
  const { days, total } = charge(billing, admittedAt, at);
  return { text: `${billing.dayItemName} × ${formatDaysVi(days)} ngày (${Math.floor(minutes / 60)} giờ) = ${formatVnd(total)} · Hóa đơn đang là bản nháp`, invalid: false };
}

/** "2 ngày 4 giờ", "4 giờ", "30 phút": how long the pet has been (or was) here. */
export function stayDuration(admittedAt: string, until: string | Date): string {
  const minutes = Math.max(0, Math.floor((new Date(until).getTime() - new Date(admittedAt).getTime()) / 60_000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return hours > 0 ? `${days} ngày ${hours} giờ` : `${days} ngày`;
  return hours > 0 ? `${hours} giờ` : `${minutes} phút`;
}
