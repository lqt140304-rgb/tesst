import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../testing';
import { ValidationError } from '../../contracts/errors';
import type { BookingInput } from '../../contracts/public';
import { BOOKING_MSG } from '../../rules/booking';

// "Now" in tests is 2026-10-19 09:00 (Vietnam).
const input: BookingInput = {
  contact_name: 'Hoàng Minh', phone: '0987 654 321', pet_name: 'Bánh Bao', species: 'dog', service: 'spa', desired_date: '2026-10-22', consent: true,
};
const NOTE = 'Ghi chú nội bộ rất riêng';
const fields = async (p: Promise<unknown>) => ((await p.catch((e) => e)) as ValidationError).fields;

/** The manager enters the closed days, then signs out so the test continues as a guest. */
async function withClosed(days: { date: string; note?: string }[]) {
  const t = makeTestApi();
  await loginAs(t.api, 'quanly_ha');
  await t.api.staff.settings.update(1, { closed_days: days });
  await t.api.auth.logout();
  return t;
}

describe('public.bookings.closedDays', () => {
  it('lists the days from today on, sorted, as dates only (never the staff note); a guest may read it', async () => {
    const { api } = await withClosed([{ date: '2026-12-25', note: NOTE }, { date: '2026-10-10', note: NOTE }, { date: '2026-10-22', note: NOTE }, { date: '2026-10-19', note: NOTE }]);
    const days = await api.public.bookings.closedDays();
    expect(days).toEqual(['2026-10-19', '2026-10-22', '2026-12-25']);
    expect(JSON.stringify(days)).not.toContain(NOTE);
  });
  it('is empty when nothing is set, and follows a later change at once', async () => {
    const t = makeTestApi();
    expect(await t.api.public.bookings.closedDays()).toEqual([]);
    await loginAs(t.api, 'quanly_ha');
    await t.api.staff.settings.update(1, { closed_days: [{ date: '2026-10-30' }] });
    await t.api.auth.logout();
    expect(await t.api.public.bookings.closedDays()).toEqual(['2026-10-30']);
  });
});

describe('customers cannot book or ask to move onto a closed day', () => {
  it('a guest booking on a closed day is refused on desired_date, with no note in the message, and nothing is saved', async () => {
    const { api, db } = await withClosed([{ date: '2026-10-22', note: NOTE }]);
    const n = db.read().t.booking_requests.length;
    const f = await fields(api.public.bookings.submit(input));
    expect(f).toEqual({ desired_date: BOOKING_MSG.closed });
    expect(BOOKING_MSG.closed).toBe('Ngày này Lê Sơn nghỉ. Bạn chọn ngày khác giúp nhé.');
    expect(JSON.stringify(f)).not.toContain(NOTE);
    expect(db.read().t.booking_requests).toHaveLength(n);
  });
  it('today being closed is refused too, but a past date still says it has passed', async () => {
    const { api } = await withClosed([{ date: '2026-10-19' }, { date: '2026-10-10' }]);
    expect(await fields(api.public.bookings.submit({ ...input, desired_date: '2026-10-19' }))).toEqual({ desired_date: BOOKING_MSG.closed });
    expect(await fields(api.public.bookings.submit({ ...input, desired_date: '2026-10-10' }))).toEqual({ desired_date: BOOKING_MSG.datePast });
  });
  it('a signed-in customer is refused the same way, and another day is fine', async () => {
    const t = await withClosed([{ date: '2026-10-22' }]);
    await loginAs(t.api, 'lan_nguyen');
    expect(await fields(t.api.public.bookings.submit(input))).toEqual({ desired_date: BOOKING_MSG.closed });
    await expect(t.api.public.bookings.submit({ ...input, desired_date: '2026-10-23' })).resolves.toEqual({ ok: true });
  });
  it('after the manager removes the day, booking works again', async () => {
    const t = await withClosed([{ date: '2026-10-22' }]);
    await loginAs(t.api, 'quanly_ha');
    await t.api.staff.settings.update(2, { closed_days: [] });
    await t.api.auth.logout();
    await expect(t.api.public.bookings.submit(input)).resolves.toEqual({ ok: true });
  });
  it('asking to move an appointment onto a closed day is refused on desired_date', async () => {
    const t = await withClosed([{ date: '2026-10-25', note: NOTE }]);
    await loginAs(t.api, 'lan_nguyen');
    const bong = (await t.api.customer.appointments.list()).upcoming.find((r) => r.petName === 'Bông')!;
    const rev = t.db.read().rev;
    expect(await fields(t.api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-25' }))).toEqual({ desired_date: BOOKING_MSG.closed });
    expect(t.db.read().rev).toBe(rev);
    await expect(t.api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-26' })).resolves.toBeUndefined();
  });
});

describe('staff are only warned, never blocked', () => {
  it('creating, moving and confirming onto a closed day all go through', async () => {
    const t = makeTestApi();
    await loginAs(t.api, 'quanly_ha');
    await t.api.staff.settings.update(1, { closed_days: [{ date: '2026-10-22' }, { date: '2026-10-26' }, { date: '2026-10-27' }] });
    const id = await t.api.staff.appointments.create({ customer_id: 'cus-05', pet_id: 'pet-lu', service: 'kham', start_at: '2026-10-26T09:00:00+07:00', duration_min: 30, source: 'phone' });
    const a = t.db.read().t.appointments.find((x) => x.id === id)!;
    await t.api.staff.appointments.reschedule(id, a.version, { start_at: '2026-10-27T10:00:00+07:00' });
    expect(t.db.read().t.appointments.find((x) => x.id === id)!.start_at).toBe('2026-10-27T10:00:00+07:00');
    const r = t.db.read().t.booking_requests.find((x) => x.code === 'YC-0236')!;
    await t.api.staff.requests.confirm(r.id, r.version, { start_at: '2026-10-22T09:00:00+07:00', duration_min: 30, assignee_id: 'stf-mai', customer: { existingId: 'cus-09' }, pet: { existingId: 'pet-na' } });
    expect(t.db.read().t.booking_requests.find((x) => x.code === 'YC-0236')!.status).toBe('confirmed');
    // What the screens use to warn:
    const { closed_days } = (await t.api.staff.settings.get()).values;
    expect(closed_days.map((d) => d.date)).toEqual(['2026-10-22', '2026-10-26', '2026-10-27']);
  });
});
