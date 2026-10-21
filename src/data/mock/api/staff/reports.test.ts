import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { ForbiddenError } from '../../../contracts/errors';
import { RANGE_MSG } from '../../../rules/calendar';

// "Now" in tests is 2026-10-19 09:00 (Vietnam). The figures below come from plain filters over the sample tables.
const A = { from: '2026-10-19', to: '2026-10-25' };
const B = { from: '2026-10-12', to: '2026-10-18' };

async function manager() {
  const t = makeTestApi();
  await loginAs(t.api, 'quanly_ha');
  return t;
}

describe('operations report', () => {
  it('week of 19/10: appointments', async () => {
    const { api } = await manager();
    const r = await api.staff.reports.operations(A);
    expect(r).toMatchObject({ from: A.from, to: A.to, previous: B });
    expect(r.appointments).toMatchObject({
      scheduled: 24, cancelled: 0, total: 24, cancelRate: 0, previousScheduled: 14,
      byService: { kham: 13, spa: 11, noi_tru: 0 }, bySource: { phone: 19, walk_in: 2, web_request: 3 },
    });
    expect(r.appointments.daily).toHaveLength(7);
    expect(r.appointments.daily[0]).toEqual({ date: '2026-10-19', count: 7 });
    expect(r.appointments.byAssignee).toEqual([
      { id: 'stf-ngocanh', name: 'Lê Ngọc Anh', count: 11 }, { id: 'stf-mai', name: 'BS. Phạm Thanh Mai', count: 6 },
      { id: 'stf-duc', name: 'BS. Trần Minh Đức', count: 6 }, { id: null, name: 'Chưa phân công', count: 1 },
    ]);
  });

  it('week of 19/10: requests, inpatient, customers, stock', async () => {
    const { api } = await manager();
    const r = await api.staff.reports.operations(A);
    expect(r.requests).toEqual({
      received: 3, byStatus: { pending: 3, contacting: 0, confirmed: 0, unreachable: 0, cancelled: 0, rejected: 0 },
      confirmRate: 0, avgFirstResponseMin: null, waitingNow: 12, previousReceived: 17,
    });
    expect(r.inpatient).toMatchObject({ admitted: 1, discharged: 0, currentlyAdmitted: 5, bedDays: 1.6, previousAdmitted: 4 });
    expect(r.inpatient.occupancyRate).toBeCloseTo(39 / 108, 6); // 12 cages × 9 h elapsed; four stays × 9 h + one admitted 06:00 × 3 h
    expect(r.customers).toEqual({ newCustomers: 0, previousNewCustomers: 0 });
    expect(r.stock).toEqual({ low: 3, out: 1, expiringSoon: 1, expired: 1 });
  });

  it('the week before: cancelled lines, statuses, first response, bed-days over a finished range', async () => {
    const { api } = await manager();
    const r = await api.staff.reports.operations(B);
    expect(r.appointments).toMatchObject({
      scheduled: 14, cancelled: 2, total: 16, cancelRate: 0.125, byService: { kham: 11, spa: 3, noi_tru: 0 }, bySource: { phone: 9, walk_in: 3, web_request: 2 },
    });
    expect(r.requests).toMatchObject({ received: 17, byStatus: { pending: 2, contacting: 3, confirmed: 5, unreachable: 4, cancelled: 2, rejected: 1 }, avgFirstResponseMin: 321 });
    expect(r.requests.confirmRate).toBeCloseTo(5 / 17, 10);
    expect(r.inpatient).toMatchObject({ admitted: 4, discharged: 0, bedDays: 8.2, previousAdmitted: 0 });
    expect(r.inpatient.occupancyRate).toBeCloseTo(197.0833 / 2016, 4);
  });

  it('a single day; and the previous period of one range is the scheduled count of the one before', async () => {
    const { api } = await manager();
    const day = await api.staff.reports.operations({ from: '2026-10-19', to: '2026-10-19' });
    expect(day.appointments).toMatchObject({ scheduled: 7, byService: { kham: 5, spa: 2, noi_tru: 0 } });
    expect(day.appointments.daily).toHaveLength(1);
    expect(day.requests.received).toBe(3);
    expect((await api.staff.reports.operations(A)).appointments.previousScheduled).toBe((await api.staff.reports.operations(B)).appointments.scheduled);
  });

  it('the previous period of one day is the day before, and of a month is the month-length period before', async () => {
    const { api } = await manager();
    const day = await api.staff.reports.operations({ from: '2026-10-19', to: '2026-10-19' });
    expect(day.previous).toEqual({ from: '2026-10-18', to: '2026-10-18' });
    expect(day.appointments.previousScheduled).toBe((await api.staff.reports.operations({ from: '2026-10-18', to: '2026-10-18' })).appointments.scheduled);
    expect((await api.staff.reports.operations({ from: '2026-11-01', to: '2026-11-30' })).previous).toEqual({ from: '2026-10-02', to: '2026-10-31' });
  });

  it('the money block matches reports.revenue and the stock block matches stock.summary; nothing is written', async () => {
    const { api, db } = await manager();
    const rev = await api.staff.reports.revenue(A);
    const prevRev = await api.staff.reports.revenue(B);
    const sum = await api.staff.stock.summary();
    const before = db.read().rev;
    const r = await api.staff.reports.operations(A);
    expect(r.revenue).toEqual({ collected: rev.collected, invoiced: rev.invoiced, outstanding: rev.outstanding, previousCollected: prevRev.collected });
    expect(r.stock).toEqual({ low: sum.low, out: sum.out, expiringSoon: sum.expiringSoon, expired: sum.expired });
    expect(db.read().rev).toBe(before);
  });

  it('a range wholly in the future: no occupancy, no bed-days, no past figures', async () => {
    const { api } = await manager();
    const r = await api.staff.reports.operations({ from: '2027-01-01', to: '2027-01-07' });
    expect(r.inpatient).toMatchObject({ bedDays: 0, occupancyRate: null, admitted: 0 });
    expect(r.appointments).toMatchObject({ scheduled: 0, cancelRate: null });
    expect(r.requests).toMatchObject({ received: 0, confirmRate: null, avgFirstResponseMin: null });
  });

  it('refuses bad ranges on the right field', async () => {
    const { api } = await manager();
    await expect(api.staff.reports.operations({ from: '2026-02-30', to: '2026-10-19' })).rejects.toMatchObject({ fields: { from: RANGE_MSG.date } });
    await expect(api.staff.reports.operations({ from: '2026-10-20', to: '2026-10-19' })).rejects.toMatchObject({ fields: { to: RANGE_MSG.order } });
    await expect(api.staff.reports.operations({ from: '2024-01-01', to: '2025-01-01' })).rejects.toMatchObject({ fields: { to: RANGE_MSG.span } });
  });
});

