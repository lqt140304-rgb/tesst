import { describe, expect, it } from 'vitest';
import type { OperationsReport } from '@/data/staff';
import { formatVnd } from '@/lib/money';
import {
  appointmentSummary, attentionItems, deltaText, headlines, inpatientCells, isEmptyPeriod, minutesText, percentText, ratioRows, showRevenue,
} from './reportsView';

const report = (o: Partial<OperationsReport> = {}): OperationsReport => ({
  from: '2026-10-16', to: '2026-10-22', previous: { from: '2026-10-09', to: '2026-10-15' },
  appointments: {
    scheduled: 42, cancelled: 6, total: 48, cancelRate: 0.125, daily: [], byService: { kham: 30, spa: 8, noi_tru: 4 },
    bySource: { web_request: 20, phone: 15, walk_in: 7 }, byAssignee: [], previousScheduled: 39,
  },
  requests: {
    received: 25, byStatus: { pending: 3, contacting: 2, confirmed: 15, unreachable: 1, cancelled: 2, rejected: 2 }, confirmRate: 0.6,
    avgFirstResponseMin: 12, waitingNow: 5, previousReceived: 30,
  },
  inpatient: { admitted: 5, discharged: 3, currentlyAdmitted: 4, bedDays: 12.5, occupancyRate: 0.3, previousAdmitted: 5 },
  customers: { newCustomers: 7, previousNewCustomers: 0 },
  stock: { low: 3, out: 1, expiringSoon: 1, expired: 1 },
  ...o,
});
const zero = (): OperationsReport => report({
  appointments: { scheduled: 0, cancelled: 0, total: 0, cancelRate: null, daily: [], byService: { kham: 0, spa: 0, noi_tru: 0 }, bySource: { web_request: 0, phone: 0, walk_in: 0 }, byAssignee: [], previousScheduled: 0 },
  requests: { received: 0, byStatus: { pending: 0, contacting: 0, confirmed: 0, unreachable: 0, cancelled: 0, rejected: 0 }, confirmRate: null, avgFirstResponseMin: null, waitingNow: 0, previousReceived: 0 },
  inpatient: { admitted: 0, discharged: 0, currentlyAdmitted: 0, bedDays: 0, occupancyRate: null, previousAdmitted: 0 },
  customers: { newCustomers: 0, previousNewCustomers: 0 }, stock: { low: 0, out: 0, expiringSoon: 0, expired: 0 },
});
const all = () => true;
const none = () => false;

describe('deltaText', () => {
  it('compares with the previous period in words', () => {
    expect(deltaText(5, 2)).toBe('nhiều hơn kỳ trước 3');
    expect(deltaText(2, 5)).toBe('ít hơn kỳ trước 3');
    expect(deltaText(4, 4)).toBe('bằng kỳ trước');
    expect(deltaText(0, 0)).toBe('bằng kỳ trước');
    expect(deltaText(3, 0)).toBe('kỳ trước chưa có');
  });
  it('formats the difference with the given formatter', () => {
    expect(deltaText(1500000, 1000000, formatVnd)).toBe(`nhiều hơn kỳ trước ${formatVnd(500000)}`);
    expect(deltaText(1000, 0)).toBe('kỳ trước chưa có');
    expect(deltaText(2500, 1000)).toBe('nhiều hơn kỳ trước 1.500');
  });
});

describe('percentText and minutesText', () => {
  it('writes a rate with a decimal comma, and "Chưa có" when it cannot be worked out', () => {
    expect(percentText(null)).toBe('Chưa có');
    expect(percentText(0.125)).toBe('12,5%');
    expect(percentText(0.5)).toBe('50%');
    expect(percentText(0)).toBe('0%');
    expect(percentText(1)).toBe('100%');
  });
  it('writes minutes, hours and "Chưa có"', () => {
    expect(minutesText(null)).toBe('Chưa có');
    expect(minutesText(12)).toBe('12 phút');
    expect(minutesText(60)).toBe('1 giờ');
    expect(minutesText(75)).toBe('1 giờ 15 phút');
  });
});

