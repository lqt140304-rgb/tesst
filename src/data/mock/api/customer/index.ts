import type { CustomerApi, CustomerBookingRow, CustomerPetInput, CustomerRequestDetail } from '../../../contracts/customer';
import { REQUEST_STATUS_LABEL, type RequestSnapshot } from '../../../contracts/enums';
import { NotFoundError, ValidationError } from '../../../contracts/errors';
import { daysBetween, formatDayVi, formatTimeVi, toIsoVN } from '../../../../lib/dates';
import { formatPhoneVi } from '../../../../lib/phone';
import { paymentState } from '../../../rules/invoice-math';
import type { Env } from '../../env';
import { currentActor, customerScope, requireLinked } from '../../guard';
import { newId } from '../../ids';
import { appendAudit } from '../../audit';
import { hashPassword, newSalt } from '../../password';
import { MSG, validatePassword } from '../../../rules/validation';
import { sleepRead, sleepWrite } from '../../latency';
import {
  appointmentRow, diaryEntry, invoiceDetail, invoiceRow, petCard, petCondition, requestRow, sharedDiary, STAY_VISIBLE_DAYS, stayCard, videoCard, visibleVideos, webPetCard,
} from '../../projections/customer';
import type { Doc } from '../../store/schema';
import { submitSnapshot } from '../public';
import { purgeExpiredVideos } from '../staff/inpatient';

const PET_MSG = { name: 'Bạn nhập tên bé nhé.', year: 'Năm sinh chưa đúng. Bạn kiểm tra lại giúp nhé.' } as const;

function petFields(input: CustomerPetInput, year: number) {
  if (!input.name.trim()) throw new ValidationError({ name: PET_MSG.name });
  if (input.birth_year !== undefined && (!Number.isInteger(input.birth_year) || input.birth_year < 1990 || input.birth_year > year + 1)) {
    throw new ValidationError({ birth_year: PET_MSG.year });
  }
  return {
    name: input.name.trim(), species: input.species, breed: input.breed?.trim() || undefined, sex: input.sex,
    birth_year: input.birth_year, note: input.note?.trim() || undefined,
  };
}

