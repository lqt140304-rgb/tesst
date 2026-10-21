import { describe, expect, it } from 'vitest';
import { appointmentStats, countInRange, inpatientStats, requestStats, type ApptRow, type RequestEventRow, type RequestRow, type StayRow } from './operations-report';

const D = (day: string, hhmm = '09:00') => `${day}T${hhmm}:00+07:00`;
const people = [{ id: 'a1', name: 'An' }, { id: 'a2', name: 'Bình' }];
const range = { from: '2026-10-19', to: '2026-10-20' };
const prev = { from: '2026-10-17', to: '2026-10-18' };

describe('countInRange', () => {
  it('counts Vietnam days, including a UTC stamp at 17:00 as the next day', () => {
    expect(countInRange([D('2026-10-19', '23:59'), D('2026-10-20', '00:00'), '2026-10-19T17:00:00Z', D('2026-10-21', '00:00'), D('2026-10-18', '23:59')], range)).toBe(3);
  });
});

describe('appointmentStats', () => {
  const rows: ApptRow[] = [
    { start_at: D('2026-10-19', '23:59'), status: 'scheduled', service: 'kham', source: 'phone', assignee_id: 'a1' },
    { start_at: D('2026-10-20', '00:00'), status: 'scheduled', service: 'spa', source: 'walk_in', assignee_id: 'a2' },
    { start_at: D('2026-10-20', '09:00'), status: 'cancelled', service: 'kham', source: 'phone', assignee_id: 'a1' },
    { start_at: D('2026-10-21', '00:00'), status: 'scheduled', service: 'kham', source: 'phone', assignee_id: 'a1' },
    { start_at: D('2026-10-18', '10:00'), status: 'scheduled', service: 'kham', source: 'phone', assignee_id: 'a1' },
    { start_at: D('2026-10-19', '10:00'), status: 'scheduled', service: 'kham', source: 'web_request' },
    { start_at: '2026-10-19T17:00:00Z', status: 'scheduled', service: 'kham', source: 'phone', assignee_id: 'a1' },
  ];
  it('counts scheduled and cancelled inside the range only, and every group adds up to scheduled', () => {
    const r = appointmentStats(rows, people, range, prev);
    expect(r).toMatchObject({ scheduled: 4, cancelled: 1, total: 5, cancelRate: 0.2, previousScheduled: 1 });
    expect(r.daily).toEqual([{ date: '2026-10-19', count: 2 }, { date: '2026-10-20', count: 2 }]);
    expect(r.byService).toEqual({ kham: 3, spa: 1, noi_tru: 0 });
    expect(r.bySource).toEqual({ phone: 2, walk_in: 1, web_request: 1 });
    expect(r.byAssignee).toEqual([{ id: 'a1', name: 'An', count: 2 }, { id: 'a2', name: 'Bình', count: 1 }, { id: null, name: 'Chưa phân công', count: 1 }]);
    const sums = [r.daily.reduce((n, d) => n + d.count, 0), Object.values(r.byService).reduce((n, c) => n + c, 0), Object.values(r.bySource).reduce((n, c) => n + c, 0), r.byAssignee.reduce((n, a) => n + a.count, 0)];
    for (const total of sums) expect(total).toBe(r.scheduled);
  });
  it('nothing in range: zeros, null rate, every day still listed', () => {
    const r = appointmentStats([], people, range, prev);
    expect(r).toMatchObject({ scheduled: 0, cancelled: 0, total: 0, cancelRate: null, byAssignee: [], previousScheduled: 0 });
    expect(r.daily).toEqual([{ date: '2026-10-19', count: 0 }, { date: '2026-10-20', count: 0 }]);
  });
  it('an assignee missing from the list is named "Không rõ"', () => {
    const one: ApptRow[] = [{ start_at: D('2026-10-19'), status: 'scheduled', service: 'kham', source: 'phone', assignee_id: 'zz' }];
    expect(appointmentStats(one, people, range, prev).byAssignee).toEqual([{ id: 'zz', name: 'Không rõ', count: 1 }]);
  });
});

