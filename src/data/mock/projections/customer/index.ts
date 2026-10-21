/**
 * Customer projections — the future SQL views customer_*_v. Every DTO is an explicit object literal
 * (spread and Object.assign are banned here by ESLint) so an internal field can never slip through.
 */
import type {
  CustomerBookingRow, CustomerPetCondition, CustomerUpdate, CustomerDiaryEntry, CustomerInvoiceDetail, CustomerInvoiceRow, CustomerPetCard, CustomerStayCard, CustomerVideo,
} from '../../../contracts/customer';
import { PART_OF_DAY_LABEL, PAYMENT_METHOD_LABEL, REQUEST_STATUS_LABEL, TREATMENT_LINE_LABEL } from '../../../contracts/enums';
import { customerLines } from '../../../rules/invoice-lines';
import { daysBetween, dayOf, formatDateVi, formatDayVi, formatShortDateVi, partOfDay, relativeDayVi, todayVN } from '../../../../lib/dates';
import { formatPhoneVi } from '../../../../lib/phone';
import { paymentState } from '../../../rules/invoice-math';
import { daysLeft, expiryTone, VIDEO_TTL_DAYS } from '../../../rules/video-expiry';
import { isLocalKey } from '../../../rules/video-upload';
import type { AccountPet, Appointment, BookingRequest, DiaryEntry, Doc, Invoice, Pet, Stay, Video } from '../../store/schema';

export const petCard = (p: Pet, year: number): CustomerPetCard => ({
  id: p.id, name: p.name, species: p.species, breed: p.breed, sex: p.sex, ageYears: p.birth_year ? year - p.birth_year : undefined, birthYear: p.birth_year,
  source: 'hospital', note: undefined, photoKey: p.photo_key, weightKg: p.weight_kg,
});
export const webPetCard = (p: AccountPet, year: number): CustomerPetCard => ({
  id: p.id, name: p.name, species: p.species, breed: p.breed, sex: p.sex, ageYears: p.birth_year ? year - p.birth_year : undefined, birthYear: p.birth_year,
  source: 'web', note: p.note, photoKey: p.photo_key, weightKg: undefined,
});

function groupFor(status: BookingRequest['status'], appointmentAt: string | undefined, today: string): CustomerBookingRow['group'] {
  if (status === 'pending' || status === 'contacting' || status === 'unreachable') return 'processing';
  if (status === 'confirmed' && appointmentAt && dayOf(appointmentAt) >= today) return 'upcoming';
  return 'past';
}

function pendingReschedule(doc: Readonly<Doc>, appointmentId: string): CustomerBookingRow['rescheduleRequest'] {
  const x = doc.t.reschedule_requests.find((q) => q.appointment_id === appointmentId && q.status === 'pending');
  return x ? { desiredDate: x.desired_date, preferredSlot: x.preferred_slot, createdAt: x.created_at } : undefined;
}

export function requestRow(doc: Readonly<Doc>, r: BookingRequest, now: Date): CustomerBookingRow {
  const apt = r.appointment_id ? doc.t.appointments.find((a) => a.id === r.appointment_id) : undefined;
  const appointmentAt = apt ? apt.start_at : undefined;
  return {
    id: r.id, kind: 'request', code: r.code, status: r.status, group: groupFor(r.status, appointmentAt, todayVN(now)),
    petName: r.snapshot.pet_name, service: r.snapshot.service, desiredDate: r.snapshot.desired_date, preferredSlot: r.snapshot.preferred_slot, appointmentAt,
    appointmentCancelled: apt ? apt.status === 'cancelled' : undefined, viaPhone: false, viaCounter: false,
    reminderSentAt: r.status === 'unreachable' ? r.resubmit_flag_at : undefined,
    canCallBack: r.status === 'unreachable' && !r.resubmit_flag_at, rescheduledFrom: apt ? apt.rescheduled_from : undefined, createdAt: r.created_at,
    rescheduleRequest: apt ? pendingReschedule(doc, apt.id) : undefined,
  };
}

export function appointmentRow(doc: Readonly<Doc>, a: Appointment, now: Date): CustomerBookingRow {
  const pet = doc.t.pets.find((p) => p.id === a.pet_id);
  const status = a.status === 'cancelled' ? 'cancelled' : 'confirmed';
  return {
    id: a.id, kind: 'appointment', code: undefined, status, group: groupFor(status, a.start_at, todayVN(now)),
    petName: pet ? pet.name : '', service: a.service, desiredDate: undefined, preferredSlot: undefined, appointmentAt: a.start_at, appointmentCancelled: a.status === 'cancelled',
    viaPhone: a.source === 'phone', viaCounter: a.source === 'walk_in', reminderSentAt: undefined, canCallBack: false,
    rescheduledFrom: a.rescheduled_from, createdAt: a.created_at, rescheduleRequest: pendingReschedule(doc, a.id),
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
    videoCount: visibleVideos(doc, new Set([s.pet_id]), now).filter((v) => v.stay_id === s.id).length, photoKey: pet.photo_key,
  };
}

const CONDITION_CATEGORIES = ['an_uong', 'nghi_ngoi', 'tinh_than', 'van_dong'] as const;

