import type { BookingInput, InquiryInput, PublicApi, PublicFeaturedCase, PublicFeaturedProduct } from '../../contracts/public';
import { FEATURED_CATEGORIES } from '../../contracts/enums';
import { ForbiddenError, ValidationError } from '../../contracts/errors';
import type { RequestSnapshot } from '../../contracts/enums';
import { BOOKING_MSG, validateBooking } from '../../rules/booking';
import { FEATURED_SPECIES } from '../../rules/content';
import { INQUIRY_DAILY_MAX, INQUIRY_MSG, inquiryKey, validateInquiry } from '../../rules/inquiry';
import { normalizeVnPhone } from '../../../lib/phone';
import { todayVN, toIsoVN } from '../../../lib/dates';
import { dedupeKey, type RequestScope } from '../../rules/dedupe';
import { holdsDedupeLock } from '../../rules/request-status';
import { appendAudit } from '../audit';
import type { Env } from '../env';
import { currentActor } from '../guard';
import { newId, nextCode } from '../ids';
import { readSettings } from '../settings';
import { sleepRead, sleepWrite } from '../latency';
import type { Doc } from '../store/schema';

export { BOOKING_MSG };

/** Full-snapshot dedupe + the locked "Khách vừa gửi lại — cần gọi lại" rule. Returns whether a new request was created. */
export function submitSnapshot(d: Doc, now: Date, scope: RequestScope, snapshot: RequestSnapshot, actor: { type: 'customer' | 'guest'; id?: string }): void {
  const key = dedupeKey(scope, snapshot);
  const at = toIsoVN(now);
  const existing = d.t.booking_requests.find((r) => r.dedupe_key === key && holdsDedupeLock(r.status));
  if (existing) {
    if (existing.status === 'unreachable') {
      if (!existing.resubmit_flag_at) {
        existing.resubmit_flag_at = at;
        existing.version += 1;
        appendAudit(d, now, { actor_type: actor.type, actor_id: actor.id, actor_name_snapshot: 'Khách', action: 'request.resubmit_flag', entity_type: 'booking_request', entity_id: existing.id, summary_vi: `Khách vừa gửi lại yêu cầu ${existing.code} — cần gọi lại`, sensitive: true });
      }
      existing.updated_at = at;
      d.t.request_events.push({ id: newId(), request_id: existing.id, type: 'resubmit', actor_type: actor.type, actor_id: actor.id, at });
    }
    return;
  }
  const id = newId();
  d.t.booking_requests.push({
    id, code: nextCode(d, 'YC'), scope: scope.kind, account_id: scope.kind === 'account' ? scope.accountId : undefined, snapshot,
    dedupe_key: key, status: 'pending', version: 1, created_at: at, updated_at: at,
  });
  d.t.request_events.push({ id: newId(), request_id: id, type: 'created', to_status: 'pending', actor_type: actor.type, actor_id: actor.id, at });
}

const text = (v: unknown) => (typeof v === 'string' ? v : '');
const optText = (v: unknown) => (typeof v === 'string' && v ? v : undefined);

/** Shown rows only, newest first (a tie goes to the row added last). A stored row is not trusted: an odd kind or species reads as the plain default. */
function shown<T extends { visible: boolean; created_at: string }>(rows: readonly T[]): T[] {
  return rows.map((r, i) => ({ r, i })).filter(({ r }) => r.visible === true)
    .sort((x, y) => text(y.r.created_at).localeCompare(text(x.r.created_at)) || y.i - x.i).map(({ r }) => r);
}