export function customerApi(env: Env): CustomerApi {
  const { db } = env;
  const scope = () => customerScope(currentActor(db, env.session.get()));
  const year = () => Number(toIsoVN(env.clock()).slice(0, 4));

  function pets(doc: Readonly<Doc>, s: { accountId: string; customerId: string | null }) {
    const hospital = s.customerId ? doc.t.pets.filter((p) => p.customer_id === s.customerId) : [];
    const matched = new Set(doc.t.pet_links.filter((pl) => hospital.some((h) => h.id === pl.pet_id)).map((pl) => pl.account_pet_id));
    const web = doc.t.account_pets.filter((p) => p.account_id === s.accountId && !matched.has(p.id));
    return [...hospital.map((p) => petCard(p, year())), ...web.map((p) => webPetCard(p, year()))];
  }

  function bookings(doc: Readonly<Doc>, s: { accountId: string; customerId: string | null }): CustomerBookingRow[] {
    const now = env.clock();
    const own = doc.t.booking_requests.filter((r) => r.scope === 'account' && r.account_id === s.accountId);
    const viaRequests = new Set(own.map((r) => r.appointment_id).filter(Boolean));
    const appts = s.customerId ? doc.t.appointments.filter((a) => a.customer_id === s.customerId && !viaRequests.has(a.id)) : [];
    const rows = [...own.map((r) => requestRow(doc, r, now)), ...appts.map((a) => appointmentRow(doc, a, now))];
    const key = (r: CustomerBookingRow) => r.appointmentAt ?? `${r.desiredDate}T00:00:00+07:00`;
    return rows.sort((a, b) => (a.group === 'past' ? key(b).localeCompare(key(a)) : key(a).localeCompare(key(b))));
  }

  function linkedStays(doc: Readonly<Doc>, customerId: string) {
    const now = env.clock();
    return doc.t.stays.filter((st) => st.customer_id === customerId && (!st.discharged_at || daysBetween(st.discharged_at, now) <= STAY_VISIBLE_DAYS));
  }

  return {
    async overview() {
      const s = scope();
      await sleepRead();
      purgeExpiredVideos(db, env.clock(), env.media);
      const doc = db.read();
      const acc = doc.t.web_accounts.find((a) => a.id === s.accountId)!;
      const rows = bookings(doc, s);
      const unpaid = s.customerId
        ? doc.t.invoices.filter((i) => i.customer_id === s.customerId && i.status === 'issued').map((i) => paymentState(i.total, doc.t.payments.filter((p) => p.invoice_id === i.id))).filter((x) => x.remaining > 0)
        : [];
      return {
        greetingName: acc.display_name, salutation: acc.salutation, linked: !!s.customerId, linkCode: acc.link_code,
        activeStays: s.customerId ? linkedStays(doc, s.customerId).filter((st) => !st.discharged_at).map((st) => stayCard(doc, st, env.clock())) : [],
        nextAppointment: rows.find((r) => r.group === 'upcoming' && !r.appointmentCancelled),
        processingCount: rows.filter((r) => r.group === 'processing').length,
        unpaid: { count: unpaid.length, remaining: unpaid.reduce((sum, x) => sum + x.remaining, 0) },
        pets: pets(doc, s),
        seen: doc.t.account_seen.filter((x) => x.account_id === s.accountId).map((x) => x.key),
        accountCreatedAt: acc.created_at,
        linkedAt: s.customerId ? doc.t.account_links.find((l) => l.account_id === s.accountId && !l.unlinked_at)?.linked_at : undefined,
      };
    },

    async markSeen(key) {
      const s = scope();
      if (db.read().t.account_seen.some((x) => x.account_id === s.accountId && x.key === key)) return;
      db.transact('customer.markSeen', (d) => { d.t.account_seen.push({ account_id: s.accountId, key, seen_at: toIsoVN(env.clock()) }); }, { markDirty: false });
    },

    account: {
      async get() {
        const s = scope();
        await sleepRead();
        const acc = db.read().t.web_accounts.find((a) => a.id === s.accountId)!;
        const link = s.customerId ? db.read().t.account_links.find((l) => l.account_id === s.accountId && !l.unlinked_at) : undefined;
        return {
          username: acc.username, display_name: acc.display_name, phone: formatPhoneVi(acc.phone_e164), salutation: acc.salutation, linkCode: acc.link_code,
          linked: !!s.customerId, linkedAt: link?.linked_at, createdAt: acc.created_at,
        };
      },
      async update({ display_name, salutation }) {
        const s = scope();
        await sleepWrite();
        if (display_name !== undefined && !display_name.trim()) throw new ValidationError({ display_name: 'Bạn cho Lê Sơn biết tên của bạn nhé.' });
        db.transact('customer.account.update', (d) => {
          const acc = d.t.web_accounts.find((a) => a.id === s.accountId)!;
          if (display_name !== undefined) acc.display_name = display_name.trim();
          if (salutation) acc.salutation = salutation;
        });
      },
      async changePassword({ current, password, password2 }) {
        const s = scope();
        await sleepWrite();
        const acc = db.read().t.web_accounts.find((a) => a.id === s.accountId)!;
        if ((await hashPassword(acc.password_salt, current)) !== acc.password_hash) throw new ValidationError({ current: 'Mật khẩu hiện tại chưa đúng.' });
        const fields: Record<string, string> = {};
        const pwErr = validatePassword(password);
        if (pwErr) fields.password = pwErr;
        if (password !== password2) fields.password2 = MSG.passwordMismatch;
        if (Object.keys(fields).length) throw new ValidationError(fields);
        const salt = newSalt();
        const hash = await hashPassword(salt, password);
        db.transact('customer.account.changePassword', (d) => {
          const a = d.t.web_accounts.find((x) => x.id === s.accountId)!;
          a.password_salt = salt;
          a.password_hash = hash;
          appendAudit(d, env.clock(), { actor_type: 'customer', actor_id: a.id, actor_name_snapshot: a.display_name, action: 'account.password_change', entity_type: 'web_account', entity_id: a.id, summary_vi: 'Khách đổi mật khẩu', sensitive: true });
        });
      },
    },

    pets: {
      async list() {
        const s = scope();
        await sleepRead();
        return pets(db.read(), s);
      },
      async get(id) {
        const s = scope();
        await sleepRead();
        const doc = db.read();
        const pet = pets(doc, s).find((p) => p.id === id);
        if (!pet) throw new NotFoundError();
        // By id, never by name: two pets may share a name and a web pet may be renamed (F02). A hospital pet also owns the bookings of the web pet linked to it.
        const ids = new Set([pet.id, ...doc.t.pet_links.filter((pl) => pl.pet_id === pet.id).map((pl) => pl.account_pet_id)]);
        const mine = (x?: string) => !!x && ids.has(x);
        const rows = bookings(doc, s).filter((r) => {
          if (r.kind === 'appointment') return mine(doc.t.appointments.find((a) => a.id === r.id)?.pet_id);
          const req = doc.t.booking_requests.find((x) => x.id === r.id);
          return !!req && (mine(req.pet_id) || mine(req.snapshot.pet_id) || mine(req.snapshot.account_pet_id));
        });
        const stays = s.customerId && pet.source === 'hospital' ? linkedStays(doc, s.customerId).filter((st) => st.pet_id === pet.id).map((st) => st.id) : [];
        return { pet, bookings: rows, condition: petCondition(doc, stays) };
      },
      async create(input) {
        const s = scope();
        await sleepWrite();
        const fields = petFields(input, year());
        return db.transact('customer.pets.create', (d) => {
          const id = newId();
          d.t.account_pets.push({ id, account_id: s.accountId, ...fields, created_at: toIsoVN(env.clock()) });
          return id;
        });
      },
      async update(id, input) {
        const s = scope();
        await sleepWrite();
        const fields = petFields(input, year());
        db.transact('customer.pets.update', (d) => {
          const p = d.t.account_pets.find((x) => x.id === id && x.account_id === s.accountId);
          if (!p) throw new NotFoundError();
          Object.assign(p, fields);
        });
      },
      async remove(id) {
        const s = scope();
        await sleepWrite();
        db.transact('customer.pets.remove', (d) => {
          const i = d.t.account_pets.findIndex((x) => x.id === id && x.account_id === s.accountId);
          if (i < 0) throw new NotFoundError();
          d.t.account_pets.splice(i, 1);
          d.t.pet_links = d.t.pet_links.filter((pl) => pl.account_pet_id !== id);
        });
      },
    },

    appointments: {
      async list() {
        const s = scope();
        await sleepRead();
        const rows = bookings(db.read(), s);
        return { upcoming: rows.filter((r) => r.group === 'upcoming'), processing: rows.filter((r) => r.group === 'processing'), past: rows.filter((r) => r.group === 'past') };
      },

      async getRequest(id) {
        const s = scope();
        await sleepRead();
        const doc = db.read();
        const r = doc.t.booking_requests.find((x) => x.id === id && x.scope === 'account' && x.account_id === s.accountId);
        if (!r) throw new NotFoundError();
        const row = requestRow(doc, r, env.clock());
        const timeline: CustomerRequestDetail['timeline'] = [];
        for (const e of doc.t.request_events.filter((x) => x.request_id === r.id).sort((a, b) => a.at.localeCompare(b.at))) {
          if (e.type === 'created') timeline.push({ label: 'Bạn gửi yêu cầu', at: e.at, tone: 'main' });
          else if (e.type === 'status_change' && e.to_status) {
            timeline.push({ label: REQUEST_STATUS_LABEL[e.to_status], at: e.at, tone: ['contacting', 'confirmed'].includes(e.to_status) ? 'main' : 'side' });
          } else if (e.type === 'resubmit' && e.actor_type === 'customer') timeline.push({ label: 'Bạn đã nhờ Lê Sơn gọi lại', at: e.at, tone: 'reminder' });
        }
        const apt = r.appointment_id ? doc.t.appointments.find((a) => a.id === r.appointment_id) : undefined;
        if (apt?.rescheduled_from) timeline.push({ label: `Lịch hẹn đã được đổi sang ${formatTimeVi(apt.start_at)}, ${formatDayVi(apt.start_at).toLowerCase()}`, at: apt.start_at, tone: 'side' });
        const sn = r.snapshot;
        return {
          id: row.id, kind: row.kind, code: row.code, status: row.status, group: row.group, petName: row.petName, service: row.service, desiredDate: row.desiredDate, preferredSlot: row.preferredSlot,
          appointmentAt: row.appointmentAt, appointmentCancelled: row.appointmentCancelled, viaPhone: row.viaPhone, viaCounter: row.viaCounter,
          reminderSentAt: row.reminderSentAt, canCallBack: row.canCallBack, rescheduledFrom: row.rescheduledFrom, createdAt: row.createdAt,
          snapshot: { contact_name: sn.contact_name, phone: formatPhoneVi(sn.phone_e164), pet_name: sn.pet_name, species: sn.species, breed: sn.breed, service: sn.service, desired_date: sn.desired_date, preferred_slot: sn.preferred_slot, note: sn.note },
          timeline,
        };
      },

      async callMeBack(requestId) {
        const s = scope();
        await sleepWrite();
        db.transact('customer.callMeBack', (d) => {
          const r = d.t.booking_requests.find((x) => x.id === requestId && x.scope === 'account' && x.account_id === s.accountId);
          if (!r) throw new NotFoundError();
          if (r.status !== 'unreachable') throw new ValidationError({ status: 'Yêu cầu này không cần nhắc gọi lại.' });
          const snapshot: RequestSnapshot = r.snapshot;
          submitSnapshot(d, env.clock(), { kind: 'account', accountId: s.accountId }, snapshot, { type: 'customer', id: s.accountId });
        });
      },
    },

    stays: {
      async list() {
        const s = scope();
        const customerId = requireLinked(s);
        await sleepRead();
        purgeExpiredVideos(db, env.clock(), env.media);
        const doc = db.read();
        const cards = linkedStays(doc, customerId).map((st) => stayCard(doc, st, env.clock()));
        return { current: cards.filter((c) => c.current), past: cards.filter((c) => !c.current) };
      },
      async get(id) {
        const s = scope();
        const customerId = requireLinked(s);
        await sleepRead();
        purgeExpiredVideos(db, env.clock(), env.media);
        const doc = db.read();
        const st = linkedStays(doc, customerId).find((x) => x.id === id);
        if (!st) throw new NotFoundError();
        const now = env.clock();
        return {
          stay: stayCard(doc, st, now),
          diary: sharedDiary(doc, st.id).map((e) => diaryEntry(e, now)),
          videos: visibleVideos(doc, new Set([st.pet_id]), now).filter((v) => v.stay_id === st.id).sort((a, b) => b.recorded_at.localeCompare(a.recorded_at)).map((v) => videoCard(doc, v, now)),
        };
      },
    },

    videos: {
      async list() {
        const s = scope();
        const customerId = requireLinked(s);
        await sleepRead();
        purgeExpiredVideos(db, env.clock(), env.media);
        const doc = db.read();
        const petIds = new Set(doc.t.pets.filter((p) => p.customer_id === customerId).map((p) => p.id));
        return visibleVideos(doc, petIds, env.clock()).sort((a, b) => b.recorded_at.localeCompare(a.recorded_at)).map((v) => videoCard(doc, v, env.clock()));
      },
    },

    invoices: {
      async list() {
        const s = scope();
        const customerId = requireLinked(s);
        await sleepRead();
        const doc = db.read();
        return doc.t.invoices.filter((i) => i.customer_id === customerId && i.status === 'issued').sort((a, b) => b.issued_at!.localeCompare(a.issued_at!)).map((i) => invoiceRow(doc, i));
      },
      async get(id) {
        const s = scope();
        const customerId = requireLinked(s);
        await sleepRead();
        const doc = db.read();
        const inv = doc.t.invoices.find((i) => i.id === id && i.customer_id === customerId && i.status === 'issued');
        if (!inv) throw new NotFoundError();
        return invoiceDetail(doc, inv);
      },
    },
  };
}
