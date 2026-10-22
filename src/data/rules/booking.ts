import { normalizeVnPhone } from '../../lib/phone';
import { OUT_OF_HOURS_SLOT, SERVICES, TIME_SLOTS, type Service, type Species, type TimeSlot } from '../contracts/enums';

/** Booking form wording (customer §3c, R17 "…giúp … nhé" style). */
export const BOOKING_MSG = {
  name: 'Bạn cho Lê Sơn biết tên của bạn nhé.',
  phoneEmpty: 'Bạn nhập số điện thoại để nhân viên gọi xác nhận.',
  phone: 'Số điện thoại chưa đúng. Bạn kiểm tra lại giúp nhé (ví dụ: 0912 345 678).',
  petName: 'Bạn nhập tên bé nhé.',
  species: 'Bạn chọn giúp bé là mèo, chó hay loài khác nhé.',
  service: 'Bạn chọn giúp dịch vụ bé cần nhé.',
  date: 'Bạn chọn giúp ngày mong muốn nhé.',
  datePast: 'Ngày này đã qua. Bạn chọn từ hôm nay trở đi nhé.',
  slot: 'Khung giờ này chưa đúng. Bạn chọn lại giúp nhé.',
  dateFromTomorrow: 'Bạn chọn từ ngày mai trở đi nhé.',
  outOfHours: 'Ngoài giờ làm việc (08:00–21:00), bạn cần gọi hotline 097 355 51 05 trước nhé.',
  holidaySlot: 'Ngày này Lê Sơn nghỉ nên chỉ làm việc đến 19:00. Bạn chọn khung giờ sớm hơn giúp nhé.',
  reason: 'Lý do tối đa 200 ký tự.',
  note: 'Ghi chú tối đa 500 ký tự.',
  consent: 'Bạn cần đồng ý để Lê Sơn có thể liên hệ với bạn.',
  pet: 'Không tìm thấy bé này trong hồ sơ của bạn.',
} as const;

/** On a holiday (a day off, entered by the manager) the hospital still works, but only until 19:00: fewer staff. */
export const HOLIDAY_CLOSE = '19:00';
/** '18-20' → '20:00'. */
export const slotEnd = (slot: TimeSlot): string => `${slot.slice(3)}:00`;
/** The slots a customer may pick on `date`: on a holiday only those that end by 19:00. */
export const slotsOn = (date: string, holidays: readonly string[]): TimeSlot[] =>
  TIME_SLOTS.filter((s) => !holidays.includes(date) || slotEnd(s) <= HOLIDAY_CLOSE);

export const NOTE_MAX = 500;
export const RESCHEDULE_REASON_MAX = 200;
export const BOOKING_FIELDS = ['contact_name', 'phone', 'pet_name', 'species', 'service', 'desired_date', 'preferred_slot', 'note', 'consent'] as const;
export type BookingField = (typeof BOOKING_FIELDS)[number];

export type BookingValues = {
  contact_name: string; phone: string; pet_name: string; species: Species | ''; service: Service | ''; desired_date: string; preferred_slot?: string; note?: string; consent?: boolean;
};

/** Field errors in form order. Guests also give name, phone and consent; a logged-in customer's come from the account. */
/** Errors per field (the booking form shows `preferred_slot` as its "Khung giờ" picker since part 2). */
export function validateBooking(v: BookingValues, o: { today: string; guest: boolean; holidays?: readonly string[] }): Partial<Record<BookingField | 'preferred_slot', string>> {
  const e: Partial<Record<BookingField | 'preferred_slot', string>> = {};
  if (o.guest) {
    if (!v.contact_name.trim()) e.contact_name = BOOKING_MSG.name;
    if (!v.phone.trim()) e.phone = BOOKING_MSG.phoneEmpty;
    else if (!normalizeVnPhone(v.phone)) e.phone = BOOKING_MSG.phone;
  }
  if (!v.pet_name.trim()) e.pet_name = BOOKING_MSG.petName;
  if (!['dog', 'cat', 'other'].includes(v.species)) e.species = BOOKING_MSG.species;
  if (!(SERVICES as readonly string[]).includes(v.service)) e.service = BOOKING_MSG.service;
  if (!v.desired_date) e.desired_date = BOOKING_MSG.date;
  else if (v.desired_date < o.today) e.desired_date = BOOKING_MSG.datePast;
  if (v.preferred_slot === OUT_OF_HOURS_SLOT) e.preferred_slot = BOOKING_MSG.outOfHours;
  else if (v.preferred_slot !== undefined && v.preferred_slot !== '' && !(TIME_SLOTS as readonly string[]).includes(v.preferred_slot)) e.preferred_slot = BOOKING_MSG.slot;
  else if (v.preferred_slot && v.desired_date >= o.today && !slotsOn(v.desired_date, o.holidays ?? []).includes(v.preferred_slot as TimeSlot)) e.preferred_slot = BOOKING_MSG.holidaySlot;
  if ((v.note ?? '').length > NOTE_MAX) e.note = BOOKING_MSG.note;
  if (o.guest && !v.consent) e.consent = BOOKING_MSG.consent;
  return e;
}

/** "Yêu cầu đổi lịch" (part 3): a day from tomorrow, an optional slot, a short optional reason. */
export function validateReschedule(v: { desired_date: string; preferred_slot?: string; reason?: string }, o: { tomorrow: string; holidays?: readonly string[] }): Partial<Record<'desired_date' | 'preferred_slot' | 'reason', string>> {
  const e: Partial<Record<'desired_date' | 'preferred_slot' | 'reason', string>> = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.desired_date)) e.desired_date = BOOKING_MSG.date;
  else if (v.desired_date < o.tomorrow) e.desired_date = BOOKING_MSG.dateFromTomorrow;
  if (v.preferred_slot === OUT_OF_HOURS_SLOT) e.preferred_slot = BOOKING_MSG.outOfHours;
  else if (v.preferred_slot && !(TIME_SLOTS as readonly string[]).includes(v.preferred_slot)) e.preferred_slot = BOOKING_MSG.slot;
  else if (v.preferred_slot && !e.desired_date && !slotsOn(v.desired_date, o.holidays ?? []).includes(v.preferred_slot as TimeSlot)) e.preferred_slot = BOOKING_MSG.holidaySlot;
  if ((v.reason ?? '').trim().length > RESCHEDULE_REASON_MAX) e.reason = BOOKING_MSG.reason;
  return e;
}
