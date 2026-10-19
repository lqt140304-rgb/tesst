/**
 * Customer projections — the future SQL views customer_*_v. Every DTO is an explicit object literal
 * (spread and Object.assign are banned here by ESLint) so an internal field can never slip through.
 */
import type {
  CustomerBookingRow, CustomerDiaryEntry, CustomerInvoiceDetail, CustomerInvoiceRow, CustomerPetCard, CustomerStayCard, CustomerVideo,
} from '../../../contracts/customer';
import { PART_OF_DAY_LABEL, PAYMENT_METHOD_LABEL, TREATMENT_LINE_LABEL } from '../../../contracts/enums';
import { daysBetween, dayOf, formatDateVi, formatDayVi, formatShortDateVi, partOfDay, relativeDayVi, todayVN } from '../../../../lib/dates';
import { formatPhoneVi } from '../../../../lib/phone';
import { paymentState } from '../../../rules/invoice-math';
import { daysLeft, expiryTone, VIDEO_TTL_DAYS } from '../../../rules/video-expiry';
import type { AccountPet, Appointment, BookingRequest, DiaryEntry, Doc, Invoice, Pet, Stay, Video } from '../../store/schema';

export const petCard = (p: Pet, year: number): CustomerPetCard => ({
  id: p.id, name: p.name, species: p.species, breed: p.breed, sex: p.sex, ageYears: p.birth_year ? year - p.birth_year : undefined, birthYear: p.birth_year,
  source: 'hospital', note: undefined,
});
export const webPetCard = (p: AccountPet, year: number): CustomerPetCard => ({
  id: p.id, name: p.name, species: p.species, breed: p.breed, sex: p.sex, ageYears: p.birth_year ? year - p.birth_year : undefined, birthYear: p.birth_year,
  source: 'web', note: p.note,
});

function groupFor(status: BookingRequest['status'], appointmentAt: string | undefined, today: string): CustomerBookingRow['group'] {
  if (status === 'pending' || status === 'contacting' || status === 'unreachable') return 'processing';
  if (status === 'confirmed' && appointmentAt && dayOf(appointmentAt) >= today) return 'upcoming';
  return 'past';
}

export function requestRow(doc: Readonly<Doc>, r: BookingRequest, now: Date): CustomerBookingRow {
  const apt = r.appointment_id ? doc.t.appointments.find((a) => a.id === r.appointment_id) : undefined;
  const appointmentAt = apt ? apt.start_at : undefined;
  return {
    id: r.id, kind: 'request', code: r.code, status: r.status, group: groupFor(r.status, appointmentAt, todayVN(now)),
    petName: r.snapshot.pet_name, service: r.snapshot.service, desiredDate: r.snapshot.desired_date, appointmentAt,
    appointmentCancelled: apt ? apt.status === 'cancelled' : undefined, viaPhone: false, viaCounter: false,
    reminderSentAt: r.status === 'unreachable' ? r.resubmit_flag_at : undefined,
    canCallBack: r.status === 'unreachable' && !r.resubmit_flag_at, rescheduledFrom: apt ? apt.rescheduled_from : undefined, createdAt: r.created_at,
  };
}

export function appointmentRow(doc: Readonly<Doc>, a: Appointment, now: Date): CustomerBookingRow {
  const pet = doc.t.pets.find((p) => p.id === a.pet_id);
  const status = a.status === 'cancelled' ? 'cancelled' : 'confirmed';
  return {
    id: a.id, kind: 'appointment', code: undefined, status, group: groupFor(status, a.start_at, todayVN(now)),
    petName: pet ? pet.name : '', service: a.service, desiredDate: undefined, appointmentAt: a.start_at, appointmentCancelled: a.status === 'cancelled',
    viaPhone: a.source === 'phone', viaCounter: a.source === 'walk_in', reminderSentAt: undefined, canCallBack: false,
    rescheduledFrom: a.rescheduled_from, createdAt: a.created_at,
  };
}

function updatedLabel(iso: string, now: Date): string {
  const part = PART_OF_DAY_LABEL[partOfDay(iso)].toLowerCase();
  const rel = relativeDayVi(iso, now);
  if (rel === 'Hôm nay') return `Cập nhật ${part} nay`;
  if (rel === 'Hôm qua') return `Cập nhật ${part} hôm qua`;
  return `Cập nhật ngày ${formatShortDateVi(iso)}`;
}

export const sharedDiary = (doc: Readonly<Doc>, stayId: string) =>
  doc.t.diary_entries.filter((e) => e.stay_id === stayId && e.status === 'shared' && e.shared_at).sort((a, b) => b.shared_at!.localeCompare(a.shared_at!));

export const visibleVideos = (doc: Readonly<Doc>, petIds: Set<string>, now: Date) =>
  doc.t.videos.filter((v) => petIds.has(v.pet_id) && v.share_status === 'shared' && !v.deleted_at && new Date(v.expires_at).getTime() > now.getTime());

