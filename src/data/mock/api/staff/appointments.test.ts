import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { ForbiddenError, ValidationError } from '../../../contracts/errors';

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

  it('lists the people an appointment can be assigned to (doctors and spa, not the manager)', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    const list = await api.staff.appointments.assignees();
    expect(list).toEqual([
      { id: 'stf-duc', name: 'BS. Trần Minh Đức', title: 'Bác sĩ' },
      { id: 'stf-mai', name: 'BS. Phạm Thanh Mai', title: 'Bác sĩ' },
      { id: 'stf-ngocanh', name: 'Lê Ngọc Anh', title: 'Nhân viên Spa' },
    ]);
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

describe('one person, one appointment at a time', () => {
  // Seed: BS. Đức has Mập 09:00–09:30 on 19/10.
  const base = { customer_id: 'cus-05', pet_id: 'pet-lu', service: 'kham' as const, duration_min: 30, source: 'phone' as const };
  const day = (hhmm: string) => `2026-10-19T${hhmm}:00+07:00`;

  it('blocks a create that overlaps and names the busy window and pet', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const before = db.read().t.appointments.length;
    const err = await api.staff.appointments.create({ ...base, start_at: day('09:15'), assignee_id: 'stf-duc' }).catch((e) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.fields).toEqual({ start_at: 'Người phụ trách đã có lịch 09:00–09:30 (bé Mập). Bạn chọn giờ khác hoặc người khác nhé.' });
    expect(db.read().t.appointments).toHaveLength(before);
  });

  it('allows back-to-back, another person, no assignee, and a cancelled slot', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    await api.staff.appointments.create({ ...base, start_at: day('09:30'), assignee_id: 'stf-duc' });
    await api.staff.appointments.create({ ...base, start_at: day('09:00'), assignee_id: 'stf-mai' });
    await api.staff.appointments.create({ ...base, start_at: day('09:00') });
    const map = db.read().t.appointments.find((a) => a.assignee_id === 'stf-duc' && a.start_at === day('09:00'))!;
    await api.staff.appointments.cancel(map.id, map.version, { reason: 'Khách báo bận' });
    await api.staff.appointments.create({ ...base, start_at: day('09:00'), assignee_id: 'stf-duc' });
  });

  it('the second of two simultaneous creates loses', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const input = { ...base, start_at: day('11:00'), assignee_id: 'stf-duc' };
    const results = await Promise.allSettled([api.staff.appointments.create(input), api.staff.appointments.create(input)]);
    expect(results.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
  });

  it('blocks moving onto a busy time, but lets an appointment shift within its own window', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const id = await api.staff.appointments.create({ ...base, start_at: day('11:00'), assignee_id: 'stf-duc' });
    let a = db.read().t.appointments.find((x) => x.id === id)!;
    await expect(api.staff.appointments.reschedule(id, a.version, { start_at: day('09:20') })).rejects.toThrow('Người phụ trách đã có lịch 09:00–09:30 (bé Mập).');
    expect(db.read().t.appointments.find((x) => x.id === id)!.start_at).toBe(day('11:00'));
    await api.staff.appointments.reschedule(id, a.version, { start_at: day('11:10') });
    a = db.read().t.appointments.find((x) => x.id === id)!;
    expect(a.start_at).toBe(day('11:10'));
  });

  it('uses the moved appointment\'s own length (spa 60 minutes reaches the next slot)', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    // Spa Ngọc Anh: Cốm 08:30–09:30 on 19/10; a 60-minute spa at 07:45 ends 08:45 and collides.
    await expect(api.staff.appointments.create({ ...base, service: 'spa', duration_min: 60, start_at: day('07:45'), assignee_id: 'stf-ngocanh' })).rejects.toThrow(ValidationError);
  });
});
