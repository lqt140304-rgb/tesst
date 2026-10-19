import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { ForbiddenError } from '../../../contracts/errors';

describe('staff appointments', () => {
  it('lists today with names and no check-in statuses', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    const today = await api.staff.appointments.listRange('2026-10-19', '2026-10-19');
    expect(today).toHaveLength(7);
    expect(today.map((a) => a.start_at)).toEqual([...today.map((a) => a.start_at)].sort());
    expect(today[0]).toMatchObject({ petName: 'Bin', assigneeName: 'BS. Phạm Thanh Mai', past: true });
    expect(new Set(today.map((a) => a.status))).toEqual(new Set(['scheduled']));
  });

  it('filters by assignee across a week', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    const week = await api.staff.appointments.listRange('2026-10-19', '2026-10-25', { assignee_id: 'stf-ngocanh' });
    expect(week.length).toBeGreaterThan(5);
    expect(week.every((a) => a.assigneeId === 'stf-ngocanh')).toBe(true);
  });

  it('creates, reschedules and cancels', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const id = await api.staff.appointments.create({ customer_id: 'cus-05', pet_id: 'pet-lu', service: 'kham', start_at: '2026-10-26T09:00:00+07:00', duration_min: 30, source: 'phone' });
    let a = db.read().t.appointments.find((x) => x.id === id)!;
    expect(a.code).toBe('LH-0041');
    await api.staff.appointments.reschedule(id, a.version, { start_at: '2026-10-27T10:00:00+07:00', reason: 'Khách xin đổi' });
    a = db.read().t.appointments.find((x) => x.id === id)!;
    expect(a).toMatchObject({ start_at: '2026-10-27T10:00:00+07:00', rescheduled_from: '2026-10-26T09:00:00+07:00' });
    await api.staff.appointments.cancel(id, a.version, { reason: 'Khách báo bận' });
    expect(db.read().t.appointments.find((x) => x.id === id)!.status).toBe('cancelled');
  });

  it('cancelling an appointment from a confirmed request cancels the request', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const a = db.read().t.appointments.find((x) => x.id === 'apt-YC-0231')!;
    await api.staff.appointments.cancel(a.id, a.version, { reason: 'Khách báo bận' });
    expect(db.read().t.booking_requests.find((r) => r.code === 'YC-0231')!.status).toBe('cancelled');
  });

  it('rejects a pet that does not belong to the customer', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    await expect(api.staff.appointments.create({ customer_id: 'cus-05', pet_id: 'pet-miu', service: 'kham', start_at: '2026-10-26T09:00:00+07:00', duration_min: 30, source: 'phone' })).rejects.toThrow('Bé không thuộc hồ sơ khách hàng này.');
  });

  it('spa can view but not manage', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    await expect(api.staff.appointments.listRange('2026-10-19', '2026-10-19')).resolves.toBeTruthy();
    await expect(api.staff.appointments.create({ customer_id: 'cus-05', pet_id: 'pet-lu', service: 'kham', start_at: '2026-10-26T09:00:00+07:00', duration_min: 30, source: 'phone' })).rejects.toThrow(ForbiddenError);
  });
});
