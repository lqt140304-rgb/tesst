import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../contracts/errors';

/** Redesign part 3 §4 — data for the customer zone. */
describe('customer zone data (part 3)', () => {
  it('(1) hospital pets carry their weight; web pets have none', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'thuy_pham');
    expect((await api.customer.pets.list()).find((p) => p.name === 'Kem')!.weightKg).toBe(12);
    await loginAs(api, 'minh_khoa');
    expect((await api.customer.pets.list()).find((p) => p.name === 'Gạo')!.weightKg).toBeUndefined();
  });

  it('(2) the pet page shows the latest shared diary line per category, without "Lời nhắn"', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'lan_nguyen');
    const miu = await api.customer.pets.get('pet-miu');
    expect(miu.condition).toEqual([
      { category: 'an_uong', text: 'Miu đã ăn được nửa phần pate buổi trưa và tự uống nước. Bé tỉnh táo hơn, rất thích được vuốt nhẹ ở đầu.', dateLabel: '18/10' },
      { category: 'nghi_ngoi', text: 'Miu ngủ ngon, dậy vươn vai rồi đi dạo quanh chuồng. Lê Sơn sẽ cập nhật tiếp cho bạn vào buổi sau.', dateLabel: '19/10' },
      { category: 'tinh_than', text: 'Miu đã ở phòng nội trú, được giữ ấm và nằm nghỉ. Bé còn hơi mệt nên Lê Sơn sẽ để ý bé sát hơn trong đêm nay.', dateLabel: '17/10' },
    ]);
    expect((await api.customer.pets.get('pet-bong')).condition).toEqual([]);
    await loginAs(api, 'hoang_long');
    const mochi = await api.customer.pets.get('pet-mochi');
    expect(mochi.condition.map((c) => c.category)).toEqual(['an_uong', 'nghi_ngoi', 'tinh_than', 'van_dong']);
    await loginAs(api, 'minh_khoa');
    expect((await api.customer.pets.get('apet-gao')).condition).toEqual([]);
  });

  it('(5) diary entries and videos carry their Vietnam date', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'lan_nguyen');
    const { diary, videos } = await api.customer.stays.get('stay-NT-0041');
    expect(diary.map((e) => e.date)).toEqual(['2026-10-19', '2026-10-18', '2026-10-17']);
    expect(videos.find((v) => v.caption === 'Miu ăn sáng ngon lành')!.date).toBe('2026-10-18');
    expect((await api.customer.videos.list()).every((v) => /^\d{4}-\d{2}-\d{2}$/.test(v.date))).toBe(true);
  });
});

