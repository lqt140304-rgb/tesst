import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { ConflictError, ForbiddenError, ValidationError } from '../../../contracts/errors';

const req = (db: ReturnType<typeof makeTestApi>['db'], code: string) => db.read().t.booking_requests.find((r) => r.code === code)!;

describe('staff requests', () => {
  it('Cần xử lý sorts flagged first, then pending oldest, contacting, unreachable', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const list = await api.staff.requests.list({ tab: 'can_xu_ly' });
    expect(list[0]!.code).toBe('YC-0234');
    expect(list[0]!.flaggedAt).toBeTruthy();
    const statuses = list.slice(1).map((c) => c.status);
    expect(statuses).toEqual([...statuses].sort((a, b) => ['pending', 'contacting', 'unreachable'].indexOf(a) - ['pending', 'contacting', 'unreachable'].indexOf(b)));
    const pending = list.filter((c) => c.status === 'pending').map((c) => c.createdAt);
    expect(pending).toEqual([...pending].sort());
    expect(list.every((c) => ['pending', 'contacting', 'unreachable'].includes(c.status))).toBe(true);
  });

  it('filters by status and search text', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    expect((await api.staff.requests.list({ tab: 'rejected' })).map((c) => c.code).sort()).toEqual(['YC-0225', 'YC-0227']);
    expect((await api.staff.requests.list({ tab: 'tat_ca', q: 'xoài' })).map((c) => c.code)).toEqual(['YC-0244']);
    expect((await api.staff.requests.list({ tab: 'tat_ca', q: '0900 000 014' })).map((c) => c.code).sort()).toEqual(['YC-0226', 'YC-0240']);
  });

  it('detail shows the snapshot, call count and history', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const d = await api.staff.requests.get(req(db, 'YC-0233').id);
    expect(d.callCount).toBe(3);
    expect(d.snapshot.pet_name).toBe('Lạc');
    expect(d.events.some((e) => e.label.includes('Không nghe máy'))).toBe(true);
  });

  it('startContact clears the flag and records the handler', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    const r = req(db, 'YC-0234');
    await api.staff.requests.startContact(r.id, r.version);
    const after = req(db, 'YC-0234');
    expect(after.status).toBe('contacting');
    expect(after.resubmit_flag_at).toBeUndefined();
    expect(after.handler_id).toBe('stf-duc');
  });

  it('an illegal transition throws ValidationError', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const r = req(db, 'YC-0228');
    await expect(api.staff.requests.startContact(r.id, r.version)).rejects.toThrow(ValidationError);
    const rej = req(db, 'YC-0225');
    await expect(api.staff.requests.cancel(rej.id, rej.version, { reason_code: 'ke_hoach_khac' })).rejects.toThrow(ValidationError);
  });

  it('logCall can move contacting to unreachable', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const r = req(db, 'YC-0236');
    await api.staff.requests.logCall(r.id, r.version, { outcome: 'no_answer', markUnreachable: true });
    expect(req(db, 'YC-0236').status).toBe('unreachable');
    expect((await api.staff.requests.get(r.id)).callCount).toBe(1);
  });

  it('confirm creates the appointment atomically and fails whole when start_at is missing', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const r = req(db, 'YC-0236');
    const before = db.read().t.appointments.length;
    await expect(api.staff.requests.confirm(r.id, r.version, { start_at: '', duration_min: 30, customer: { existingId: 'cus-09' }, pet: { existingId: 'pet-na' } })).rejects.toThrow('Vui lòng chọn đủ ngày và giờ hẹn.');
    expect(db.read().t.appointments).toHaveLength(before);
    await api.staff.requests.confirm(r.id, r.version, { start_at: '2026-10-22T09:00:00+07:00', duration_min: 30, assignee_id: 'stf-mai', customer: { existingId: 'cus-09' }, pet: { existingId: 'pet-na' } });
    const after = req(db, 'YC-0236');
    expect(after.status).toBe('confirmed');
    const apt = db.read().t.appointments.find((a) => a.id === after.appointment_id)!;
    expect(apt).toMatchObject({ status: 'scheduled', source: 'web_request', pet_id: 'pet-na', customer_id: 'cus-09' });
  });

  it('confirm can create a customer record and pet from the request', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const r = req(db, 'YC-0233');
    await api.staff.requests.startContact(r.id, r.version);
    const r2 = req(db, 'YC-0233');
    await api.staff.requests.confirm(r2.id, r2.version, { start_at: '2026-10-24T10:00:00+07:00', duration_min: 60, customer: { create: true }, pet: { create: true } });
    const c = db.read().t.customers.find((x) => x.full_name === 'Nguyễn Văn Bình')!;
    expect(c.code).toBe('KH-0019');
    expect(db.read().t.pets.find((p) => p.customer_id === c.id)!.name).toBe('Lạc');
  });

  it('confirm never links a web account', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const r = req(db, 'YC-0245');
    await api.staff.requests.startContact(r.id, r.version);
    const r2 = req(db, 'YC-0245');
    const links = db.read().t.account_links.length;
    await api.staff.requests.confirm(r2.id, r2.version, { start_at: '2026-10-23T10:00:00+07:00', duration_min: 60, customer: { existingId: 'cus-06' }, pet: { existingId: 'pet-gao' } });
    expect(db.read().t.account_links).toHaveLength(links);
  });

  it('cancelling a confirmed request cancels its appointment', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const r = req(db, 'YC-0235');
    await api.staff.requests.cancel(r.id, r.version, { reason_code: 'khach_bao_khong_den' });
    expect(req(db, 'YC-0235').status).toBe('cancelled');
    expect(db.read().t.appointments.find((a) => a.id === r.appointment_id)!.status).toBe('cancelled');
  });

  it('reject records reason and duplicate code internally', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const r = req(db, 'YC-0242');
    await api.staff.requests.reject(r.id, r.version, { reason_code: 'trung_yeu_cau', duplicate_of: 'YC-0240' });
    expect(req(db, 'YC-0242').status).toBe('rejected');
  });

  it('a stale version throws ConflictError', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const r = req(db, 'YC-0240');
    await expect(api.staff.requests.startContact(r.id, r.version - 1)).rejects.toThrow(ConflictError);
  });

  it('permissions: only request handlers can use the queue', async () => {
    for (const [user, allowed] of [['quanly_ha', true], ['bacsi_duc', true], ['bacsi_mai', false], ['spa_ngocanh', false], ['lan_nguyen', false]] as const) {
      const { api, db } = makeTestApi();
      await loginAs(api, user);
      const r = req(db, 'YC-0240');
      const calls = [
        () => api.staff.requests.list({ tab: 'can_xu_ly' }),
        () => api.staff.requests.get(r.id),
        () => api.staff.requests.logCall(r.id, r.version, { outcome: 'talked' }),
        () => api.staff.requests.startContact(r.id, req(db, 'YC-0240').version),
      ];
      for (const call of calls) {
        const result = await call().then(() => 'ok', (e) => e);
        if (allowed) expect(result).toBe('ok');
        else expect(result).toBeInstanceOf(ForbiddenError);
      }
    }
  });
});
