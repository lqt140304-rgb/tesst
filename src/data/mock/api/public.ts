import type { BookingInput, PublicApi } from '../../contracts/public';
import { ForbiddenError, ValidationError } from '../../contracts/errors';
import { SERVICES, type RequestSnapshot } from '../../contracts/enums';
import { normalizeVnPhone } from '../../../lib/phone';
import { todayVN, toIsoVN } from '../../../lib/dates';
import { dedupeKey, type RequestScope } from '../../rules/dedupe';
import { holdsDedupeLock } from '../../rules/request-status';
import { appendAudit } from '../audit';
import type { Env } from '../env';
import { currentActor } from '../guard';
import { newId, nextCode } from '../ids';
import { sleepWrite } from '../latency';
import type { Doc } from '../store/schema';

export const BOOKING_MSG = {
  name: 'Bạn cho Lê Sơn biết tên của bạn nhé.',
  phoneEmpty: 'Bạn nhập số điện thoại để nhân viên gọi xác nhận.',
  phone: 'Số điện thoại chưa đúng. Bạn kiểm tra lại giúp nhé (ví dụ: 0912 345 678).',
  petName: 'Bạn nhập tên bé nhé.',
  species: 'Bạn chọn giúp bé là mèo, chó hay loài khác nhé.',
  service: 'Bạn chọn giúp dịch vụ bé cần nhé.',
  date: 'Bạn chọn giúp ngày mong muốn nhé.',
  datePast: 'Ngày này đã qua. Bạn chọn từ hôm nay trở đi nhé.',
  note: 'Ghi chú tối đa 500 ký tự.',
  consent: 'Bạn cần đồng ý để Lê Sơn có thể liên hệ với bạn.',
  pet: 'Không tìm thấy bé này trong hồ sơ của bạn.',
} as const;

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

export function publicApi(env: Env): PublicApi {
  const { db } = env;
  return {
    bookings: {
      async submit(input: BookingInput) {
        await sleepWrite();
        const actor = currentActor(db, env.session.get());
        if (actor.type === 'staff') throw new ForbiddenError('Bạn đang đăng nhập bằng tài khoản nhân viên. Hãy dùng "Tạo lịch hẹn" trong khu nhân viên.');
        const now = env.clock();
        const { t } = db.read();
        const fields: Record<string, string> = {};
        let contactName = input.contact_name.trim();
        let phone = normalizeVnPhone(input.phone);
        if (actor.type === 'customer') {
          contactName = actor.account.display_name;
          phone = actor.account.phone_e164;
        } else {
          if (!contactName) fields.contact_name = BOOKING_MSG.name;
          if (!input.phone.trim()) fields.phone = BOOKING_MSG.phoneEmpty;
          else if (!phone) fields.phone = BOOKING_MSG.phone;
          if (!input.consent) fields.consent = BOOKING_MSG.consent;
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
        if (!petName) fields.pet_name = BOOKING_MSG.petName;
        if (!['dog', 'cat', 'other'].includes(species)) fields.species = BOOKING_MSG.species;
        if (!SERVICES.includes(input.service)) fields.service = BOOKING_MSG.service;
        if (!input.desired_date) fields.desired_date = BOOKING_MSG.date;
        else if (input.desired_date < todayVN(now)) fields.desired_date = BOOKING_MSG.datePast;
        if ((input.note ?? '').length > 500) fields.note = BOOKING_MSG.note;
        if (Object.keys(fields).length) throw new ValidationError(fields);

        db.transact('public.bookings.submit', (d) => {
          let accountPetId = input.account_pet_id;
          if (actor.type === 'customer' && !input.pet_id && !input.account_pet_id && input.save_pet) {
            accountPetId = newId();
            d.t.account_pets.push({ id: accountPetId, account_id: actor.account.id, name: petName, species, breed, created_at: toIsoVN(now) });
          }
          const snapshot: RequestSnapshot = {
            contact_name: contactName, phone_e164: phone!, pet_name: petName, species, breed, service: input.service,
            desired_date: input.desired_date, note: input.note?.trim() || undefined, pet_id: input.pet_id, account_pet_id: accountPetId,
          };
          const scope: RequestScope = actor.type === 'customer' ? { kind: 'account', accountId: actor.account.id } : { kind: 'guest' };
          submitSnapshot(d, now, scope, snapshot, actor.type === 'customer' ? { type: 'customer', id: actor.account.id } : { type: 'guest' });
        });
        return { ok: true as const };
      },
    },
  };
}