describe('reschedule requests (part 3 §4 item 3)', () => {
  const setup = async () => {
    const t = makeTestApi();
    await loginAs(t.api, 'lan_nguyen');
    const rows = await t.api.customer.appointments.list();
    const bong = rows.upcoming.find((r) => r.petName === 'Bông')!;
    const past = rows.past.find((r) => r.kind === 'request' && r.appointmentAt)!;
    return { ...t, bong, past };
  };
  const fields = async (p: Promise<unknown>) => ((await p.catch((e) => e)) as ValidationError).fields;

  it('a customer asks to move an upcoming appointment; the row shows it is waiting', async () => {
    const { api, bong } = await setup();
    await api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-25', preferred_slot: '14-16', reason: ' Bận đi công tác ' });
    const row = (await api.customer.appointments.list()).upcoming.find((r) => r.id === bong.id)!;
    expect(row.rescheduleRequest).toEqual({ desiredDate: '2026-10-25', preferredSlot: '14-16', createdAt: '2026-10-19T09:00:00+07:00' });
    expect((await fields(api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-26' }))).appointment).toBe('Bạn đã gửi yêu cầu đổi lịch này. Lê Sơn sẽ gọi cho bạn sớm.');
  });

  it('refuses bad input, past appointments and other people’s appointments', async () => {
    const { api, db, bong, past } = await setup();
    const before = db.read().t.reschedule_requests.length;
    expect((await fields(api.customer.appointments.requestReschedule(bong.id, { desired_date: '' }))).desired_date).toBe('Bạn chọn giúp ngày mong muốn nhé.');
    expect((await fields(api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-19' }))).desired_date).toBe('Bạn chọn từ ngày mai trở đi nhé.');
    expect((await fields(api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-25', preferred_slot: '12-14' as never }))).preferred_slot).toBe('Khung giờ này chưa đúng. Bạn chọn lại giúp nhé.');
    expect((await fields(api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-25', reason: 'x'.repeat(201) }))).reason).toBe('Lý do tối đa 200 ký tự.');
    expect((await fields(api.customer.appointments.requestReschedule(past.id, { desired_date: '2026-10-25' }))).appointment).toBe('Lịch hẹn này không đổi được nữa. Bạn gọi Lê Sơn để được hỗ trợ nhé.');
    await expect(api.customer.appointments.requestReschedule('req-YC-0230', { desired_date: '2026-10-25' })).rejects.toThrow(NotFoundError);
    expect(db.read().t.reschedule_requests).toHaveLength(before);
  });

  it('staff see the request; moving the appointment closes it', async () => {
    const { api, db, bong } = await setup();
    await api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-25', preferred_slot: '14-16', reason: 'Bận đi công tác' });
    await loginAs(api, 'quanly_ha');
    const [r] = await api.staff.requests.reschedules();
    expect(r).toMatchObject({ petName: 'Bông', species: 'dog', customerName: 'Nguyễn Thị Lan', phone: '+84900000001', desiredDate: '2026-10-25', preferredSlot: '14-16', reason: 'Bận đi công tác', currentStart: '2026-10-21T15:00:00+07:00' });
    expect(r!.appointmentCode).toMatch(/^LH-\d{4}$/);
    const apt = (await api.staff.appointments.listRange('2026-10-21', '2026-10-21')).find((a) => a.id === r!.appointmentId)!;
    expect(apt.rescheduleRequest).toEqual({ id: r!.id, desiredDate: '2026-10-25', preferredSlot: '14-16', reason: 'Bận đi công tác' });
    await api.staff.appointments.reschedule(apt.id, apt.version, { start_at: '2026-10-25T14:30:00+07:00' });
    expect(await api.staff.requests.reschedules()).toEqual([]);
    expect(db.read().t.reschedule_requests[0]).toMatchObject({ status: 'done', closed_by: 'stf-ha' });
    await loginAs(api, 'lan_nguyen');
    const row = (await api.customer.appointments.list()).upcoming.find((x) => x.id === bong.id)!;
    expect(row.rescheduleRequest).toBeUndefined();
    expect(row.appointmentAt).toBe('2026-10-25T14:30:00+07:00');
  });

  it('staff can close it as "Không đổi"; spa staff cannot see the list', async () => {
    const { api, db, bong } = await setup();
    await api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-25' });
    await loginAs(api, 'bacsi_duc');
    const [r] = await api.staff.requests.reschedules();
    await api.staff.requests.keepAppointment(r!.id, { note: 'Khách đồng ý giữ lịch cũ' });
    expect(db.read().t.reschedule_requests[0]).toMatchObject({ status: 'kept', closed_by: 'stf-duc', note: 'Khách đồng ý giữ lịch cũ' });
    expect(db.read().t.audit_events.at(-1)!.action).toBe('reschedule.kept');
    await loginAs(api, 'spa_ngocanh');
    await expect(api.staff.requests.reschedules()).rejects.toThrow(ForbiddenError);
  });

  it('cancelling the appointment closes the wish too', async () => {
    const { api, db, bong } = await setup();
    await api.customer.appointments.requestReschedule(bong.id, { desired_date: '2026-10-25' });
    await loginAs(api, 'quanly_ha');
    const apt = db.read().t.appointments.find((a) => a.id === db.read().t.reschedule_requests[0]!.appointment_id)!;
    await api.staff.appointments.cancel(apt.id, apt.version, { reason: 'Khách báo không đến' });
    expect(db.read().t.reschedule_requests[0]!.status).toBe('cancelled');
    expect(await api.staff.requests.reschedules()).toEqual([]);
  });
});
