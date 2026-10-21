import { APPOINTMENT_SOURCES, REQUEST_STATUSES, SERVICES, type AppointmentSource, type RequestStatus, type Service } from '../contracts/enums';
import type { OpsAppointments, OpsInpatient, OpsRange, OpsRequests } from '../contracts/staff';
import { addDays, dayOf } from '../../lib/dates';
import { daysInclusive } from './calendar';
import { OPEN_REQUEST_STATUSES } from './request-status';

export type ApptRow = { start_at: string; status: 'scheduled' | 'cancelled'; service: Service; source: AppointmentSource; assignee_id?: string };
export type RequestRow = { id: string; created_at: string; status: RequestStatus };
export type RequestEventRow = { request_id: string; actor_type: string; at: string };
export type StayRow = { admitted_at: string; discharged_at?: string };

const MS_DAY = 86_400_000;
const MS_MIN = 60_000;
const dayStart = (day: string) => Date.parse(`${day}T00:00:00+07:00`);
const inRange = (iso: string | undefined, r: OpsRange) => !!iso && dayOf(iso) >= r.from && dayOf(iso) <= r.to;
const ratio = (n: number, of: number) => (of > 0 ? n / of : null);
const tally = <K extends string>(keys: readonly K[], values: readonly K[]) => Object.fromEntries(keys.map((k) => [k, values.filter((v) => v === k).length])) as Record<K, number>;

/** Every day of the range, counted by number (never by comparing date text, which does not end past year 9999). */
const eachDay = (r: OpsRange): string[] => Array.from({ length: daysInclusive(r.from, r.to) }, (_, i) => addDays(r.from, i));

/** Instants whose Vietnam day falls in the range. */
export const countInRange = (isoDates: readonly string[], range: OpsRange) => isoDates.filter((d) => inRange(d, range)).length;

export function appointmentStats(rows: readonly ApptRow[], people: readonly { id: string; name: string }[], range: OpsRange, prev: OpsRange): OpsAppointments {
  const inside = rows.filter((a) => inRange(a.start_at, range));
  const live = inside.filter((a) => a.status === 'scheduled');
  const cancelled = inside.length - live.length;
  const perPerson = new Map<string | null, number>();
  for (const a of live) perPerson.set(a.assignee_id ?? null, (perPerson.get(a.assignee_id ?? null) ?? 0) + 1);
  const named = [...perPerson.entries()]
    .filter((e): e is [string, number] => e[0] !== null)
    .map(([id, count]) => ({ id, name: people.find((p) => p.id === id)?.name ?? 'Không rõ', count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));
  const unassigned = perPerson.get(null);
  return {
    scheduled: live.length, cancelled, total: inside.length, cancelRate: ratio(cancelled, inside.length),
    daily: eachDay(range).map((date) => ({ date, count: live.filter((a) => dayOf(a.start_at) === date).length })),
    byService: tally(SERVICES, live.map((a) => a.service)), bySource: tally(APPOINTMENT_SOURCES, live.map((a) => a.source)),
    byAssignee: unassigned ? [...named, { id: null, name: 'Chưa phân công', count: unassigned }] : named,
    previousScheduled: rows.filter((a) => a.status === 'scheduled' && inRange(a.start_at, prev)).length,
  };
}

export function requestStats(rows: readonly RequestRow[], events: readonly RequestEventRow[], range: OpsRange, prev: OpsRange): OpsRequests {
  const inside = rows.filter((r) => inRange(r.created_at, range));
  const byStatus = tally(REQUEST_STATUSES, inside.map((r) => r.status));
  // First answer = the earliest event a staff member made on the request.
  const minutes: number[] = [];
  for (const r of inside) {
    const firstStaff = events.filter((e) => e.request_id === r.id && e.actor_type === 'staff').map((e) => Date.parse(e.at)).sort((a, b) => a - b)[0];
    if (firstStaff !== undefined) minutes.push(Math.max(0, (firstStaff - Date.parse(r.created_at)) / MS_MIN));
  }
  return {
    received: inside.length, byStatus, confirmRate: ratio(byStatus.confirmed, inside.length),
    avgFirstResponseMin: minutes.length ? Math.round(minutes.reduce((n, m) => n + m, 0) / minutes.length) : null,
    waitingNow: rows.filter((r) => OPEN_REQUEST_STATUSES.includes(r.status)).length,
    previousReceived: rows.filter((r) => inRange(r.created_at, prev)).length,
  };
}

/** Bed-days and occupancy count only the time that has already passed (`now`), so a range that runs into the future is not under-reported. */
export function inpatientStats(stays: readonly StayRow[], activeCages: number, range: OpsRange, prev: OpsRange, now: Date): OpsInpatient {
  const start = dayStart(range.from);
  const cap = Math.min(dayStart(addDays(range.to, 1)), now.getTime());
  const elapsed = Math.max(0, cap - start);
  const overlap = stays.reduce((n, s) => {
    const lo = Math.max(Date.parse(s.admitted_at), start);
    const hi = Math.min(s.discharged_at ? Date.parse(s.discharged_at) : now.getTime(), cap);
    return n + Math.max(0, hi - lo);
  }, 0);
  return {
    admitted: stays.filter((s) => inRange(s.admitted_at, range)).length,
    discharged: stays.filter((s) => inRange(s.discharged_at, range)).length,
    currentlyAdmitted: stays.filter((s) => !s.discharged_at && Date.parse(s.admitted_at) <= now.getTime()).length,
    bedDays: Math.round((overlap / MS_DAY) * 10) / 10,
    occupancyRate: activeCages > 0 && elapsed > 0 ? overlap / (activeCages * elapsed) : null,
    previousAdmitted: stays.filter((s) => inRange(s.admitted_at, prev)).length,
  };
}
