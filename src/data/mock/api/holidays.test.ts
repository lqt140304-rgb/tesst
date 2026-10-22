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

/** The manager enters the holidays, then signs out so the test continues as a guest. */
async function withHolidays(days: { date: string; note?: string }[]) {
  const t = makeTestApi();
  await loginAs(t.api, 'quanly_ha');
  await t.api.staff.settings.update(1, { holidays: days });
  await t.api.auth.logout();
  return t;
}

describe('public.bookings.holidays', () => {
  it('lists the days from today on, sorted, as dates only (never the staff note); a guest may read it', async () => {
    const { api } = await withHolidays([{ date: '2026-12-25', note: NOTE }, { date: '2026-10-10', note: NOTE }, { date: '2026-10-22', note: NOTE }, { date: '2026-10-19', note: NOTE }]);
    const days = await api.public.bookings.holidays();
    expect(days).toEqual(['2026-10-19', '2026-10-22', '2026-12-25']);
    expect(JSON.stringify(days)).not.toContain(NOTE);
  });
  it('is empty when nothing is set, and follows a later change at once', async () => {
    const t = makeTestApi();
    expect(await t.api.public.bookings.holidays()).toEqual([]);
    await loginAs(t.api, 'quanly_ha');
    await t.api.staff.settings.update(1, { holidays: [{ date: '2026-10-30' }] });
    await t.api.auth.logout();
    expect(await t.api.public.bookings.holidays()).toEqual(['2026-10-30']);
  });
});

describe('on a holiday the hospital works until 19:00: customers can book, but not the 18:00–20:00 slot', () => {
  it('a guest choosing the late slot is refused on preferred_slot, with no note in the message, and nothing is saved', async () => {
    const { api, db } = await withHolidays([{ date: '2026-10-22', note: NOTE }]);
    const n = db.read().t.booking_requests.length;
    const f = await fields(api.public.bookings.submit({ ...input, preferred_slot: '18-20' }));
    expect(f).toEqual({ preferred_slot: BOOKING_MSG.holidaySlot });
    expect(JSON.stringify(f)).not.toContain(NOTE);
    expect(db.read().t.booking_requests).toHaveLength(n);
  });
  it('the same day with an earlier slot, or with no slot, is accepted and saved', async () => {
    const { api, db } = await withHolidays([{ date: '2026-10-22' }]);
    await expect(api.public.bookings.submit({ ...input, preferred_slot: '16-18' })).resolves.toEqual({ ok: true });
    await expect(api.public.bookings.submit({ ...input, pet_name: 'Mít', phone: '0987 000 111' })).resolves.toEqual({ ok: true });
    expect(db.read().t.booking_requests.filter((r) => r.snapshot.desired_date === '2026-10-22' && r.snapshot.pet_name !== 'Bánh Bao' && r.scope !== undefined)).not.toHaveLength(0);
    expect(db.read().t.booking_requests.find((r) => r.snapshot.pet_name === 'Bánh Bao')!.snapshot.preferred_slot).toBe('16-18');
  });
  it('today as a holiday works the same, and a past date still says it has passed', async () => {
    const { api } = await withHolidays([{ date: '2026-10-19' }, { date: '2026-10-10' }]);
    expect(await fields(api.public.bookings.submit({ ...input, desired_date: '2026-10-19', preferred_slot: '18-20' }))).toEqual({ preferred_slot: BOOKING_MSG.holidaySlot });
    expect(await fields(api.public.bookings.submit({ ...input, desired_date: '2026-10-10', preferred_slot: '18-20' }))).toEqual({ desired_date: BOOKING_MSG.datePast });
  });
  it('a signed-in customer is held to it too, and a normal day takes the late slot', async () => {
    const t = await withHolidays([{ date: '2026-10-22' }]);
    await loginAs(t.api, 'lan_nguyen');
    expect(await fields(t.api.public.bookings.submit({ ...input, preferred_slot: '18-20' }))).toEqual({ preferred_slot: BOOKING_MSG.holidaySlot });
    await expect(t.api.public.bookings.submit({ ...input, desired_date: '2026-10-23', preferred_slot: '18-20' })).resolves.toEqual({ ok: true });
  });
  it('after the manager removes the day, the late slot works again', async () => {
    const t = await withHolidays([{ date: '2026-10-22' }]);
    await loginAs(t.api, 'quanly_ha');
    await t.api.staff.settings.update(2, { holidays: [] });
    await t.api.auth.logout();
    await expect(t.api.public.bookings.submit({ ...input, preferred_slot: '18-20' })).resolves.toEqual({ ok: true });
  });
  it('asking to move an appointment: the late slot on a holiday is refused, an earlier one is fine', async () => {
    const t = await withHolidays([{ date: '2026-10-25', note: NOTE }]);
    await loginAs(t.api, 'lan_nguyen');
    const bong = (await t.api.customer.appointments.list()).upcoming.find((r) => r.petName === 'Bông')!;
    const rev = t.db.read().rev;
    expect(await fields(t.api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-25', preferred_slot: '18-20' }))).toEqual({ preferred_slot: BOOKING_MSG.holidaySlot });
    expect(t.db.read().rev).toBe(rev);
    await expect(t.api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-25', preferred_slot: '10-12' })).resolves.toBeUndefined();
  });
});

describe('staff are only warned, never blocked', () => {
  it('creating, moving and confirming on a holiday, even after 19:00, all go through', async () => {
    const t = makeTestApi();
    await loginAs(t.api, 'quanly_ha');
    await t.api.staff.settings.update(1, { holidays: [{ date: '2026-10-22' }, { date: '2026-10-26' }, { date: '2026-10-27' }] });
    const id = await t.api.staff.appointments.create({ customer_id: 'cus-05', pet_id: 'pet-lu', service: 'kham', start_at: '2026-10-26T19:30:00+07:00', duration_min: 30, source: 'phone' });
    const a = t.db.read().t.appointments.find((x) => x.id === id)!;
    await t.api.staff.appointments.reschedule(id, a.version, { start_at: '2026-10-27T10:00:00+07:00' });
    expect(t.db.read().t.appointments.find((x) => x.id === id)!.start_at).toBe('2026-10-27T10:00:00+07:00');
    const r = t.db.read().t.booking_requests.find((x) => x.code === 'YC-0236')!;
    await t.api.staff.requests.confirm(r.id, r.version, { start_at: '2026-10-22T09:00:00+07:00', duration_min: 30, assignee_id: 'stf-mai', customer: { existingId: 'cus-09' }, pet: { existingId: 'pet-na' } });
    expect(t.db.read().t.booking_requests.find((x) => x.code === 'YC-0236')!.status).toBe('confirmed');
    // What the screens use to warn:
    const { holidays } = (await t.api.staff.settings.get()).values;
    expect(holidays.map((d) => d.date)).toEqual(['2026-10-22', '2026-10-26', '2026-10-27']);
  });
});
