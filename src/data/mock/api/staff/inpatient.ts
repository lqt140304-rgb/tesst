import { ValidationError } from '../../../contracts/errors';
import type { AdmitPetOption, CageTile, DischargeResult, StaffInpatientApi, StaffStayView } from '../../../contracts/staff';
import { daysBetween, dayOf, formatTimeVi, partOfDay, toIsoVN, todayVN } from '../../../../lib/dates';
import type { Env } from '../../env';
import { appendAudit } from '../../audit';
import { newId, nextCode } from '../../ids';
import { sleepRead, sleepWrite } from '../../latency';
import type { Db } from '../../store/db';
import type { BlobStore } from '../../store/blobs';
import { isLocalKey } from '../media';
import type { Doc, Pet, Stay } from '../../store/schema';
import { checkVersion } from '../../store/version';
import { audit, find, fold, staffActor, staffName } from './common';
import { formatDaysVi } from '../../../rules/stay-billing';
import { addDayLine, dayItems, settleDayLine, stayBilling } from './inpatient-billing';
import { normalizeVnPhone } from '../../../../lib/phone';
import { suggestDayItemCode } from '../../../rules/stay-billing';
import { badTimeMessage, isClockTime } from '../../../rules/schedule-times';

const DOSE = /\d+([,.]\d+)?\s?(ml|mg|g|viên|mũi|gói|giọt|cc|ui)\b/giu;

/** Soft warning for customer-visible text: drug names from orders/price list and dose-like patterns (R7). */
export function lintCustomerText(text: string, doc: Readonly<Doc>): string[] {
  const hay = text.toLowerCase();
  const names = new Set<string>([
    ...doc.t.care_orders.map((o) => o.item_name),
    ...doc.t.price_items.filter((p) => p.category === 'medicine').map((p) => p.name),
  ]);
  const hits = [...names].filter((n) => hay.includes(n.toLowerCase()));
  for (const m of text.matchAll(DOSE)) hits.push(m[0]);
  return [...new Set(hits)];
}

/** 60-day auto-delete (R25 / product direction §3.3), audited as "Hệ thống". Files kept in this browser go too. */
export function purgeExpiredVideos(db: Db, now: Date, media?: BlobStore): number {
  const expired = db.read().t.videos.filter((v) => !v.deleted_at && new Date(v.expires_at).getTime() <= now.getTime());
  if (!expired.length) return 0;
  db.transact('system.purgeExpiredVideos', (d) => {
    for (const e of expired) {
      const v = d.t.videos.find((x) => x.id === e.id)!;
      v.deleted_at = toIsoVN(now);
      v.deleted_by = 'system';
      const pet = d.t.pets.find((p) => p.id === v.pet_id);
      appendAudit(d, now, { actor_type: 'system', actor_name_snapshot: 'Hệ thống', action: 'video.auto_delete', entity_type: 'video', entity_id: v.id, summary_vi: `Hệ thống tự xóa 1 video của ${pet?.name ?? 'bé'} sau 60 ngày`, sensitive: true });
    }
  }, { markDirty: false });
  void media?.remove(expired.map((v) => v.media_key).filter(isLocalKey));
  return expired.length;
}

function ownerWeb(doc: Readonly<Doc>, customerId: string): 'linked' | 'unlinked' | 'none' {
  if (doc.t.account_links.some((l) => l.customer_id === customerId && !l.unlinked_at)) return 'linked';
  const c = doc.t.customers.find((x) => x.id === customerId);
  return c && doc.t.web_accounts.some((a) => a.phone_e164 === c.phone_e164) ? 'unlinked' : 'none';
}

const staying = (doc: Readonly<Doc>, petId: string) => doc.t.stays.some((s) => s.pet_id === petId && !s.discharged_at);