export function publicApi(env: Env): PublicApi {
  const { db } = env;
  return {
    inquiries: {
      async submit(raw: InquiryInput) {
        await sleepWrite();
        const actor = currentActor(db, env.session.get());
        if (actor.type === 'staff') throw new ForbiddenError('Bạn đang đăng nhập bằng tài khoản nhân viên. Lời nhắn này dành cho khách.');
        // Each known key is read once, so what is checked is exactly what is stored.
        const obj = typeof raw === 'object' && raw !== null && !Array.isArray(raw);
        const own = (k: string) => (obj && Object.hasOwn(raw, k) ? (raw as Record<string, unknown>)[k] : undefined);
        const input = obj ? { ...Object.fromEntries(Object.keys(raw).map((k) => [k, undefined])), name: own('name'), phone: own('phone'), text: own('text'), about: own('about') } : raw;
        const errors = validateInquiry(input);
        if (Object.keys(errors).length) throw new ValidationError(errors);
        const v = input as { name: string; phone: string; text: string; about?: string };
        const phone = normalizeVnPhone(v.phone)!;
        const now = env.clock();
        db.transact('inquiry.submit', (d) => {
          const key = inquiryKey(v.text);
          // The same message from the same number while the first still waits: nothing new, and the visitor is told ok.
          if (d.t.inquiries.some((q) => q.phone_e164 === phone && q.status === 'new' && typeof q.text === 'string' && inquiryKey(q.text) === key)) return;
          const today = todayVN(now);
          if (d.t.inquiries.filter((q) => q.phone_e164 === phone && typeof q.created_at === 'string' && !Number.isNaN(Date.parse(q.created_at)) && todayVN(new Date(q.created_at)) === today).length >= INQUIRY_DAILY_MAX) throw new ValidationError({ text: INQUIRY_MSG.daily });
          const id = newId();
          const code = nextCode(d, 'LN');
          d.t.inquiries.push({
            id, code, name: v.name.trim(), phone_e164: phone, text: v.text.trim(), ...(v.about?.trim() ? { about: v.about.trim() } : {}), status: 'new', created_at: toIsoVN(now),
            ...(actor.type === 'customer' ? { created_by_account: actor.account.id } : {}), version: 1,
          });
          appendAudit(d, now, { actor_type: actor.type === 'customer' ? 'customer' : 'guest', actor_id: actor.type === 'customer' ? actor.account.id : undefined, actor_name_snapshot: 'Khách', action: 'inquiry.submit', entity_type: 'inquiry', entity_id: id, summary_vi: `Khách để lại lời nhắn ${code}`, sensitive: false });
        });
        return { ok: true as const };
      },
    },
    featured: {
      async products() {
        await sleepRead();
        return shown(db.read().t.featured_products).map((p): PublicFeaturedProduct => ({
          id: p.id, name: text(p.name), category: FEATURED_CATEGORIES.includes(p.category) ? p.category : 'food', note: optText(p.note), imageKey: optText(p.image_key), sample: p.sample === true,
        }));
      },
      async cases() {
        await sleepRead();
        return shown(db.read().t.featured_cases).map((c): PublicFeaturedCase => ({
          id: c.id, title: text(c.title), story: text(c.story), petName: text(c.pet_name), species: FEATURED_SPECIES.includes(c.species) ? c.species : 'other', imageKey: optText(c.image_key), sample: c.sample === true,
        }));
      },
    },

    bookings: {
      async holidays() {
        await sleepRead();
        const today = todayVN(env.clock());
        return readSettings(db.read().t).values.holidays.map((d) => d.date).filter((date) => date >= today);
      },

      async submit(input: BookingInput) {
        await sleepWrite();
        const actor = currentActor(db, env.session.get());
        if (actor.type === 'staff') throw new ForbiddenError('Bạn đang đăng nhập bằng tài khoản nhân viên. Hãy dùng "Tạo lịch hẹn" trong khu nhân viên.');
        const now = env.clock();
        const { t } = db.read();
        let contactName = input.contact_name.trim();
        let phone = normalizeVnPhone(input.phone);
        if (actor.type === 'customer') {
          contactName = actor.account.display_name;
          phone = actor.account.phone_e164;
        }
        let petName = input.pet_name.trim();
        let species = input.species;
        let breed = input.breed?.trim() || undefined;
        if (actor.type === 'customer' && input.pet_id) {
          const pet = actor.customerId ? t.pets.find((p) => p.id === input.pet_id && p.customer_id === actor.customerId) : undefined;
          if (!pet) throw new ValidationError({ pet_name: BOOKING_MSG.pet });
          petName = pet.name; species = pet.species; breed = pet.breed;
        } else if (actor.type === 'customer' && input.account_pet_id) {
          const pet = t.account_pets.find((p) => p.id === input.account_pet_id && p.account_id === actor.account.id);
          if (!pet) throw new ValidationError({ pet_name: BOOKING_MSG.pet });
          petName = pet.name; species = pet.species; breed = pet.breed;
        } else if (input.pet_id || input.account_pet_id) {
          throw new ValidationError({ pet_name: BOOKING_MSG.pet });
        }
        const fields = validateBooking({ ...input, pet_name: petName, species }, { today: todayVN(now), guest: actor.type !== 'customer', holidays: readSettings(t).values.holidays.map((d) => d.date) });
        if (Object.keys(fields).length) throw new ValidationError(fields as Record<string, string>);

        db.transact('public.bookings.submit', (d) => {
          let accountPetId = input.account_pet_id;
          if (actor.type === 'customer' && !input.pet_id && !input.account_pet_id && input.save_pet) {
            // A pet with the same name and species is the same pet: reuse it, so a resubmit stays a duplicate (dedupe key).
            const key = (x: string) => x.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
            const same = d.t.account_pets.find((p) => p.account_id === actor.account.id && p.species === species && key(p.name) === key(petName));
            accountPetId = same?.id ?? newId();
            if (!same) d.t.account_pets.push({ id: accountPetId, account_id: actor.account.id, name: petName.trim(), species, breed, created_at: toIsoVN(now) });
          }
          const snapshot: RequestSnapshot = {
            contact_name: contactName, phone_e164: phone!, pet_name: petName, species, breed, service: input.service,
            desired_date: input.desired_date, preferred_slot: input.preferred_slot || undefined, note: input.note?.trim() || undefined, pet_id: input.pet_id, account_pet_id: accountPetId,
          };
          const scope: RequestScope = actor.type === 'customer' ? { kind: 'account', accountId: actor.account.id } : { kind: 'guest' };
          submitSnapshot(d, now, scope, snapshot, actor.type === 'customer' ? { type: 'customer', id: actor.account.id } : { type: 'guest' });
        });
        return { ok: true as const };
      },
    },
  };
}
