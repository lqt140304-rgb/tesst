import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../testing';
import { ForbiddenError, ValidationError } from '../../contracts/errors';
import type { BookingInput } from '../../contracts/public';

const input: BookingInput = {
  contact_name: 'Hoàng Minh', phone: '0987 654 321', pet_name: 'Bánh Bao', species: 'dog', breed: 'Poodle', service: 'spa', desired_date: '2026-10-22', note: 'Bé sợ máy sấy', consent: true,
};

describe('public booking submit', () => {
  it('creates a pending request with a snapshot and a created event', async () => {
    const { api, db } = makeTestApi();
    expect(await api.public.bookings.submit(input)).toEqual({ ok: true });
    const req = db.read().t.booking_requests.find((r) => r.snapshot.pet_name === 'Bánh Bao')!;
    expect(req).toMatchObject({ status: 'pending', scope: 'guest', code: 'YC-0246' });
    expect(req.snapshot.phone_e164).toBe('+84987654321');
    expect(db.read().t.request_events.filter((e) => e.request_id === req.id).map((e) => e.type)).toEqual(['created']);
  });

  it('identical resubmit while pending creates nothing', async () => {
    const { api, db } = makeTestApi();
    await api.public.bookings.submit(input);
    const n = db.read().t.booking_requests.length;
    expect(await api.public.bookings.submit({ ...input, contact_name: '  hoàng  minh ' })).toEqual({ ok: true });
    expect(db.read().t.booking_requests).toHaveLength(n);
  });

  it('identical resubmit while unreachable sets the flag once', async () => {
    const { api, db, setNow } = makeTestApi();
    const yc = db.read().t.booking_requests.find((r) => r.code === 'YC-0233')!;
    const s = yc.snapshot;
    const again: BookingInput = { contact_name: s.contact_name, phone: s.phone_e164, pet_name: s.pet_name, species: s.species, breed: s.breed, service: s.service, desired_date: s.desired_date, note: s.note, consent: true };
    await api.public.bookings.submit(again);
    const first = db.read().t.booking_requests.find((r) => r.code === 'YC-0233')!.resubmit_flag_at;
    expect(first).toBe('2026-10-19T09:00:00+07:00');
    setNow('2026-10-19T09:30:00+07:00');
    await api.public.bookings.submit(again);
    const after = db.read().t.booking_requests.find((r) => r.code === 'YC-0233')!;
    expect(after.resubmit_flag_at).toBe(first);
    expect(after.status).toBe('unreachable');
    expect(db.read().t.request_events.filter((e) => e.request_id === after.id && e.type === 'resubmit')).toHaveLength(2);
  });

  it('a different note creates a new request', async () => {
    const { api, db } = makeTestApi();
    await api.public.bookings.submit(input);
    await api.public.bookings.submit({ ...input, note: 'Khác' });
    expect(db.read().t.booking_requests.filter((r) => r.snapshot.pet_name === 'Bánh Bao')).toHaveLength(2);
  });

  it('identical after cancelled creates a new request (lock released)', async () => {
    const { api, db } = makeTestApi();
    const yc = db.read().t.booking_requests.find((r) => r.code === 'YC-0229')!;
    await loginAs(api, 'hoang_long');
    const s = yc.snapshot;
    await api.public.bookings.submit({ contact_name: s.contact_name, phone: s.phone_e164, pet_name: s.pet_name, species: s.species, breed: s.breed, service: s.service, desired_date: s.desired_date, note: s.note, consent: true });
    expect(db.read().t.booking_requests.filter((r) => r.dedupe_key === yc.dedupe_key)).toHaveLength(2);
  });

  it('a guest submit with a registered phone is not attached to that account', async () => {
    const { api, db } = makeTestApi();
    await api.public.bookings.submit({ ...input, phone: '0900 000 001' });
    const req = db.read().t.booking_requests.find((r) => r.snapshot.pet_name === 'Bánh Bao')!;
    expect(req.scope).toBe('guest');
    expect(req.account_id).toBeUndefined();
  });

  it('a logged-in customer submits in account scope', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'lan_nguyen');
    await api.public.bookings.submit({ ...input, contact_name: 'ignored', phone: '0999999999', consent: false, pet_id: 'pet-bong', pet_name: 'Bông' });
    const req = db.read().t.booking_requests.find((r) => r.code === 'YC-0246')!;
    expect(req).toMatchObject({ scope: 'account', account_id: 'acc-lan_nguyen' });
    expect(req.snapshot).toMatchObject({ pet_id: 'pet-bong', contact_name: 'Nguyễn Thị Lan', phone_e164: '+84900000001' });
  });

  it('a logged-in customer can save a new pet to the profile', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'minh_khoa');
    await api.public.bookings.submit({ ...input, pet_name: 'Mây', species: 'cat', breed: undefined, save_pet: true });
    const pet = db.read().t.account_pets.find((p) => p.name === 'Mây')!;
    expect(pet.account_id).toBe('acc-minh_khoa');
    expect(db.read().t.booking_requests.find((r) => r.snapshot.pet_name === 'Mây')!.snapshot.account_pet_id).toBe(pet.id);
  });

  it('a customer cannot book for another account pet', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'lan_nguyen');
    await expect(api.public.bookings.submit({ ...input, pet_id: 'pet-kem', pet_name: 'Kem' })).rejects.toThrow(ValidationError);
    await expect(api.public.bookings.submit({ ...input, account_pet_id: 'apet-gao', pet_name: 'Gạo' })).rejects.toThrow(ValidationError);
  });

  it('a staff session cannot submit', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    await expect(api.public.bookings.submit(input)).rejects.toThrow(ForbiddenError);
  });

  it('validation errors use the customer wording', async () => {
    const { api } = makeTestApi();
    const err = await api.public.bookings.submit({ ...input, service: '' as never, desired_date: '', contact_name: ' ', phone: '123', pet_name: '', consent: false }).catch((e) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.fields).toMatchObject({
      service: 'Bạn chọn giúp dịch vụ bé cần nhé.',
      desired_date: 'Bạn chọn giúp ngày mong muốn nhé.',
      contact_name: 'Bạn cho Lê Sơn biết tên của bạn nhé.',
      phone: 'Số điện thoại chưa đúng. Bạn kiểm tra lại giúp nhé (ví dụ: 0912 345 678).',
      pet_name: 'Bạn nhập tên bé nhé.',
      consent: 'Bạn cần đồng ý để Lê Sơn có thể liên hệ với bạn.',
    });
  });

  it('rejects a desired date in the past', async () => {
    const { api } = makeTestApi();
    const err = await api.public.bookings.submit({ ...input, desired_date: '2026-10-18' }).catch((e) => e);
    expect(err.fields.desired_date).toBe('Ngày này đã qua. Bạn chọn từ hôm nay trở đi nhé.');
  });
});
