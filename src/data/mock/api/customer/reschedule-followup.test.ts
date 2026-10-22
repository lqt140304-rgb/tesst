import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../contracts/errors';
import { RESCHEDULE_OUTCOME_MSG } from '../../../rules/booking';

// "Now" in tests is 2026-10-19 09:00 (Vietnam). Lan's "Bông" appointment is on 21/10 at 15:00.
const NOTE = 'Ghi chú nội bộ của nhân viên';
const fields = async (p: Promise<unknown>) => ((await p.catch((e) => e)) as ValidationError).fields;

async function setup() {
  const t = makeTestApi();
  await loginAs(t.api, 'lan_nguyen');
  const bong = (await t.api.customer.appointments.list()).upcoming.find((r) => r.petName === 'Bông')!;
  const rowOf = async () => (await t.api.customer.appointments.list()).upcoming.find((r) => r.id === bong.id)!;
  return { ...t, bong, rowOf };
}

describe('the customer takes a reschedule request back', () => {
  it('a pending request is cancelled, the appointment stays, and the customer may ask again', async () => {
    const { api, db, bong, rowOf } = await setup();
    await api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-25' });
    await api.customer.appointments.cancelReschedule(bong.id);
    expect(db.read().t.reschedule_requests[0]).toMatchObject({ status: 'cancelled' });
    expect(db.read().t.reschedule_requests[0]!.closed_at).toBeTruthy();
    const row = await rowOf();
    expect(row.rescheduleRequest).toBeUndefined();
    expect(row.rescheduleOutcome).toBeUndefined();   // taking it back is not news
    expect(row.appointmentAt).toBe('2026-10-21T15:00:00+07:00');
    expect(db.read().t.audit_events.at(-1)).toMatchObject({ action: 'reschedule.withdraw', actor_type: 'customer' });
    await api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-26' });
    await loginAs(api, 'quanly_ha');
    expect((await api.staff.requests.reschedules()).map((r) => r.desiredDate)).toEqual(['2026-10-26']);
  });
  it('with nothing pending, or on someone else\'s appointment, or for an unknown id, it is refused', async () => {
    const { api, db, bong } = await setup();
    const rev = db.read().rev;
    expect(await fields(api.customer.appointments.cancelReschedule(bong.id))).toEqual({ appointment: 'Lịch hẹn này không có yêu cầu đổi lịch nào đang chờ.' });
    await expect(api.customer.appointments.cancelReschedule('nope')).rejects.toThrow(NotFoundError);
    await api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-25' });
    await loginAs(api, 'thuy_pham');
    await expect(api.customer.appointments.cancelReschedule(bong.id)).rejects.toThrow(NotFoundError);
    expect(db.read().t.reschedule_requests[0]!.status).toBe('pending');
    expect(db.read().rev).not.toBe(rev);
  });
  it('a request staff already closed cannot be taken back', async () => {
    const { api, bong } = await setup();
    await api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-25' });
    await loginAs(api, 'quanly_ha');
    const [r] = await api.staff.requests.reschedules();
    await api.staff.requests.keepAppointment(r!.id);
    await loginAs(api, 'lan_nguyen');
    expect(Object.keys(await fields(api.customer.appointments.cancelReschedule(bong.id)))).toEqual(['appointment']);
  });
  it('a signed-out visitor and a staff member are refused', async () => {
    const t = makeTestApi();
    await expect(t.api.customer.appointments.cancelReschedule('x')).rejects.toThrow(ForbiddenError);
    await loginAs(t.api, 'quanly_ha');
    await expect(t.api.customer.appointments.cancelReschedule('x')).rejects.toThrow(ForbiddenError);
  });
});

