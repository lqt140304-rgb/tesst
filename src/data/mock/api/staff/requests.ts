import { CALL_OUTCOME_LABEL, REQUEST_STATUS_LABEL, type RequestStatus } from '../../../contracts/enums';
import { ValidationError } from '../../../contracts/errors';
import type { RequestTab, StaffRequestCard, StaffRequestDetail, StaffRequestsApi, StaffRescheduleRow } from '../../../contracts/staff';
import { formatDayVi, formatTimeVi, toIsoVN } from '../../../../lib/dates';
import { normalizeVnPhone } from '../../../../lib/phone';
import { canTransition } from '../../../rules/request-status';
import type { Env } from '../../env';
import { newId, nextCode } from '../../ids';
import { sleepRead, sleepWrite } from '../../latency';
import type { BookingRequest, Doc } from '../../store/schema';
import { checkVersion } from '../../store/version';
import { audit, find, fold, staffActor, staffName, type StaffActor } from './common';
import { assertAssigneeFree } from './appointments';

const OPEN: RequestStatus[] = ['pending', 'contacting', 'unreachable'];
const ORDER: Record<string, number> = { pending: 0, contacting: 1, unreachable: 2 };

function card(doc: Readonly<Doc>, r: BookingRequest): StaffRequestCard {
  const s = r.snapshot;
  return {
    id: r.id, code: r.code, status: r.status, version: r.version, flaggedAt: r.resubmit_flag_at, createdAt: r.created_at,
    contactName: s.contact_name, phone: s.phone_e164, petName: s.pet_name, species: s.species, breed: s.breed, service: s.service,
    desiredDate: s.desired_date, source: r.scope, accountUsername: r.account_id ? doc.t.web_accounts.find((a) => a.id === r.account_id)?.username : undefined,
    callCount: doc.t.request_events.filter((e) => e.request_id === r.id && e.type === 'call').length, handlerName: staffName(doc, r.handler_id),
  };
}

function inTab(r: BookingRequest, tab: RequestTab) {
  if (tab === 'tat_ca') return true;
  if (tab === 'can_xu_ly') return OPEN.includes(r.status);
  return r.status === tab;
}

