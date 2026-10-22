import { paths } from '@/app/routes';
import type { Cap } from '@/data/rules/capabilities';
import type { OperationsReport, OpsAppointments, OpsInpatient, OpsRevenue } from '@/data/staff';
import { formatQty } from '@/lib/units';
import { shares } from '../revenue/revenueView';
import { DEFAULT_FILTERS, writeFilters } from '../stock/stockView';

const NOT_YET = 'Chưa có';
const plain = (n: number) => n.toLocaleString('vi-VN');

/** The comparison with the previous period, in words: meaning never rests on an arrow or a colour. */
export function deltaText(now: number, before: number, fmt: (n: number) => string = plain): string {
  if (before === 0 && now > 0) return 'kỳ trước chưa có';
  if (now === before) return 'bằng kỳ trước';
  return now > before ? `nhiều hơn kỳ trước ${fmt(now - before)}` : `ít hơn kỳ trước ${fmt(before - now)}`;
}

/** A rate that could not be worked out (nothing to divide by) is "Chưa có", never a made-up 0%. */
export function percentText(rate: number | null): string {
  if (rate === null) return NOT_YET;
  const text = (Math.round(rate * 1000) / 10).toFixed(1).replace(/\.0$/, '').replace('.', ',');
  return `${text}%`;
}

export function minutesText(min: number | null): string {
  if (min === null) return NOT_YET;
  if (min < 60) return `${min} phút`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} giờ` : `${h} giờ ${m} phút`;
}

export type RatioRow<K extends string> = { key: K; label: string; count: number; share: number; fill: number };

/** Rows in a fixed order; the whole-number shares add up to 100 and `fill` scales the thin bar to the biggest row. */
export function ratioRows<K extends string>(counts: Record<K, number>, order: readonly K[], labels: Record<K, string>): RatioRow<K>[] {
  const values = order.map((k) => counts[k]);
  const pct = shares(values);
  const max = Math.max(0, ...values);
  return order.map((key, i) => ({ key, label: labels[key], count: counts[key], share: pct[i]!, fill: max > 0 ? counts[key] / max : 0 }));
}

export type Headline = { key: 'scheduled' | 'received' | 'newCustomers' | 'admitted'; label: string; value: number; delta: string };

export function headlines(r: OperationsReport): Headline[] {
  const row = (key: Headline['key'], label: string, value: number, before: number): Headline => ({ key, label, value, delta: deltaText(value, before) });
  return [
    row('scheduled', 'Lịch đã hẹn', r.appointments.scheduled, r.appointments.previousScheduled),
    row('received', 'Yêu cầu nhận', r.requests.received, r.requests.previousReceived),
    row('newCustomers', 'Khách mới', r.customers.newCustomers, r.customers.previousNewCustomers),
    row('admitted', 'Lượt nhập nội trú', r.inpatient.admitted, r.inpatient.previousAdmitted),
  ];
}

export type Attention = { key: string; text: string; to?: string };

/** What needs a person right now (not tied to the period). Lines that are 0 are left out; a line links only to a page the person may open. */
export function attentionItems(r: OperationsReport, can: (c: Cap | Cap[]) => boolean): Attention[] {
  const stockTo = (status: 'out' | 'low' | 'expiring') => (can('stock.view') ? `${paths.nv.stock}?${writeFilters({ ...DEFAULT_FILTERS, status })}` : undefined);
  const lines: [n: number, item: Attention][] = [
    [r.requests.waitingNow, { key: 'requests', text: `${r.requests.waitingNow} yêu cầu đang chờ xử lý`, to: can('requests.handle') ? paths.nv.requests : undefined }],
    [r.stock.out, { key: 'out', text: `${r.stock.out} món kho đã hết hàng`, to: stockTo('out') }],
    [r.stock.low, { key: 'low', text: `${r.stock.low} món kho sắp hết`, to: stockTo('low') }],
    [r.stock.expiringSoon, { key: 'soon', text: `${r.stock.expiringSoon} món sắp hết hạn`, to: stockTo('expiring') }],
    [r.stock.expired, { key: 'expired', text: `${r.stock.expired} món đã hết hạn`, to: stockTo('expiring') }],
  ];
  return lines.filter(([n]) => n > 0).map(([, item]) => (item.to === undefined ? { key: item.key, text: item.text } : item));
}

export const isEmptyPeriod = (r: OperationsReport) =>
  r.appointments.total === 0 && r.requests.received === 0 && r.inpatient.admitted === 0 && r.inpatient.discharged === 0 && r.customers.newCustomers === 0;

/** The money block is there only for people who may also see revenue. */
export const showRevenue = (r: OperationsReport): r is OperationsReport & { revenue: OpsRevenue } => r.revenue !== undefined;

export function appointmentSummary(a: OpsAppointments): string {
  if (a.total === 0) return 'Chưa có lịch nào trong kỳ.';
  return `Đã hẹn ${a.scheduled} lịch, đã hủy ${a.cancelled} (${percentText(a.cancelRate)}).`;
}

export function inpatientCells(i: OpsInpatient): { key: 'current' | 'moves' | 'bedDays' | 'occupancy'; label: string; value: string; note?: string }[] {
  return [
    { key: 'current', label: 'Đang nội trú', value: String(i.currentlyAdmitted) },
    { key: 'moves', label: 'Nhập / xuất trong kỳ', value: `${i.admitted} nhập, ${i.discharged} xuất` },
    { key: 'bedDays', label: 'Ngày-chuồng', value: `${formatQty(i.bedDays)} ngày`, note: 'Tổng số ngày các bé đã ở nội trú trong kỳ.' },
    { key: 'occupancy', label: 'Lấp đầy', value: percentText(i.occupancyRate), note: 'Phần chuồng có bé ở, tính theo cả kỳ.' },
  ];
}