/** Latest shared line per category over the given stays (the ones the customer may see). */
export function petCondition(doc: Readonly<Doc>, stayIds: string[]): CustomerPetCondition[] {
  const entries = stayIds.flatMap((id) => sharedDiary(doc, id)).sort((a, b) => Date.parse(b.shared_at!) - Date.parse(a.shared_at!));
  return CONDITION_CATEGORIES.flatMap((category) => {
    const e = entries.find((x) => x.category === category);
    return e ? [{ category, text: e.text, dateLabel: formatShortDateVi(e.shared_at!) }] : [];
  });
}

export function diaryEntry(e: DiaryEntry, now: Date): CustomerDiaryEntry {
  const at = e.shared_at!;
  return { id: e.id, dayLabel: relativeDayVi(at, now) ?? formatDayVi(at), date: dayOf(at), part_of_day: e.part_of_day, category: e.category, general_status: e.general_status, text: e.text };
}

export function videoCard(doc: Readonly<Doc>, v: Video, now: Date): CustomerVideo {
  const left = daysLeft(v.expires_at, now);
  const pet = doc.t.pets.find((p) => p.id === v.pet_id);
  return {
    id: v.id, petName: pet ? pet.name : '', whenLabel: `${PART_OF_DAY_LABEL[partOfDay(v.recorded_at)]} ${formatShortDateVi(v.recorded_at)}`, caption: v.caption,
    mediaKey: v.media_key, durationS: v.duration_s, daysLeft: left, tone: expiryTone(left), expiresDate: formatDateVi(v.expires_at), stayId: v.stay_id,
    isLocal: isLocalKey(v.media_key), date: dayOf(v.recorded_at),
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
  const out: CustomerInvoiceDetail['lines'] = customerLines(lines.map((l) => ({ name: l.name_snapshot, qty: l.qty, unit_price: l.unit_price, line_total: l.line_total, customer_group: l.customer_group_snapshot })));
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

export const UPDATES_SEEN_KEY = 'updates';
const UPDATE_DAYS = 30;
const UPDATE_MAX = 10;

/**
 * The bell (part 3 §4): shared diary lines, shared videos, staff changes to the account's own requests, issued invoices.
 * Fixed sentences only, so no medicine, clock time or staff name can reach the text.
 */
export function customerUpdates(doc: Readonly<Doc>, o: { accountId: string; customerId: string | null; stayIds: string[]; now: Date; seenAt?: string }): CustomerUpdate[] {
  const from = o.now.getTime() - UPDATE_DAYS * 86_400_000;
  const seen = o.seenAt ? Date.parse(o.seenAt) : -Infinity;
  const items: { at: string; u: Omit<CustomerUpdate, 'dateLabel' | 'unseen'> }[] = [];
  const petName = (id: string) => doc.t.pets.find((p) => p.id === id)?.name ?? '';
  for (const stayId of o.stayIds) {
    for (const e of sharedDiary(doc, stayId)) {
      items.push({ at: e.shared_at!, u: { id: `diary:${e.id}`, kind: 'diary', text: `Bé ${petName(e.pet_id)} có nhật ký mới`, partOfDay: e.part_of_day, target: { kind: 'stay', id: stayId } } });
    }
  }
  if (o.customerId) {
    const petIds = new Set(doc.t.pets.filter((p) => p.customer_id === o.customerId).map((p) => p.id));
    for (const v of visibleVideos(doc, petIds, o.now)) {
      if (!v.stay_id || !v.shared_at || !o.stayIds.includes(v.stay_id)) continue;
      items.push({ at: v.shared_at, u: { id: `video:${v.id}`, kind: 'video', text: `Bé ${petName(v.pet_id)} có video mới`, partOfDay: partOfDay(v.shared_at), target: { kind: 'stay', id: v.stay_id } } });
    }
    for (const i of doc.t.invoices) {
      if (i.customer_id !== o.customerId || i.status !== 'issued' || !i.issued_at) continue;
      items.push({ at: i.issued_at, u: { id: `invoice:${i.id}`, kind: 'invoice', text: `Hóa đơn ${i.code} mới`, partOfDay: undefined, target: { kind: 'invoice', id: i.id } } });
    }
  }
  const own = new Map(doc.t.booking_requests.filter((r) => r.scope === 'account' && r.account_id === o.accountId).map((r) => [r.id, r]));
  for (const e of doc.t.request_events) {
    const r = own.get(e.request_id);
    if (!r || e.type !== 'status_change' || e.actor_type !== 'staff' || !e.to_status) continue;
    items.push({ at: e.at, u: { id: `request:${e.id}`, kind: 'request', text: `Yêu cầu ${r.code}: ${REQUEST_STATUS_LABEL[e.to_status]}`, partOfDay: undefined, target: { kind: 'request', id: r.id } } });
  }
  return items
    .filter((x) => Date.parse(x.at) >= from && Date.parse(x.at) <= o.now.getTime())
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, UPDATE_MAX)
    .map(({ at, u }) => ({
      id: u.id, kind: u.kind, text: u.text, dateLabel: relativeDayVi(at, o.now) ?? formatShortDateVi(at), partOfDay: u.partOfDay, target: u.target,
      unseen: Date.parse(at) > seen,
    }));
}