describe('requestStats (range 19/10, previous 18/10)', () => {
  const r19 = { from: '2026-10-19', to: '2026-10-19' };
  const p18 = { from: '2026-10-18', to: '2026-10-18' };
  const rows: RequestRow[] = [
    { id: 'r1', created_at: D('2026-10-19', '08:00'), status: 'pending' },
    { id: 'r2', created_at: D('2026-10-19', '09:00'), status: 'confirmed' },
    { id: 'r3', created_at: D('2026-10-19', '23:30'), status: 'contacting' },
    { id: 'r4', created_at: D('2026-10-18', '10:00'), status: 'rejected' },
    { id: 'r5', created_at: D('2026-10-20', '00:10'), status: 'pending' },
  ];
  const events: RequestEventRow[] = [
    { request_id: 'r2', actor_type: 'staff', at: D('2026-10-19', '10:00') },
    { request_id: 'r2', actor_type: 'guest', at: D('2026-10-19', '09:00') },
    { request_id: 'r2', actor_type: 'staff', at: D('2026-10-19', '09:30') },
    { request_id: 'r3', actor_type: 'staff', at: D('2026-10-19', '23:45') },
  ];
  it('received, by status, confirm rate, first response (earliest staff event, rounded), waiting now, previous', () => {
    const r = requestStats(rows, events, r19, p18);
    expect(r.received).toBe(3);
    expect(r.byStatus).toEqual({ pending: 1, contacting: 1, confirmed: 1, unreachable: 0, cancelled: 0, rejected: 0 });
    expect(r.confirmRate).toBeCloseTo(1 / 3, 10);
    expect(r.avgFirstResponseMin).toBe(23); // (30 + 15) / 2 = 22.5 → 23
    expect(r.waitingNow).toBe(3); // r1, r3, r5 — not limited to the range
    expect(r.previousReceived).toBe(1);
  });
  it('no requests, or none answered: null rates and averages, never 0 or NaN', () => {
    expect(requestStats([], [], r19, p18)).toMatchObject({ received: 0, confirmRate: null, avgFirstResponseMin: null, waitingNow: 0, previousReceived: 0 });
    expect(requestStats([rows[0]!], [], r19, p18)).toMatchObject({ received: 1, confirmRate: 0, avgFirstResponseMin: null });
  });
});

describe('inpatientStats (now 20/10 12:00)', () => {
  const now = new Date(D('2026-10-20', '12:00'));
  const r = { from: '2026-10-19', to: '2026-10-21' };
  const p = { from: '2026-10-16', to: '2026-10-18' };
  const stays: StayRow[] = [
    { admitted_at: D('2026-10-18', '12:00') },
    { admitted_at: D('2026-10-19', '06:00'), discharged_at: D('2026-10-19', '18:00') },
    { admitted_at: D('2026-10-10', '09:00'), discharged_at: D('2026-10-12', '09:00') },
    { admitted_at: D('2026-10-17', '20:00'), discharged_at: D('2026-10-19', '04:00') },
  ];
  it('counts admissions and discharges by day, current stays, bed-days and occupancy up to now', () => {
    const s = inpatientStats(stays, 2, r, p, now);
    expect(s).toMatchObject({ admitted: 1, discharged: 2, currentlyAdmitted: 1, previousAdmitted: 2 });
    expect(s.bedDays).toBe(2.2); // (36 + 12 + 4) h = 52 h = 2.17 days
    expect(s.occupancyRate).toBeCloseTo(52 / (2 * 36), 6); // elapsed 19/10 00:00 → 20/10 12:00 = 36 h
  });
  it('a range wholly in the future, or no active cages: null occupancy, no bed-days', () => {
    expect(inpatientStats(stays, 2, { from: '2026-10-25', to: '2026-10-26' }, { from: '2026-10-23', to: '2026-10-24' }, now)).toMatchObject({ bedDays: 0, occupancyRate: null });
    expect(inpatientStats(stays, 0, r, p, now).occupancyRate).toBeNull();
  });
  it('a stay not yet admitted at "now" is not counted as current', () => {
    expect(inpatientStats([{ admitted_at: D('2026-10-21', '09:00') }], 2, r, p, now).currentlyAdmitted).toBe(0);
  });
});