describe('ratioRows', () => {
  const labels = { a: 'A', b: 'B', c: 'C' };
  it('keeps the order, adds up to 100 and scales the bars to the biggest', () => {
    const rows = ratioRows({ a: 1, b: 1, c: 1 }, ['c', 'a', 'b'], labels);
    expect(rows.map((r) => r.key)).toEqual(['c', 'a', 'b']);
    expect(rows.reduce((n, r) => n + r.share, 0)).toBe(100);
    expect(ratioRows({ a: 6, b: 3, c: 0 }, ['a', 'b', 'c'], labels).map((r) => r.fill)).toEqual([1, 0.5, 0]);
  });
  it('is all zeros, never NaN, when nothing was counted', () => {
    for (const r of ratioRows({ a: 0, b: 0, c: 0 }, ['a', 'b', 'c'], labels)) {
      expect(r.share).toBe(0);
      expect(r.fill).toBe(0);
      expect(Number.isNaN(r.fill)).toBe(false);
    }
  });
});

describe('headlines', () => {
  it('lists the four numbers in order with their comparison', () => {
    const h = headlines(report());
    expect(h.map((x) => x.key)).toEqual(['scheduled', 'received', 'newCustomers', 'admitted']);
    expect(h.map((x) => x.label)).toEqual(['Lịch đã hẹn', 'Yêu cầu nhận', 'Khách mới', 'Lượt nhập nội trú']);
    expect(h.map((x) => x.value)).toEqual([42, 25, 7, 5]);
    expect(h.map((x) => x.delta)).toEqual(['nhiều hơn kỳ trước 3', 'ít hơn kỳ trước 5', 'kỳ trước chưa có', 'bằng kỳ trước']);
  });
});

describe('attentionItems', () => {
  it('lists what needs attention, with links when the person may open them', () => {
    const items = attentionItems(report(), all);
    expect(items.map((i) => i.key)).toEqual(['requests', 'out', 'low', 'soon', 'expired']);
    expect(items.map((i) => i.text)).toEqual([
      '5 yêu cầu đang chờ xử lý', '1 món kho đã hết hàng', '3 món kho sắp hết', '1 món sắp hết hạn', '1 món đã hết hạn',
    ]);
    expect(items.map((i) => i.to)).toEqual(['/nv/yeu-cau', '/nv/kho?tt=het', '/nv/kho?tt=sap-het', '/nv/kho?tt=han', '/nv/kho?tt=han']);
  });
  it('leaves out lines that are 0 and shows plain text without the right to open the page', () => {
    expect(attentionItems(zero(), all)).toEqual([]);
    const plain = attentionItems(report(), none);
    expect(plain).toHaveLength(5);
    expect(plain.every((i) => i.to === undefined)).toBe(true);
    const stockOnly = attentionItems(report(), (c) => (Array.isArray(c) ? c : [c]).includes('stock.view'));
    expect(stockOnly.find((i) => i.key === 'requests')?.to).toBeUndefined();
    expect(stockOnly.find((i) => i.key === 'out')?.to).toBe('/nv/kho?tt=het');
  });
});

describe('isEmptyPeriod and showRevenue', () => {
  it('is empty only when nothing at all happened in the period', () => {
    expect(isEmptyPeriod(zero())).toBe(true);
    expect(isEmptyPeriod(report())).toBe(false);
    expect(isEmptyPeriod({ ...zero(), customers: { newCustomers: 1, previousNewCustomers: 0 } })).toBe(false);
    expect(isEmptyPeriod({ ...zero(), inpatient: { ...zero().inpatient, discharged: 1 } })).toBe(false);
  });
  it('shows the money block only when the report carries it', () => {
    expect(showRevenue(report())).toBe(false);
    expect(showRevenue(report({ revenue: { collected: 1, invoiced: 2, outstanding: 3, previousCollected: 0 } }))).toBe(true);
  });
});

describe('appointmentSummary and inpatientCells', () => {
  it('writes the appointment sentence', () => {
    expect(appointmentSummary(zero().appointments)).toBe('Chưa có lịch nào trong kỳ.');
    expect(appointmentSummary(report().appointments)).toBe('Đã hẹn 42 lịch, đã hủy 6 (12,5%).');
  });
  it('explains the inpatient numbers and says "Chưa có" for a missing rate', () => {
    const cells = inpatientCells(report().inpatient);
    expect(cells.map((c) => c.key)).toEqual(['current', 'moves', 'bedDays', 'occupancy']);
    expect(cells.map((c) => c.value)).toEqual(['4', '5 nhập, 3 xuất', '12,5 ngày', '30%']);
    expect(cells.find((c) => c.key === 'bedDays')?.note).toBe('Tổng số ngày các bé đã ở nội trú trong kỳ.');
    expect(cells.find((c) => c.key === 'occupancy')?.note).toBe('Phần chuồng có bé ở, tính theo cả kỳ.');
    expect(inpatientCells(zero().inpatient).find((c) => c.key === 'occupancy')?.value).toBe('Chưa có');
  });
});
