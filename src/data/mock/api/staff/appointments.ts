import { ValidationError } from '../../../contracts/errors';
import type { StaffAppointment, StaffAppointmentsApi } from '../../../contracts/staff';
import { dayOf, formatDayVi, formatTimeVi, toIsoVN } from '../../../../lib/dates';
import type { Env } from '../../env';
import { newId, nextCode } from '../../ids';
import { sleepRead, sleepWrite } from '../../latency';
import type { Appointment, Doc } from '../../store/schema';
import { checkVersion } from '../../store/version';
import { audit, find, staffActor, staffName } from './common';

export function toStaffAppointment(doc: Readonly<Doc>, a: Appointment, now: Date): StaffAppointment {
  const pet = doc.t.pets.find((p) => p.id === a.pet_id)!;
  const customer = doc.t.customers.find((c) => c.id === a.customer_id)!;
  return {
    id: a.id, code: a.code, start_at: a.start_at, duration_min: a.duration_min, service: a.service, status: a.status, source: a.source,
    petId: pet.id, petName: pet.name, species: pet.species, customerId: customer.id, customerName: customer.full_name, customerPhone: customer.phone_e164,
    assigneeId: a.assignee_id, assigneeName: staffName(doc, a.assignee_id), requestCode: a.request_id ? doc.t.booking_requests.find((r) => r.id === a.request_id)?.code : undefined,
    past: new Date(a.start_at).getTime() + a.duration_min * 60_000 <= now.getTime(), version: a.version, note_internal: a.note_internal, alerts: pet.alerts,
  };
}

export function staffAppointmentsApi(env: Env): StaffAppointmentsApi {
  const { db } = env;
  return {
    async listRange(fromDate, toDate, f) {
      staffActor(env, 'appointments.view');
      await sleepRead();
      const doc = db.read();
      return doc.t.appointments
        .filter((a) => dayOf(a.start_at) >= fromDate && dayOf(a.start_at) <= toDate)
        .filter((a) => !f?.assignee_id || a.assignee_id === f.assignee_id)
        .sort((a, b) => a.start_at.localeCompare(b.start_at))
        .map((a) => toStaffAppointment(doc, a, env.clock()));
    },

    async create(input) {
      const a = staffActor(env, 'appointments.manage');
      await sleepWrite();
      if (!input.start_at || Number.isNaN(Date.parse(input.start_at))) throw new ValidationError({ start_at: 'Vui lòng chọn đủ ngày và giờ hẹn.' });
      return db.transact('appointments.create', (d) => {
        const customer = find(d.t.customers, input.customer_id);
        const pet = find(d.t.pets, input.pet_id);
        if (pet.customer_id !== customer.id) throw new ValidationError({ pet_id: 'Bé không thuộc hồ sơ khách hàng này.' });
        const id = newId();
        const code = nextCode(d, 'LH');
        d.t.appointments.push({ id, code, customer_id: customer.id, pet_id: pet.id, service: input.service, start_at: input.start_at, duration_min: input.duration_min, assignee_id: input.assignee_id, status: 'scheduled', source: input.source, note_internal: input.note_internal, version: 1, created_by: a.staff.id, created_at: toIsoVN(env.clock()) });
        audit(d, env, a, 'appointment.create', 'appointment', id, `${a.staff.display_name} tạo lịch hẹn ${code} cho ${pet.name} lúc ${formatTimeVi(input.start_at)}, ${formatDayVi(input.start_at)}`);
        return id;
      });
    },

    async reschedule(id, version, { start_at, reason }) {
      const a = staffActor(env, 'appointments.manage');
      await sleepWrite();
      if (!start_at || Number.isNaN(Date.parse(start_at))) throw new ValidationError({ start_at: 'Vui lòng chọn đủ ngày và giờ hẹn.' });
      db.transact('appointments.reschedule', (d) => {
        const apt = find(d.t.appointments, id);
        checkVersion(apt, version);
        if (apt.status !== 'scheduled') throw new ValidationError({ status: 'Lịch hẹn đã hủy, không đổi giờ được.' });
        apt.rescheduled_from = apt.start_at;
        audit(d, env, a, 'appointment.reschedule', 'appointment', id, `${a.staff.display_name} đổi lịch ${apt.code} sang ${formatTimeVi(start_at)}, ${formatDayVi(start_at)}`, { reason });
        apt.start_at = start_at;
        apt.version += 1;
      });
    },

    async cancel(id, version, { reason }) {
      const a = staffActor(env, 'appointments.manage');
      await sleepWrite();
      db.transact('appointments.cancel', (d) => {
        const apt = find(d.t.appointments, id);
        checkVersion(apt, version);
        if (apt.status === 'cancelled') return;
        apt.status = 'cancelled';
        apt.cancel_reason = reason;
        apt.version += 1;
        audit(d, env, a, 'appointment.cancel', 'appointment', id, `${a.staff.display_name} hủy lịch hẹn ${apt.code}`, { reason });
        const r = apt.request_id ? d.t.booking_requests.find((x) => x.id === apt.request_id) : undefined;
        if (r && r.status === 'confirmed') {
          const at = toIsoVN(env.clock());
          d.t.request_events.push({ id: newId(), request_id: r.id, type: 'status_change', from_status: 'confirmed', to_status: 'cancelled', reason_text: reason, actor_type: 'staff', actor_id: a.staff.id, at });
          r.status = 'cancelled';
          r.updated_at = at;
          r.version += 1;
        }
      });
    },
  };
}
