import { ValidationError } from '../../../contracts/errors';
import type { StaffAccountsApi, StaffCustomerDetail, StaffCustomersApi } from '../../../contracts/staff';
import { toIsoVN } from '../../../../lib/dates';
import { normalizeVnPhone } from '../../../../lib/phone';
import { paymentState } from '../../../rules/invoice-math';
import { normalizeLinkCode } from '../../../rules/linking';
import { validatePetInput } from '../../../rules/pet';
import { MSG } from '../../../rules/validation';
import type { Env } from '../../env';
import { newId, nextCode } from '../../ids';
import { sleepRead, sleepWrite } from '../../latency';
import { checkVersion } from '../../store/version';
import { toStaffAppointment } from './appointments';
import { customerInteractions } from './customer-history';
import { audit, find, fold, staffActor } from './common';

export function staffCustomersApi(env: Env): StaffCustomersApi {
  const { db } = env;
  return {
    async list(q) {
      staffActor(env, 'customers.view');
      await sleepRead();
      const { t } = db.read();
      const needle = q ? fold(q.trim()) : '';
      const phone = q ? normalizeVnPhone(q) : null;
      const now = env.clock().getTime();
      return t.customers
        .map((c) => {
          const pets = t.pets.filter((p) => p.customer_id === c.id);
          const link = t.account_links.find((l) => l.customer_id === c.id && !l.unlinked_at);
          return { c, pets, username: link ? t.web_accounts.find((a) => a.id === link.account_id)?.username : undefined };
        })
        .filter(({ c, pets }) => !needle || (phone ? c.phone_e164 === phone : [c.code, c.full_name, ...pets.map((p) => p.name)].some((x) => fold(x).includes(needle))))
        .map(({ c, pets, username }) => {
          const outstanding = t.invoices.filter((i) => i.customer_id === c.id && i.status === 'issued')
            .reduce((n, i) => n + paymentState(i.total, t.payments.filter((p) => p.invoice_id === i.id)).remaining, 0);
          const apts = t.appointments.filter((a) => a.customer_id === c.id && a.status === 'scheduled').map((a) => a.start_at).sort();
          const next = apts.find((s) => Date.parse(s) >= now);
          const last = apts.filter((s) => Date.parse(s) < now).pop();
          return {
            id: c.id, code: c.code, full_name: c.full_name, phone: c.phone_e164, petNames: pets.map((p) => p.name), pets: pets.map((p) => ({ id: p.id, name: p.name, species: p.species, photoKey: p.photo_key })), linkedUsername: username,
            outstanding, inpatient: t.stays.some((s) => s.customer_id === c.id && !s.discharged_at),
            nearestAppointment: next ? { start_at: next, upcoming: true } : last ? { start_at: last, upcoming: false } : undefined,
          };
        });
    },

    async get(id) {
      const actor = staffActor(env, 'customers.view');
      await sleepRead();
      const doc = db.read();
      const { t } = doc;
      const c = find(t.customers, id);
      const link = t.account_links.find((l) => l.customer_id === id && !l.unlinked_at);
      const account = link ? t.web_accounts.find((a) => a.id === link.account_id) : undefined;
      const detail: StaffCustomerDetail = {
        id: c.id, code: c.code, full_name: c.full_name, phone: c.phone_e164, address: c.address, note_internal: c.note_internal, created_at: c.created_at, version: c.version, interactions: customerInteractions(doc, id, actor.caps),
        pets: t.pets.filter((p) => p.customer_id === id).map((p) => ({ id: p.id, code: p.code, name: p.name, species: p.species, breed: p.breed, sex: p.sex, birth_year: p.birth_year, neutered: p.neutered, alerts: p.alerts, note_internal: p.note_internal, photoKey: p.photo_key, version: p.version, weight_kg: p.weight_kg, color: p.color })),
        appointments: t.appointments.filter((a) => a.customer_id === id).sort((a, b) => b.start_at.localeCompare(a.start_at)).map((a) => toStaffAppointment(doc, a, env.clock())),
        linkedAccount: account && link ? { id: account.id, username: account.username, linked_at: link.linked_at } : undefined,
        stays: t.stays.filter((s) => s.customer_id === id).map((s) => ({ id: s.id, code: s.code, petName: t.pets.find((p) => p.id === s.pet_id)!.name, admitted_at: s.admitted_at, discharged_at: s.discharged_at })),
        invoices: t.invoices.filter((i) => i.customer_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((i) => {
          const ps = paymentState(i.total, t.payments.filter((p) => p.invoice_id === i.id));
          return { id: i.id, code: i.code, total: i.total, status: i.status, state: i.status === 'issued' ? ps.state : undefined, remaining: i.status === 'issued' ? ps.remaining : 0, issued_at: i.issued_at };
        }),
      };
      return detail;
    },

    async create(input) {
      const a = staffActor(env, 'customers.edit');
      await sleepWrite();
      const phone = normalizeVnPhone(input.phone);
      const fields: Record<string, string> = {};
      if (!input.full_name.trim()) fields.full_name = 'Vui lòng nhập họ tên khách hàng.';
      if (!phone) fields.phone = MSG.phoneInvalid;
      if (Object.keys(fields).length) throw new ValidationError(fields);
      return db.transact('customers.create', (d) => {
        const id = newId();
        const code = nextCode(d, 'KH');
        d.t.customers.push({ id, code, full_name: input.full_name.trim(), phone_e164: phone!, address: input.address?.trim() || undefined, note_internal: input.note_internal?.trim() || undefined, created_at: toIsoVN(env.clock()), created_by: a.staff.id, version: 1 });
        audit(d, env, a, 'customer.create', 'customer', id, `${a.staff.display_name} tạo hồ sơ ${code}`);
        return id;
      });
    },

    async update(id, version, input) {
      const a = staffActor(env, 'customers.edit');
      await sleepWrite();
      const phone = normalizeVnPhone(input.phone);
      const fields: Record<string, string> = {};
      if (!input.full_name.trim()) fields.full_name = 'Vui lòng nhập họ tên khách hàng.';
      if (!phone) fields.phone = MSG.phoneInvalid;
      if (Object.keys(fields).length) throw new ValidationError(fields);
      db.transact('customers.update', (d) => {
        const c = find(d.t.customers, id);
        checkVersion(c, version);
        c.full_name = input.full_name.trim();
        c.phone_e164 = phone!;
        c.address = input.address?.trim() || undefined;
        c.note_internal = input.note_internal?.trim() || undefined;
        c.version += 1;
        audit(d, env, a, 'customer.update', 'customer', id, `${a.staff.display_name} cập nhật hồ sơ ${c.code}`);
      });
    },

    async updatePet(petId, version, input) {
      const a = staffActor(env, 'customers.edit');
      await sleepWrite();
      const fields = validatePetInput(input, Number(toIsoVN(env.clock()).slice(0, 4)));
      if (Object.keys(fields).length) throw new ValidationError(fields as Record<string, string>);
      db.transact('customers.updatePet', (d) => {
        const p = find(d.t.pets, petId);
        checkVersion(p, version);
        // photo_key, code and owner are not editable here (the demo has no photo upload).
        Object.assign(p, {
          name: input.name.trim(), species: input.species, breed: input.breed?.trim() || undefined, sex: input.sex, birth_year: input.birth_year,
          alerts: input.alerts ?? [], weight_kg: input.weight_kg, color: input.color?.trim() || undefined, neutered: input.neutered, note_internal: input.note_internal?.trim() || undefined,
        });
        p.version += 1;
        audit(d, env, a, 'pet.update', 'pet', petId, `${a.staff.display_name} cập nhật thông tin ${p.name}`);
      });
    },

    async findByPhone(phone, excludeId) {
      staffActor(env, 'customers.view');
      await sleepRead();
      const e164 = normalizeVnPhone(phone);
      if (!e164) return [];
      return db.read().t.customers.filter((c) => c.phone_e164 === e164 && c.id !== excludeId).map((c) => ({ id: c.id, code: c.code, full_name: c.full_name }));
    },

    async createPet(customerId, input) {
      const a = staffActor(env, 'customers.edit');
      await sleepWrite();
      const fields = validatePetInput(input, Number(toIsoVN(env.clock()).slice(0, 4)));
      if (Object.keys(fields).length) throw new ValidationError(fields as Record<string, string>);
      return db.transact('customers.createPet', (d) => {
        const c = find(d.t.customers, customerId);
        const id = newId();
        d.t.pets.push({ id, code: nextCode(d, 'TC'), customer_id: c.id, name: input.name.trim(), species: input.species, breed: input.breed?.trim() || undefined, sex: input.sex, birth_year: input.birth_year, alerts: input.alerts ?? [], weight_kg: input.weight_kg, color: input.color?.trim() || undefined, neutered: input.neutered, note_internal: input.note_internal?.trim() || undefined, version: 1 });
        audit(d, env, a, 'pet.create', 'pet', id, `${a.staff.display_name} thêm thú cưng ${input.name.trim()} vào ${c.code}`);
        return id;
      });
    },
  };
}

export function staffAccountsApi(env: Env): StaffAccountsApi {
  const { db } = env;
  const CAP = 'accounts.link' as const;
  return {
    async list(f) {
      staffActor(env, CAP);
      await sleepRead();
      const { t } = db.read();
      return t.web_accounts
        .map((a) => {
          const link = t.account_links.find((l) => l.account_id === a.id && !l.unlinked_at);
          const c = link ? t.customers.find((x) => x.id === link.customer_id) : undefined;
          return { id: a.id, username: a.username, display_name: a.display_name, phone: a.phone_e164, created_at: a.created_at, linked: !!link, customerCode: c?.code, customerName: c?.full_name };
        })
        .filter((r) => f?.linked === undefined || r.linked === f.linked)
        .sort((x, y) => y.created_at.localeCompare(x.created_at));
    },

    async findByLinkCode(code) {
      staffActor(env, CAP);
      await sleepRead();
      const { t } = db.read();
      const acc = t.web_accounts.find((a) => a.link_code === normalizeLinkCode(code));
      if (!acc) return null;
      return {
        account: { id: acc.id, username: acc.username, display_name: acc.display_name, phone: acc.phone_e164, created_at: acc.created_at },
        alreadyLinked: t.account_links.some((l) => l.account_id === acc.id && !l.unlinked_at),
        webPets: t.account_pets.filter((p) => p.account_id === acc.id).map((p) => ({ id: p.id, name: p.name, species: p.species, breed: p.breed })),
        phoneMatches: t.customers.filter((c) => c.phone_e164 === acc.phone_e164).map((c) => ({ id: c.id, code: c.code, full_name: c.full_name, pets: t.pets.filter((p) => p.customer_id === c.id).map((p) => ({ id: p.id, name: p.name, species: p.species })) })),
      };
    },

    async link(accountId, input) {
      const a = staffActor(env, CAP);
      await sleepWrite();
      if (input.confirmed !== true) throw new ValidationError({ confirmed: 'Vui lòng xác nhận đã kiểm tra khách trực tiếp tại quầy.' });
      db.transact('accounts.link', (d) => {
        const acc = find(d.t.web_accounts, accountId);
        const c = find(d.t.customers, input.customer_id);
        if (d.t.account_links.some((l) => l.account_id === acc.id && !l.unlinked_at)) throw new ValidationError({ account: 'Tài khoản này đã được liên kết.' });
        if (d.t.account_links.some((l) => l.customer_id === c.id && !l.unlinked_at)) throw new ValidationError({ customer: 'Hồ sơ này đã liên kết với một tài khoản khác.' });
        const linkId = newId();
        const now = toIsoVN(env.clock());
        d.t.account_links.push({ id: linkId, account_id: acc.id, customer_id: c.id, linked_at: now, linked_by: a.staff.id, method: input.method, method_note: input.method_note?.trim() || undefined });
        for (const m of input.pet_matches) {
          const ap = d.t.account_pets.find((p) => p.id === m.account_pet_id && p.account_id === acc.id);
          const pet = d.t.pets.find((p) => p.id === m.pet_id && p.customer_id === c.id);
          if (!ap || !pet) throw new ValidationError({ pet_matches: 'Thú cưng ghép không khớp với tài khoản hoặc hồ sơ.' });
          d.t.pet_links.push({ id: newId(), account_pet_id: ap.id, pet_id: pet.id, link_id: linkId });
        }
        audit(d, env, a, 'account.link', 'web_account', acc.id, `${a.staff.display_name} liên kết tài khoản ${acc.username} với hồ sơ ${c.code}`, { reason: input.method_note, sensitive: true });
      });
    },
  };
}