export function stayCard(doc: Readonly<Doc>, s: Stay, now: Date): CustomerStayCard {
  const pet = doc.t.pets.find((p) => p.id === s.pet_id)!;
  const latest = sharedDiary(doc, s.id)[0];
  return {
    id: s.id, petName: pet.name, species: pet.species, admittedAt: dayOf(s.admitted_at), dayNumber: daysBetween(s.admitted_at, s.discharged_at ?? now) + 1,
    current: !s.discharged_at, dischargedAt: s.discharged_at ? dayOf(s.discharged_at) : undefined,
    latestStatus: latest ? latest.general_status : undefined, updatedLabel: latest ? updatedLabel(latest.shared_at!, now) : undefined,
    latestText: latest ? latest.text : undefined,
    videoCount: visibleVideos(doc, new Set([s.pet_id]), now).filter((v) => v.stay_id === s.id).length,
  };
}

export function diaryEntry(e: DiaryEntry, now: Date): CustomerDiaryEntry {
  const at = e.shared_at!;
  return { id: e.id, dayLabel: relativeDayVi(at, now) ?? formatDayVi(at), part_of_day: e.part_of_day, category: e.category, general_status: e.general_status, text: e.text };
}

export function videoCard(doc: Readonly<Doc>, v: Video, now: Date): CustomerVideo {
  const left = daysLeft(v.expires_at, now);
  const pet = doc.t.pets.find((p) => p.id === v.pet_id);
  return {
    id: v.id, petName: pet ? pet.name : '', whenLabel: `${PART_OF_DAY_LABEL[partOfDay(v.recorded_at)]} ${formatShortDateVi(v.recorded_at)}`, caption: v.caption,
    mediaKey: v.media_key, durationS: v.duration_s, daysLeft: left, tone: expiryTone(left), expiresDate: formatDateVi(v.expires_at), stayId: v.stay_id,
  };
}

const SUMMARY: Record<string, string> = { exam: 'Khám và điều trị', spa: 'Spa & Grooming', inpatient: 'Nội trú' };

export function invoiceRow(doc: Readonly<Doc>, i: Invoice): CustomerInvoiceRow {
  const ps = paymentState(i.total, doc.t.payments.filter((p) => p.invoice_id === i.id));
  const cats = new Set(doc.t.invoice_lines.filter((l) => l.invoice_id === i.id && l.customer_group_snapshot === 'itemized').map((l) => SUMMARY[l.category_snapshot] ?? ''));
  return {
    id: i.id, code: i.code, issuedAt: i.issued_at!, petNames: i.pet_ids.map((id) => doc.t.pets.find((p) => p.id === id)?.name ?? '').filter(Boolean),
    summary: [...cats].filter(Boolean).join(' · ') || TREATMENT_LINE_LABEL, total: i.total, paid: ps.paid, remaining: ps.remaining, state: ps.state,
  };
}

export function invoiceDetail(doc: Readonly<Doc>, i: Invoice): CustomerInvoiceDetail {
  const row = invoiceRow(doc, i);
  const lines = doc.t.invoice_lines.filter((l) => l.invoice_id === i.id);
  const out: CustomerInvoiceDetail['lines'] = lines.filter((l) => l.customer_group_snapshot === 'itemized')
    .map((l) => ({ label: l.name_snapshot, qty: l.qty, unitPrice: l.unit_price, total: l.line_total }));
  const treatment = lines.filter((l) => l.customer_group_snapshot === 'treatment').reduce((s, l) => s + l.line_total, 0);
  if (treatment > 0) out.push({ label: TREATMENT_LINE_LABEL, qty: null, unitPrice: null, total: treatment, note: 'Nhân viên sẽ giải thích chi tiết khi bạn cần.' });
  const customer = doc.t.customers.find((c) => c.id === i.customer_id)!;
  const phone = formatPhoneVi(customer.phone_e164);
  return {
    id: row.id, code: row.code, issuedAt: row.issuedAt, petNames: row.petNames, summary: row.summary, total: row.total, paid: row.paid, remaining: row.remaining, state: row.state,
    customerName: customer.full_name, phoneMasked: `${phone.slice(0, 3)} ••• •• ${phone.slice(-2)}`, subtotal: i.subtotal,
    discount: i.discount ? { label: 'Giảm giá', amount: i.discount.amount } : undefined, note: i.note_customer,
    lines: out,
    payments: doc.t.payments.filter((p) => p.invoice_id === i.id && !p.reversed_at).sort((a, b) => a.received_at.localeCompare(b.received_at))
      .map((p) => ({ dateLabel: formatDateVi(p.received_at), methodLabel: PAYMENT_METHOD_LABEL[p.method] })),
  };
}

export const STAY_VISIBLE_DAYS = VIDEO_TTL_DAYS;