describe('the customer is told how it ended, in fixed words', () => {
  it('moved: one sentence on the row, for 7 days, and a line in the bell; no staff name, time or note', async () => {
    const { api, db, bong, rowOf, setNow } = await setup();
    await api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-25' });
    await loginAs(api, 'quanly_ha');
    const [r] = await api.staff.requests.reschedules();
    const apt = (await api.staff.appointments.listRange('2026-10-21', '2026-10-21')).find((a) => a.id === r!.appointmentId)!;
    await api.staff.appointments.reschedule(apt.id, apt.version, { start_at: '2026-10-25T14:30:00+07:00', reason: NOTE });
    await loginAs(api, 'lan_nguyen');
    const row = await rowOf();
    expect(row.rescheduleOutcome).toEqual({ status: 'done', message: RESCHEDULE_OUTCOME_MSG.done, closedAt: '2026-10-19T09:00:00+07:00' });
    expect(RESCHEDULE_OUTCOME_MSG.done).toBe('Lê Sơn đã đổi lịch hẹn cho bạn.');
    const json = JSON.stringify(row.rescheduleOutcome) + JSON.stringify(await api.customer.updates.list());
    expect(json).not.toContain(NOTE);
    for (const u of db.read().t.staff_users) expect(json).not.toContain(u.display_name);
    expect((await api.customer.updates.list()).find((u) => u.text === 'Lịch hẹn của bé Bông đã được đổi')).toMatchObject({ kind: 'request', unseen: true });
    setNow('2026-10-26T09:00:00+07:00');   // exactly 7 days: still shown
    expect((await api.customer.appointments.list()).upcoming.concat((await api.customer.appointments.list()).past).find((x) => x.id === bong.id)?.rescheduleOutcome).toBeDefined();
    setNow('2026-10-26T09:01:00+07:00');
    expect((await api.customer.appointments.list()).past.concat((await api.customer.appointments.list()).upcoming).find((x) => x.id === bong.id)?.rescheduleOutcome).toBeUndefined();
  });
  it('kept: the old time stays and the sentence points to the hotline; the staff note is never shown', async () => {
    const { api, bong, rowOf } = await setup();
    await api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-25' });
    await loginAs(api, 'bacsi_duc');
    const [r] = await api.staff.requests.reschedules();
    await api.staff.requests.keepAppointment(r!.id, { note: NOTE });
    await loginAs(api, 'lan_nguyen');
    const row = await rowOf();
    expect(row.rescheduleOutcome).toMatchObject({ status: 'kept', message: RESCHEDULE_OUTCOME_MSG.kept });
    expect(RESCHEDULE_OUTCOME_MSG.kept).toBe('Lê Sơn giữ lịch hẹn cũ. Nếu bạn cần đổi, hãy gọi hotline giúp nhé.');
    expect(row.appointmentAt).toBe('2026-10-21T15:00:00+07:00');
    expect(JSON.stringify(row) + JSON.stringify(await api.customer.updates.list())).not.toContain(NOTE);
    expect((await api.customer.updates.list()).find((u) => u.text === 'Lê Sơn giữ lịch hẹn cũ của bé Bông')).toMatchObject({ kind: 'request' });
  });
  it('a new pending request replaces the old outcome; a cancelled appointment shows none', async () => {
    const { api, bong, rowOf } = await setup();
    await api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-25' });
    await loginAs(api, 'quanly_ha');
    const [r] = await api.staff.requests.reschedules();
    await api.staff.requests.keepAppointment(r!.id);
    await loginAs(api, 'lan_nguyen');
    await api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-27' });
    const row = await rowOf();
    expect(row.rescheduleRequest).toBeDefined();
    expect(row.rescheduleOutcome).toBeUndefined();
  });
});

describe('staff see which reschedule requests are late', () => {
  it('uses the same number of hours as booking requests (24 by default), counted from when the customer asked', async () => {
    const { api, bong, setNow } = await setup();
    await api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-25' });
    await loginAs(api, 'quanly_ha');
    expect((await api.staff.requests.reschedules())[0]!.overdue).toBe(false);
    setNow('2026-10-20T09:00:00+07:00');   // exactly 24 h
    expect((await api.staff.requests.reschedules())[0]!.overdue).toBe(false);
    setNow('2026-10-20T09:01:00+07:00');
    expect((await api.staff.requests.reschedules())[0]!.overdue).toBe(true);
    await api.staff.settings.update(1, { request_overdue_hours: 48 });
    expect((await api.staff.requests.reschedules())[0]!.overdue).toBe(false);
  });
});
