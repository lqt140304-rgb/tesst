import { normalizeVnPhone } from '../../lib/phone';
import { SERVICES, TIME_SLOTS, type Service, type Species } from '../contracts/enums';

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
  note: 'Ghi chú tối đa 500 ký tự.',
  consent: 'Bạn cần đồng ý để Lê Sơn có thể liên hệ với bạn.',
  pet: 'Không tìm thấy bé này trong hồ sơ của bạn.',
} as const;

export const NOTE_MAX = 500;
export const BOOKING_FIELDS = ['contact_name', 'phone', 'pet_name', 'species', 'service', 'desired_date', 'preferred_slot', 'note', 'consent'] as const;
export type BookingField = (typeof BOOKING_FIELDS)[number];

export type BookingValues = {
  contact_name: string; phone: string; pet_name: string; species: Species | ''; service: Service | ''; desired_date: string; preferred_slot?: string; note?: string; consent?: boolean;
};

/** Field errors in form order. Guests also give name, phone and consent; a logged-in customer's come from the account. */
/** Errors per field (the booking form shows `preferred_slot` as its "Khung giờ" picker since part 2). */
export function validateBooking(v: BookingValues, o: { today: string; guest: boolean }): Partial<Record<BookingField | 'preferred_slot', string>> {
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
  if (v.preferred_slot !== undefined && v.preferred_slot !== '' && !(TIME_SLOTS as readonly string[]).includes(v.preferred_slot)) e.preferred_slot = BOOKING_MSG.slot;
  if ((v.note ?? '').length > NOTE_MAX) e.note = BOOKING_MSG.note;
  if (o.guest && !v.consent) e.consent = BOOKING_MSG.consent;
  return e;
}
