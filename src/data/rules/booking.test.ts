import { describe, expect, it } from 'vitest';
import { BOOKING_FIELDS, BOOKING_MSG, validateBooking, validateReschedule } from './booking';
import { TIME_SLOT_LABEL, TIME_SLOTS } from '../contracts/enums';

const ok = { contact_name: 'Hoàng Minh', phone: '0987 654 321', pet_name: 'Bánh Bao', species: 'dog', service: 'spa', desired_date: '2026-10-19', note: '', consent: true } as const;
const today = '2026-10-19';

describe('validateBooking', () => {
  it('a complete guest request has no errors', () => {
    expect(validateBooking(ok, { today, guest: true })).toEqual({});
  });

  it('an empty guest request lists every field in form order with the gentle wording', () => {
    const e = validateBooking({ contact_name: ' ', phone: '', pet_name: '', species: '', service: '', desired_date: '', note: '', consent: false }, { today, guest: true });
    expect(Object.keys(e)).toEqual(['contact_name', 'phone', 'pet_name', 'species', 'service', 'desired_date', 'consent']);
    expect(e.phone).toBe(BOOKING_MSG.phoneEmpty);
    expect(e.service).toBe('Bạn chọn giúp dịch vụ bé cần nhé.');
  });

  it('an unusable phone gets the example hint', () => {
    expect(validateBooking({ ...ok, phone: '12345' }, { today, guest: true }).phone).toBe(BOOKING_MSG.phone);
  });

  it('a past date is refused, today is fine', () => {
    expect(validateBooking({ ...ok, desired_date: '2026-10-18' }, { today, guest: true }).desired_date).toBe(BOOKING_MSG.datePast);
    expect(validateBooking({ ...ok, desired_date: today }, { today, guest: true })).toEqual({});
  });

  it('a note over 500 characters is refused', () => {
    expect(validateBooking({ ...ok, note: 'a'.repeat(501) }, { today, guest: true }).note).toBe(BOOKING_MSG.note);
    expect(validateBooking({ ...ok, note: 'a'.repeat(500) }, { today, guest: true })).toEqual({});
  });

  it('a logged-in customer is not asked for name, phone or consent', () => {
    expect(validateBooking({ ...ok, contact_name: '', phone: '', consent: false }, { today, guest: false })).toEqual({});
  });
  it('accepts the six time slots and refuses anything else', () => {
    for (const slot of TIME_SLOTS) expect(validateBooking({ ...ok, preferred_slot: slot }, { today, guest: true })).toEqual({});
    expect(validateBooking({ ...ok, preferred_slot: '20-22' }, { today, guest: true }).preferred_slot).toBe('Khung giờ này chưa đúng. Bạn chọn lại giúp nhé.');
    expect(TIME_SLOT_LABEL['08-10']).toBe('08:00–10:00');
    // The form's field order is the UI branch's to extend when it adds the slot picker.
    // The form shows the picker since part 2 (UI branch, at the data branch's request): it sits right after the date.
    expect(BOOKING_FIELDS.indexOf('preferred_slot')).toBe(BOOKING_FIELDS.indexOf('desired_date') + 1);
  });
});

describe('time slots cover the booking day', () => {
  it('six two-hour slots, one after another, from 08:00 to 20:00 (owner, 22/10/2026: staff work in shifts, so noon is covered too)', () => {
    expect([...TIME_SLOTS]).toEqual(['08-10', '10-12', '12-14', '14-16', '16-18', '18-20']);
    const labels = TIME_SLOTS.map((t) => TIME_SLOT_LABEL[t]);
    expect(labels).toEqual(['08:00–10:00', '10:00–12:00', '12:00–14:00', '14:00–16:00', '16:00–18:00', '18:00–20:00']);
    labels.forEach((l, i) => { if (i > 0) expect(l.slice(0, 5)).toBe(labels[i - 1]!.slice(6)); });
  });
});

describe('closed days in the booking rules', () => {
  const closed = ['2026-10-22'];
  it('a closed desired date is refused after the past-date check; other dates pass', () => {
    expect(validateBooking({ ...ok, desired_date: '2026-10-22' }, { today, guest: true, closedDays: closed }).desired_date).toBe(BOOKING_MSG.closed);
    expect(validateBooking({ ...ok, desired_date: '2026-10-23' }, { today, guest: true, closedDays: closed })).toEqual({});
    expect(validateBooking({ ...ok, desired_date: '2026-10-22' }, { today, guest: true })).toEqual({});
    expect(validateBooking({ ...ok, desired_date: '2026-10-22' }, { today: '2026-10-25', guest: true, closedDays: closed }).desired_date).toBe(BOOKING_MSG.datePast);
  });
  it('the same for a request to move an appointment', () => {
    expect(validateReschedule({ desired_date: '2026-10-22' }, { tomorrow: '2026-10-20', closedDays: closed })).toEqual({ desired_date: BOOKING_MSG.closed });
    expect(validateReschedule({ desired_date: '2026-10-23' }, { tomorrow: '2026-10-20', closedDays: closed })).toEqual({});
    expect(validateReschedule({ desired_date: '2026-10-19' }, { tomorrow: '2026-10-20', closedDays: ['2026-10-19'] })).toEqual({ desired_date: BOOKING_MSG.dateFromTomorrow });
  });
});