describe('operations report permissions', () => {
  it.each(['bacsi_duc', 'bacsi_mai', 'spa_ngocanh', 'lan_nguyen'])('%s is refused', async (who) => {
    const { api } = makeTestApi();
    await loginAs(api, who);
    await expect(api.staff.reports.operations(A)).rejects.toThrow(ForbiddenError);
  });

  it('a signed-out visitor is refused', async () => {
    await expect(makeTestApi().api.staff.reports.operations(A)).rejects.toThrow(ForbiddenError);
  });

  it('reports.operations alone shows the figures but not the money block; adding reports.revenue shows it; revenue alone is refused', async () => {
    const { api, db } = makeTestApi();
    const grant = (caps: ('reports.operations' | 'reports.revenue')[]) => db.transact('t', (d) => { d.t.staff_users.find((u) => u.id === 'stf-duc')!.extra_capabilities = caps; });
    await loginAs(api, 'bacsi_duc');
    grant(['reports.operations']);
    expect((await api.staff.reports.operations(A)).revenue).toBeUndefined();
    grant(['reports.operations', 'reports.revenue']);
    expect((await api.staff.reports.operations(A)).revenue).toBeDefined();
    grant(['reports.revenue']);
    await expect(api.staff.reports.operations(A)).rejects.toThrow(ForbiddenError);
  });
});