function petOption(doc: Readonly<Doc>, pet: Pet): AdmitPetOption {
  const owner = doc.t.customers.find((c) => c.id === pet.customer_id)!;
  const code = suggestDayItemCode(pet);
  return {
    id: pet.id, name: pet.name, species: pet.species, breed: pet.breed, weight_kg: pet.weight_kg, ownerName: owner.full_name, ownerPhone: owner.phone_e164,
    inpatient: staying(doc, pet.id), suggestedDayItemId: code ? dayItems(doc).find((i) => i.code === code)?.id : undefined,
  };
}

function todaySlots(doc: Readonly<Doc>, stay: Stay, orderId: string, times: string[], now: Date) {
  const today = todayVN(now);
  return times.map((time) => {
    const done = doc.t.care_administrations.some((a) => a.order_id === orderId && a.slot_time === time && dayOf(a.performed_at) === today);
    const due = new Date(`${today}T${time}:00+07:00`).getTime() <= now.getTime() && new Date(`${today}T${time}:00+07:00`).getTime() >= new Date(stay.admitted_at).getTime();
    return { time, done, due };
  });
}

export function staffInpatientApi(env: Env): StaffInpatientApi {
  const { db } = env;

  function mutateStay(stayId: string, cap: Parameters<typeof staffActor>[1], label: string, fn: (d: Doc, a: ReturnType<typeof staffActor>, s: Stay) => void) {
    const a = staffActor(env, cap);
    db.transact(label, (d) => {
      const s = find(d.t.stays, stayId);
      if (s.discharged_at) throw new ValidationError({ stay: 'Bé đã xuất viện.' });
      fn(d, a, s);
    });
  }

  return {
    async board() {
      staffActor(env, 'inpatient.view');
      await sleepRead();
      const doc = db.read();
      const now = env.clock();
      return doc.t.cages.filter((c) => c.active).map((c): CageTile => {
        const s = doc.t.stays.find((x) => x.cage_id === c.id && !x.discharged_at);
        if (!s) return { cageId: c.id, cageCode: c.code, zone: c.zone };
        const pet = doc.t.pets.find((p) => p.id === s.pet_id)!;
        const owner = doc.t.customers.find((x) => x.id === s.customer_id)!;
        const slotsPending = doc.t.care_orders.filter((o) => o.stay_id === s.id && o.status === 'active')
          .flatMap((o) => todaySlots(doc, s, o.id, o.schedule_times, now)).filter((x) => x.due && !x.done).length;
        return {
          cageId: c.id, cageCode: c.code, zone: c.zone,
          stay: {
            id: s.id, code: s.code, petName: pet.name, species: pet.species, ownerName: owner.full_name, doctorName: staffName(doc, s.doctor_id),
            internalStatus: s.internal_status, dayNumber: daysBetween(s.admitted_at, now) + 1, slotsPending,
            diaryToday: doc.t.diary_entries.some((e) => e.stay_id === s.id && e.status === 'shared' && e.shared_at && dayOf(e.shared_at) === todayVN(now)),
            ownerWeb: ownerWeb(doc, owner.id), expectedDischarge: s.expected_discharge_at, alerts: pet.alerts,
          },
        };
      });
    },

    async getStay(id) {
      const a = staffActor(env, 'inpatient.view');
      await sleepRead();
      const doc = db.read();
      const s = find(doc.t.stays as Stay[], id);
      const pet = doc.t.pets.find((p) => p.id === s.pet_id)!;
      const owner = doc.t.customers.find((c) => c.id === s.customer_id)!;
      const now = env.clock();
      const view: StaffStayView = {
        id: s.id, code: s.code, version: s.version, petId: pet.id, petName: pet.name, species: pet.species, breed: pet.breed, alerts: pet.alerts,
        ownerId: owner.id, ownerName: owner.full_name, ownerPhone: owner.phone_e164, ownerWeb: ownerWeb(doc, owner.id),
        cageCode: doc.t.cages.find((c) => c.id === s.cage_id)?.code ?? '—', doctorName: staffName(doc, s.doctor_id), admitted_at: s.admitted_at,
        expected_discharge_at: s.expected_discharge_at, discharged_at: s.discharged_at, dayNumber: daysBetween(s.admitted_at, s.discharged_at ?? now) + 1,
        internalStatus: s.internal_status, invoiceId: s.invoice_id, billing: stayBilling(doc, s),
        diary: doc.t.diary_entries.filter((e) => e.stay_id === id).sort((x, y) => y.created_at.localeCompare(x.created_at)).map((e) => ({
          id: e.id, status: e.status, part_of_day: e.part_of_day, category: e.category, general_status: e.general_status, text: e.text,
          authorName: staffName(doc, e.author_id), created_at: e.created_at, shared_at: e.shared_at, sharedByName: staffName(doc, e.shared_by),
        })),
        videos: doc.t.videos.filter((v) => v.stay_id === id).sort((x, y) => y.uploaded_at.localeCompare(x.uploaded_at)).map((v) => ({
          id: v.id, media_key: v.media_key, caption: v.caption, duration_s: v.duration_s, uploaded_at: v.uploaded_at, uploaderName: staffName(doc, v.uploaded_by),
          expires_at: v.expires_at, share_status: v.share_status, deleted: !!v.deleted_at,
        })),
      };
      if (a.caps.has('inpatient.clinical')) {
        view.internal = {
          reason: s.reason_internal,
          orders: doc.t.care_orders.filter((o) => o.stay_id === id).map((o) => ({
            id: o.id, kind: o.kind, item_name: o.item_name, dose: o.dose, route: o.route, schedule_times: o.schedule_times, status: o.status,
            orderedByName: staffName(doc, o.ordered_by), todaySlots: o.status === 'active' ? todaySlots(doc, s, o.id, o.schedule_times, now) : [],
          })),
          administrations: doc.t.care_administrations.filter((x) => x.stay_id === id).sort((x, y) => y.performed_at.localeCompare(x.performed_at)).map((x) => ({
            id: x.id, item_name: x.item_name, dose: x.dose, performed_at: x.performed_at, performedByName: staffName(doc, x.performed_by), slot_time: x.slot_time,
          })),
          notes: doc.t.care_notes.filter((n) => n.stay_id === id).sort((x, y) => y.at.localeCompare(x.at)).map((n) => ({
            id: n.id, type: n.type, text: n.text, at: n.at, authorName: staffName(doc, n.author_id), temp_c: n.temp_c, weight_kg: n.weight_kg,
          })),
        };
      }
      return view;
    },

    async admitOptions() {
      staffActor(env, 'inpatient.admit');
      await sleepRead();
      const doc = db.read();
      const today = todayVN(env.clock());
      return {
        cages: doc.t.cages.filter((c) => c.active && !doc.t.stays.some((s) => s.cage_id === c.id && !s.discharged_at))
          .map((c) => ({ id: c.id, code: c.code, zone: c.zone, species_hint: c.species_hint })),
        doctors: doc.t.staff_users.filter((u) => u.active && u.preset_ids.includes('bac_si')).map((u) => ({ id: u.id, name: u.display_name, title: u.title })),
        dayItems: dayItems(doc).map((i) => ({ id: i.id, code: i.code, name: i.name, price: i.price })),
        today: doc.t.appointments.filter((a) => a.status === 'scheduled' && dayOf(a.start_at) === today && !staying(doc, a.pet_id))
          .sort((x, y) => x.start_at.localeCompare(y.start_at))
          .map((a) => {
            const draft = doc.t.invoices.find((i) => i.source_type === 'appointment' && i.source_id === a.id && i.status === 'draft');
            return { appointmentId: a.id, start_at: a.start_at, service: a.service, pet: petOption(doc, find(doc.t.pets as Pet[], a.pet_id)), draftInvoice: draft ? { id: draft.id, code: draft.code } : undefined };
          }),
      };
    },

    async findPets(q) {
      staffActor(env, 'inpatient.admit');
      await sleepRead();
      const doc = db.read();
      const needle = fold(q.trim());
      if (!needle) return [];
      const phone = normalizeVnPhone(q);
      const owner = (p: Pet) => doc.t.customers.find((c) => c.id === p.customer_id)!;
      return doc.t.pets
        .filter((p) => (phone ? owner(p).phone_e164 === phone : fold(p.name).includes(needle) || fold(owner(p).full_name).includes(needle)))
        .slice(0, 20).map((p) => petOption(doc, p));
    },

    async admit(input) {
      const a = staffActor(env, 'inpatient.admit');
      await sleepWrite();
      if (!input.reason_internal.trim()) throw new ValidationError({ reason_internal: 'Vui lòng ghi lý do nhập viện.' });
      return db.transact('inpatient.admit', (d) => {
        const pet = find(d.t.pets, input.pet_id);
        const cage = find(d.t.cages, input.cage_id);
        if (!cage.active || d.t.stays.some((s) => s.cage_id === cage.id && !s.discharged_at)) throw new ValidationError({ cage_id: 'Chuồng này đang có bé ở.' });
        if (d.t.stays.some((s) => s.pet_id === pet.id && !s.discharged_at)) throw new ValidationError({ pet_id: 'Bé đang nội trú.' });
        const doctorId = input.doctor_id ?? a.staff.id;
        if (!d.t.staff_users.some((u) => u.id === doctorId && u.active && u.preset_ids.includes('bac_si'))) throw new ValidationError({ doctor_id: 'Bạn chọn bác sĩ phụ trách nhé.' });
        const nowDate = env.clock();
        if (input.expected_discharge_at && dayOf(input.expected_discharge_at) < todayVN(nowDate)) {
          throw new ValidationError({ expected_discharge_at: 'Ngày dự kiến xuất viện không được trước hôm nay.' });
        }
        const apt = input.appointment_id ? find(d.t.appointments, input.appointment_id) : undefined;
        if (apt && apt.pet_id !== pet.id) throw new ValidationError({ appointment_id: 'Lịch hẹn này không phải của bé.' });
        const wanted = input.invoice?.day_price_item_id;
        const item = wanted ? dayItems(d).find((i) => i.id === wanted) : undefined;
        if (wanted && !item) throw new ValidationError({ day_price_item_id: 'Mục tiền nội trú không hợp lệ.' });

        const id = newId();
        const now = toIsoVN(nowDate);
        const code = nextCode(d, 'NT');
        const stay: Stay = {
          id, code, pet_id: pet.id, customer_id: pet.customer_id, cage_id: cage.id, doctor_id: doctorId, admitted_at: now, admitted_by: a.staff.id,
          reason_internal: input.reason_internal.trim(), internal_status: input.initial_status ?? 'watch', expected_discharge_at: input.expected_discharge_at,
          appointment_id: apt?.id, version: 1,
        };
        d.t.stays.push(stay);
        audit(d, env, a, 'stay.admit', 'stay', id, `${a.staff.display_name} nhập viện ${pet.name} vào chuồng ${cage.code} (${code})`);
        if (input.invoice) {
          // The appointment's own draft takes the day line, so one visit has one invoice.
          let inv = apt && d.t.invoices.find((i) => i.source_type === 'appointment' && i.source_id === apt.id && i.status === 'draft');
          if (inv) {
            if (!inv.pet_ids.includes(pet.id)) inv.pet_ids.push(pet.id);
            if (item) audit(d, env, a, 'invoice.update', 'invoice', inv.id, `${a.staff.display_name} thêm tiền nội trú vào hóa đơn nháp ${inv.code}`);
          } else {
            inv = { id: newId(), code: nextCode(d, 'HD'), customer_id: pet.customer_id, pet_ids: [pet.id], source_type: 'stay', source_id: id, status: 'draft', subtotal: 0, total: 0, created_by: a.staff.id, created_at: now, version: 1 };
            d.t.invoices.push(inv);
            audit(d, env, a, 'invoice.draft', 'invoice', inv.id, `${a.staff.display_name} tạo hóa đơn nháp ${inv.code}`);
          }
          if (item) addDayLine(d, inv, item, pet.id);
          stay.invoice_id = inv.id;
          stay.day_price_item_id = item?.id;
        }
        return id;
      });
    },

    async transfer(id, version, { cage_id, reason }) {
      await sleepWrite();
      mutateStay(id, 'inpatient.admit', 'inpatient.transfer', (d, a, s) => {
        checkVersion(s, version);
        const cage = find(d.t.cages, cage_id);
        if (cage.id === s.cage_id || !cage.active || d.t.stays.some((x) => x.cage_id === cage.id && !x.discharged_at)) throw new ValidationError({ cage_id: 'Chuồng này đang có bé ở.' });
        const from = d.t.cages.find((c) => c.id === s.cage_id)?.code ?? '—';
        const pet = d.t.pets.find((p) => p.id === s.pet_id)!;
        const why = reason?.trim() || undefined;
        s.cage_id = cage.id;
        s.version += 1;
        audit(d, env, a, 'stay.transfer', 'stay', s.id, `${a.staff.display_name} chuyển ${pet.name} từ chuồng ${from} sang ${cage.code}${why ? ` — ${why}` : ''}`, { reason: why });
      });
    },

    async discharge(id, version, input) {
      await sleepWrite();
      let result!: DischargeResult;
      mutateStay(id, 'inpatient.admit', 'inpatient.discharge', (d, a, s) => {
        checkVersion(s, version);
        const nowDate = env.clock();
        const now = toIsoVN(nowDate);
        const at = input.discharged_at ? new Date(input.discharged_at) : nowDate;
        if (!(at.getTime() >= new Date(s.admitted_at).getTime())) throw new ValidationError({ discharged_at: 'Thời điểm xuất viện không được trước lúc nhập viện.' });
        if (at.getTime() > nowDate.getTime()) throw new ValidationError({ discharged_at: 'Thời điểm xuất viện không được sau bây giờ.' });
        s.discharged_at = toIsoVN(at);
        s.discharged_by = a.staff.id;
        s.discharge_note_internal = input.note_internal?.trim() || undefined;
        s.version += 1;
        result = settleDayLine(d, s, s.discharged_at);
        const text = input.farewell?.text.trim();
        if (text) {
          const share = !!input.farewell?.share && a.caps.has('inpatient.share');
          d.t.diary_entries.push({
            id: newId(), stay_id: s.id, pet_id: s.pet_id, status: share ? 'shared' : 'draft', part_of_day: partOfDay(s.discharged_at), category: 'tinh_than',
            general_status: 'ready_home', text, author_id: a.staff.id, created_at: now, shared_by: share ? a.staff.id : undefined, shared_at: share ? now : undefined,
          });
          if (share) audit(d, env, a, 'diary.share', 'stay', s.id, `${a.staff.display_name} chia sẻ lời chào tạm biệt với khách`, { sensitive: true });
          else audit(d, env, a, 'diary.draft', 'stay', s.id, `${a.staff.display_name} lưu nháp lời chào tạm biệt cho ${s.code}`);
        }
        const billed = result.invoiceUpdated ? ` · hóa đơn tính ${formatDaysVi(result.days)} ngày` : '';
        audit(d, env, a, 'stay.discharge', 'stay', s.id, `${a.staff.display_name} cho xuất viện ${s.code}${billed}`);
      });
      return result;
    },

    async setInternalStatus(id, version, status) {
      await sleepWrite();
      mutateStay(id, 'inpatient.admit', 'inpatient.setInternalStatus', (d, a, s) => {
        checkVersion(s, version);
        s.internal_status = status;
        s.version += 1;
        audit(d, env, a, 'stay.status', 'stay', s.id, `${a.staff.display_name} cập nhật tình trạng nội bộ ${s.code}`);
      });
    },

    orders: {
      async create(stayId, input) {
        await sleepWrite();
        if (!input.item_name.trim()) throw new ValidationError({ item_name: 'Vui lòng nhập nội dung y lệnh.' });
        const badTime = input.schedule_times.find((t) => !isClockTime(t));
        if (badTime !== undefined) throw new ValidationError({ schedule_times: badTimeMessage(badTime) });
        let oid = '';
        mutateStay(stayId, 'inpatient.clinical', 'inpatient.orders.create', (d, a, s) => {
          oid = newId();
          const now = toIsoVN(env.clock());
          d.t.care_orders.push({ id: oid, stay_id: s.id, kind: input.kind, item_name: input.item_name.trim(), dose: input.dose?.trim() || undefined, route: input.route?.trim() || undefined, schedule_times: [...input.schedule_times].sort(), start_date: now.slice(0, 10), status: 'active', ordered_by: a.staff.id, ordered_at: now });
          audit(d, env, a, 'order.create', 'stay', s.id, `${a.staff.display_name} thêm y lệnh cho ${s.code}`);
        });
        return oid;
      },
      async stop(orderId) {
        const a = staffActor(env, 'inpatient.clinical');
        await sleepWrite();
        db.transact('inpatient.orders.stop', (d) => {
          const o = find(d.t.care_orders, orderId);
          o.status = 'stopped';
          o.stopped_by = a.staff.id;
          o.stopped_at = toIsoVN(env.clock());
          audit(d, env, a, 'order.stop', 'stay', o.stay_id, `${a.staff.display_name} dừng một y lệnh`);
        });
      },
    },

    administrations: {
      async record(stayId, input) {
        await sleepWrite();
        mutateStay(stayId, 'inpatient.clinical', 'inpatient.administrations.record', (d, a, s) => {
          const o = input.order_id ? find(d.t.care_orders, input.order_id) : undefined;
          const item = o?.item_name ?? input.item_name?.trim();
          if (!item) throw new ValidationError({ item_name: 'Vui lòng nhập nội dung đã thực hiện.' });
          const now = env.clock();
          d.t.care_administrations.push({ id: newId(), stay_id: s.id, order_id: o?.id, slot_time: input.slot_time ?? formatTimeVi(now), item_name: item, dose: o?.dose ?? input.dose, performed_at: toIsoVN(now), performed_by: a.staff.id, note: input.note?.trim() || undefined });
          audit(d, env, a, 'administration.record', 'stay', s.id, `${a.staff.display_name} ghi nhận đã thực hiện cho ${s.code}`);
        });
      },
    },

    careNotes: {
      async create(stayId, input) {
        await sleepWrite();
        if (!input.text.trim()) throw new ValidationError({ text: 'Vui lòng nhập ghi chú.' });
        mutateStay(stayId, 'inpatient.clinical', 'inpatient.careNotes.create', (d, a, s) => {
          d.t.care_notes.push({ id: newId(), stay_id: s.id, type: input.type, text: input.text.trim(), temp_c: input.temp_c, weight_kg: input.weight_kg, author_id: a.staff.id, at: toIsoVN(env.clock()) });
          audit(d, env, a, 'care_note.create', 'stay', s.id, `${a.staff.display_name} thêm ghi chú chăm sóc cho ${s.code}`);
        });
      },
    },

    diary: {
      async saveDraft(stayId, input) {
        await sleepWrite();
        if (!input.text.trim()) throw new ValidationError({ text: 'Vui lòng viết vài dòng cho khách.' });
        let id = input.id ?? '';
        mutateStay(stayId, 'inpatient.diary_write', 'inpatient.diary.saveDraft', (d, a, s) => {
          const now = toIsoVN(env.clock());
          const existing = input.id ? d.t.diary_entries.find((e) => e.id === input.id && e.stay_id === s.id) : undefined;
          if (existing) {
            if (existing.status !== 'draft') throw new ValidationError({ text: 'Chỉ sửa được bản nháp.' });
            Object.assign(existing, { part_of_day: input.part_of_day, category: input.category, general_status: input.general_status, text: input.text.trim() });
          } else {
            id = newId();
            d.t.diary_entries.push({ id, stay_id: s.id, pet_id: s.pet_id, status: 'draft', part_of_day: input.part_of_day, category: input.category, general_status: input.general_status, text: input.text.trim(), author_id: a.staff.id, created_at: now });
          }
          audit(d, env, a, 'diary.draft', 'stay', s.id, `${a.staff.display_name} lưu nháp nhật ký cho ${s.code}`);
        });
        return id;
      },
      async share(id) {
        const a = staffActor(env, 'inpatient.share');
        await sleepWrite();
        db.transact('inpatient.diary.share', (d) => {
          const e = find(d.t.diary_entries, id);
          if (e.status !== 'draft') throw new ValidationError({ status: 'Mục nhật ký này không còn là bản nháp.' });
          e.status = 'shared';
          e.shared_by = a.staff.id;
          e.shared_at = toIsoVN(env.clock());
          audit(d, env, a, 'diary.share', 'stay', e.stay_id, `${a.staff.display_name} chia sẻ nhật ký với khách`, { sensitive: true });
        });
      },
      async withdraw(id) {
        const a = staffActor(env, 'inpatient.share');
        await sleepWrite();
        db.transact('inpatient.diary.withdraw', (d) => {
          const e = find(d.t.diary_entries, id);
          if (e.status !== 'shared') throw new ValidationError({ status: 'Chỉ thu hồi được mục đã chia sẻ.' });
          e.status = 'withdrawn';
          e.withdrawn_by = a.staff.id;
          e.withdrawn_at = toIsoVN(env.clock());
          audit(d, env, a, 'diary.withdraw', 'stay', e.stay_id, `${a.staff.display_name} thu hồi một mục nhật ký`, { sensitive: true });
        });
      },
      async lint(text) {
        staffActor(env, 'inpatient.view');
        return lintCustomerText(text, db.read());
      },
    },

    videos: {
      async share(id, checks) {
        const a = staffActor(env, 'inpatient.share');
        await sleepWrite();
        if (checks?.only_this_pet !== true || checks?.no_people_or_private_info !== true) {
          throw new ValidationError({ checks: 'Vui lòng kiểm tra đủ hai mục trước khi chia sẻ.' });
        }
        db.transact('inpatient.videos.share', (d) => {
          const v = find(d.t.videos, id);
          if (v.deleted_at) throw new ValidationError({ video: 'Video đã bị xóa.' });
          v.share_status = 'shared';
          v.shared_by = a.staff.id;
          v.shared_at = toIsoVN(env.clock());
          audit(d, env, a, 'video.share', 'video', v.id, `${a.staff.display_name} chia sẻ video với khách`, { sensitive: true });
        });
      },
      async unshare(id) {
        const a = staffActor(env, 'inpatient.share');
        await sleepWrite();
        db.transact('inpatient.videos.unshare', (d) => {
          const v = find(d.t.videos, id);
          v.share_status = 'unshared';
          audit(d, env, a, 'video.unshare', 'video', v.id, `${a.staff.display_name} ngừng chia sẻ video`, { sensitive: true });
        });
      },
      async delete(id) {
        const a = staffActor(env, 'inpatient.share');
        await sleepWrite();
        const key = db.transact('inpatient.videos.delete', (d) => {
          const v = find(d.t.videos, id);
          v.deleted_at = toIsoVN(env.clock());
          v.deleted_by = a.staff.id;
          audit(d, env, a, 'video.delete', 'video', v.id, `${a.staff.display_name} xóa video`, { sensitive: true });
          return v.media_key;
        });
        if (isLocalKey(key)) await env.media.remove([key]);
      },
    },
  };
}
