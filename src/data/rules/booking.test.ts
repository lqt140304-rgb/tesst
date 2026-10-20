import { describe, expect, it } from 'vitest';
import { BOOKING_FIELDS, BOOKING_MSG, validateBooking } from './booking';
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
  it('accepts the five time slots and refuses anything else', () => {
    for (const slot of TIME_SLOTS) expect(validateBooking({ ...ok, preferred_slot: slot }, { today, guest: true })).toEqual({});
    expect(validateBooking({ ...ok, preferred_slot: '12-14' }, { today, guest: true }).preferred_slot).toBe('Khung giờ này chưa đúng. Bạn chọn lại giúp nhé.');
    expect(TIME_SLOT_LABEL['08-10']).toBe('08:00–10:00');
    // The form's field order is the UI branch's to extend when it adds the slot picker.
    expect(BOOKING_FIELDS).not.toContain('preferred_slot');
  });
});