export function staffRequestsApi(env: Env): StaffRequestsApi {
  const { db } = env;
  const CAP = 'requests.handle' as const;

  /** Status change + flag clearing + event + audit, all inside the caller's transaction. */
  function move(d: Doc, a: StaffActor, r: BookingRequest, to: RequestStatus, extra?: { reason_code?: string; reason_text?: string; note?: string }) {
    if (!canTransition(r.status, to)) {
      throw new ValidationError({ status: `Không thể chuyển từ "${REQUEST_STATUS_LABEL[r.status]}" sang "${REQUEST_STATUS_LABEL[to]}".` });
    }
    const at = toIsoVN(env.clock());
    d.t.request_events.push({ id: newId(), request_id: r.id, type: 'status_change', from_status: r.status, to_status: to, reason_code: extra?.reason_code, reason_text: extra?.reason_text, note: extra?.note, actor_type: 'staff', actor_id: a.staff.id, at });
    audit(d, env, a, 'request.status', 'booking_request', r.id, `${a.staff.display_name} chuyển yêu cầu ${r.code} từ ${REQUEST_STATUS_LABEL[r.status]} sang ${REQUEST_STATUS_LABEL[to]}`, { reason: extra?.reason_text ?? extra?.reason_code });
    if (r.status === 'unreachable') delete r.resubmit_flag_at; // any transition out of "unreachable" clears the flag
    r.status = to;
    r.updated_at = at;
    r.version += 1;
  }

  function mutate(id: string, version: number, label: string, fn: (d: Doc, a: StaffActor, r: BookingRequest) => void) {
    const a = staffActor(env, CAP);
    return db.transact(label, (d) => {
      const r = find(d.t.booking_requests, id);
      checkVersion(r, version);
      fn(d, a, r);
    });
  }

  return {
    async list({ tab, q }) {
      staffActor(env, CAP);
      await sleepRead();
      const doc = db.read();
      const needle = q ? fold(q.trim()) : '';
      const phone = q ? normalizeVnPhone(q) : null;
      const rows = doc.t.booking_requests.filter((r) => inTab(r, tab)).filter((r) => {
        if (!needle) return true;
        if (phone) return r.snapshot.phone_e164 === phone;
        return [r.code, r.snapshot.contact_name, r.snapshot.pet_name].some((x) => fold(x).includes(needle));
      });
      if (tab === 'can_xu_ly') {
        rows.sort((a, b) => {
          if (!!a.resubmit_flag_at !== !!b.resubmit_flag_at) return a.resubmit_flag_at ? -1 : 1;
          return ORDER[a.status]! - ORDER[b.status]! || a.created_at.localeCompare(b.created_at);
        });
      } else rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
      return rows.map((r) => card(doc, r));
    },

    async counts() {
      staffActor(env, CAP);
      const { t } = db.read();
      const tabs: RequestTab[] = ['can_xu_ly', 'pending', 'contacting', 'unreachable', 'confirmed', 'cancelled', 'rejected', 'tat_ca'];
      return Object.fromEntries(tabs.map((tab) => [tab, t.booking_requests.filter((r) => inTab(r, tab)).length])) as Record<RequestTab, number>;
    },

    async get(id) {
      staffActor(env, CAP);
      await sleepRead();
      const doc = db.read();
      const r = find(doc.t.booking_requests as BookingRequest[], id);
      const events = doc.t.request_events.filter((e) => e.request_id === id).sort((a, b) => a.at.localeCompare(b.at)).map((e) => {
        const actorName = e.actor_type === 'staff' ? staffName(doc, e.actor_id) ?? 'Nhân viên' : e.actor_type === 'system' ? 'Hệ thống' : 'Khách';
        if (e.type === 'created') return { at: e.at, kind: 'created' as const, actorName, label: 'Khách gửi yêu cầu' };
        if (e.type === 'call') return { at: e.at, kind: 'call' as const, actorName, note: e.note, label: `Cuộc gọi: ${CALL_OUTCOME_LABEL[e.call_outcome!]}` };
        if (e.type === 'resubmit') return { at: e.at, kind: 'resubmit' as const, actorName, label: 'Khách vừa gửi lại yêu cầu giống hệt' };
        return { at: e.at, kind: 'status' as const, actorName, note: e.reason_text ?? e.note, label: `${REQUEST_STATUS_LABEL[e.from_status!]} → ${REQUEST_STATUS_LABEL[e.to_status!]}` };
      });
      const apt = r.appointment_id ? doc.t.appointments.find((a) => a.id === r.appointment_id) : undefined;
      const account = r.account_id ? doc.t.web_accounts.find((a) => a.id === r.account_id) : undefined;
      const link = account ? doc.t.account_links.find((l) => l.account_id === account.id && !l.unlinked_at) : undefined;
      const detail: StaffRequestDetail = {
        ...card(doc, r),
        snapshot: r.snapshot,
        events,
        appointment: apt ? { id: apt.id, start_at: apt.start_at, assigneeName: staffName(doc, apt.assignee_id), status: apt.status } : undefined,
        account: account ? { username: account.username, linkedCustomerCode: link ? doc.t.customers.find((c) => c.id === link.customer_id)?.code : undefined } : undefined,
        phoneMatches: doc.t.customers.filter((c) => c.phone_e164 === r.snapshot.phone_e164).map((c) => ({ id: c.id, code: c.code, full_name: c.full_name })),
      };
      return detail;
    },

    async startContact(id, version) {
      await sleepWrite();
      mutate(id, version, 'requests.startContact', (d, a, r) => {
        move(d, a, r, 'contacting');
        r.handler_id = a.staff.id;
      });
    },

    async logCall(id, version, { outcome, note, markUnreachable }) {
      await sleepWrite();
      mutate(id, version, 'requests.logCall', (d, a, r) => {
        d.t.request_events.push({ id: newId(), request_id: r.id, type: 'call', call_outcome: outcome, note: note?.trim() || undefined, actor_type: 'staff', actor_id: a.staff.id, at: toIsoVN(env.clock()) });
        audit(d, env, a, 'request.call', 'booking_request', r.id, `${a.staff.display_name} ghi cuộc gọi cho ${r.code}: ${CALL_OUTCOME_LABEL[outcome]}`);
        r.version += 1;
        if (markUnreachable && r.status === 'contacting' && (outcome === 'no_answer' || outcome === 'busy')) move(d, a, r, 'unreachable');
      });
    },

    async markUnreachable(id, version) {
      await sleepWrite();
      mutate(id, version, 'requests.markUnreachable', (d, a, r) => move(d, a, r, 'unreachable'));
    },

    async confirm(id, version, input) {
      await sleepWrite();
      if (!input.start_at || Number.isNaN(Date.parse(input.start_at))) throw new ValidationError({ start_at: 'Vui lòng chọn đủ ngày và giờ hẹn.' });
      let aptId = '';
      mutate(id, version, 'requests.confirm', (d, a, r) => {
        assertAssigneeFree(d, { assignee_id: input.assignee_id, start_at: input.start_at, duration_min: input.duration_min });
        const now = toIsoVN(env.clock());
        let customerId: string;
        if ('existingId' in input.customer) customerId = find(d.t.customers, input.customer.existingId).id;
        else {
          customerId = newId();
          d.t.customers.push({ id: customerId, code: nextCode(d, 'KH'), full_name: r.snapshot.contact_name, phone_e164: r.snapshot.phone_e164, created_at: now, created_by: a.staff.id, version: 1 });
        }
        let petId: string;
        if ('existingId' in input.pet) {
          const p = find(d.t.pets, input.pet.existingId);
          if (p.customer_id !== customerId) throw new ValidationError({ pet: 'Bé không thuộc hồ sơ khách hàng này.' });
          petId = p.id;
        } else {
          petId = newId();
          d.t.pets.push({ id: petId, code: nextCode(d, 'TC'), customer_id: customerId, name: r.snapshot.pet_name, species: r.snapshot.species, breed: r.snapshot.breed, alerts: [], version: 1 });
        }
        aptId = newId();
        d.t.appointments.push({
          id: aptId, code: nextCode(d, 'LH'), customer_id: customerId, pet_id: petId, service: r.snapshot.service, start_at: input.start_at,
          duration_min: input.duration_min, assignee_id: input.assignee_id, status: 'scheduled', source: 'web_request', request_id: r.id,
          note_internal: input.note_internal, version: 1, created_by: a.staff.id, created_at: now,
        });
        move(d, a, r, 'confirmed', { note: `Lịch hẹn ${formatTimeVi(input.start_at)}, ${formatDayVi(input.start_at)}` });
        r.appointment_id = aptId;
        r.customer_id = customerId;
        r.pet_id = petId;
      });
      return aptId;
    },

    async cancel(id, version, { reason_code, reason_text }) {
      await sleepWrite();
      mutate(id, version, 'requests.cancel', (d, a, r) => {
        move(d, a, r, 'cancelled', { reason_code, reason_text });
        const apt = r.appointment_id ? d.t.appointments.find((x) => x.id === r.appointment_id) : undefined;
        if (apt && apt.status === 'scheduled') {
          apt.status = 'cancelled';
          apt.cancel_reason = reason_text ?? reason_code;
          apt.version += 1;
        }
      });
    },

    async reschedules() {
      staffActor(env, [CAP, 'appointments.manage']);
      await sleepRead();
      const doc = db.read();
      return doc.t.reschedule_requests.filter((q) => q.status === 'pending').sort((x, y) => Date.parse(x.created_at) - Date.parse(y.created_at)).map((q): StaffRescheduleRow => {
        const apt = doc.t.appointments.find((a) => a.id === q.appointment_id)!;
        const pet = doc.t.pets.find((p) => p.id === apt.pet_id)!;
        const c = doc.t.customers.find((x) => x.id === apt.customer_id)!;
        return {
          id: q.id, createdAt: q.created_at, appointmentId: apt.id, appointmentCode: apt.code, currentStart: apt.start_at, service: apt.service,
          petName: pet.name, species: pet.species, photoKey: pet.photo_key, customerId: c.id, customerName: c.full_name, phone: c.phone_e164,
          accountUsername: doc.t.web_accounts.find((x) => x.id === q.account_id)?.username, desiredDate: q.desired_date, preferredSlot: q.preferred_slot, reason: q.reason,
        };
      });
    },

    async keepAppointment(rescheduleId, input) {
      const a = staffActor(env, [CAP, 'appointments.manage']);
      await sleepWrite();
      db.transact('requests.keepAppointment', (d) => {
        const q = find(d.t.reschedule_requests, rescheduleId);
        if (q.status !== 'pending') throw new ValidationError({ status: 'Yêu cầu đổi lịch này đã được xử lý.' });
        q.status = 'kept';
        q.closed_at = toIsoVN(env.clock());
        q.closed_by = a.staff.id;
        q.note = input?.note?.trim() || undefined;
        const apt = d.t.appointments.find((x) => x.id === q.appointment_id);
        audit(d, env, a, 'reschedule.kept', 'appointment', q.appointment_id, `${a.staff.display_name} giữ lịch ${apt?.code ?? ''} — khách không đổi`, { reason: q.note });
      });
    },

    async reject(id, version, { reason_code, reason_text, duplicate_of }) {
      await sleepWrite();
      mutate(id, version, 'requests.reject', (d, a, r) => move(d, a, r, 'rejected', { reason_code, reason_text: reason_text ?? (duplicate_of ? `Trùng với ${duplicate_of}` : undefined) }));
    },
  };
}
