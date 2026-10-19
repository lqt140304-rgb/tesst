import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { NotFoundError, NotLinkedError, ForbiddenError } from '../../../contracts/errors';
import { TREATMENT_LINE_LABEL } from '../../../contracts/enums';

describe('customer scope', () => {
  it('a guest cannot call customer functions', async () => {
    const { api } = makeTestApi();
    await expect(api.customer.overview()).rejects.toThrow(ForbiddenError);
  });

  it('an unlinked account gets NotLinkedError on stays, videos and invoices', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'minh_khoa');
    await expect(api.customer.stays.list()).rejects.toThrow(NotLinkedError);
    await expect(api.customer.videos.list()).rejects.toThrow(NotLinkedError);
    await expect(api.customer.invoices.list()).rejects.toThrow(NotLinkedError);
    const o = await api.customer.overview();
    expect(o).toMatchObject({ linked: false, linkCode: 'LS-7K2Q' });
    expect(o.pets.map((p) => p.name)).toEqual(['Gạo']);
  });

  it("another customer's stay or invoice is not found", async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'lan_nguyen');
    await expect(api.customer.stays.get('stay-NT-0044')).rejects.toThrow(NotFoundError);
    await expect(api.customer.invoices.get('inv-1')).rejects.toThrow(NotFoundError);
    await expect(api.customer.appointments.getRequest('req-YC-0244')).rejects.toThrow(NotFoundError);
  });

  it('after staff links minh_khoa, Gạo diary and video become visible', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    await api.staff.accounts.link('acc-minh_khoa', { customer_id: 'cus-06', pet_matches: [{ account_pet_id: 'apet-gao', pet_id: 'pet-gao' }], method: 'in_person_app', confirmed: true });
    await loginAs(api, 'minh_khoa');
    const stays = await api.customer.stays.list();
    expect(stays.current.map((s) => s.petName)).toEqual(['Gạo']);
    const detail = await api.customer.stays.get(stays.current[0]!.id);
    expect(detail.diary).toHaveLength(1);
    expect(detail.videos.map((v) => v.caption)).toEqual(['Gạo nằm nghỉ cạnh cửa sổ']);
    const o = await api.customer.overview();
    expect(o.pets.map((p) => p.name)).toEqual(['Gạo']);
  });

  it('diary entries expose part of day, never clock times or drafts', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'hoang_long');
    const s = (await api.customer.stays.list()).current[0]!;
    const d = await api.customer.stays.get(s.id);
    expect(d.diary).toHaveLength(4);
    expect(JSON.stringify(d.diary)).not.toMatch(/\d{2}:\d{2}/);
    expect(d.diary.every((e) => ['sang', 'chieu', 'toi'].includes(e.part_of_day))).toBe(true);
  });

  it('expired, deleted and draft videos are never returned', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'lan_nguyen');
    const videos = await api.customer.videos.list();
    expect(videos.map((v) => v.caption).sort()).toEqual(['Miu nằm sưởi nắng bên cửa sổ', 'Miu ăn sáng ngon lành']);
    await loginAs(api, 'ngoc_tran');
    const bo = await api.customer.videos.list();
    expect(bo).toHaveLength(1);
    expect(bo[0]).toMatchObject({ daysLeft: 3, tone: 'rose' });
  });

  it('invoice lines group treatment items into one line', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'ngoc_tran');
    const list = await api.customer.invoices.list();
    const partial = list.find((i) => i.state === 'partial')!;
    const inv = await api.customer.invoices.get(partial.id);
    const labels = inv.lines.map((l) => l.label);
    expect(labels).toContain(TREATMENT_LINE_LABEL);
    expect(labels).not.toContain('Truyền dịch');
    expect(inv).toMatchObject({ total: 3450000, paid: 2000000, remaining: 1450000, state: 'partial' });
    expect(inv.payments).toEqual([{ dateLabel: expect.any(String), methodLabel: 'Chuyển khoản' }]);
  });

  it('only issued invoices are listed, never drafts', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'lan_nguyen');
    const list = await api.customer.invoices.list();
    expect(list.length).toBe(2);
    expect(list.map((i) => i.state).sort()).toEqual(['paid', 'unpaid']);
    const o = await api.customer.overview();
    expect(o.unpaid).toEqual({ count: 1, remaining: 230000 });
  });

  it('appointments: upcoming, processing and past groups with a phone-booked row', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'ngoc_tran');
    const a = await api.customer.appointments.list();
    const phone = a.upcoming.find((r) => r.viaPhone);
    expect(phone).toMatchObject({ status: 'confirmed', petName: 'Bơ' });
    expect(a.processing.map((r) => r.code)).toEqual(['YC-0238']);
    expect(JSON.stringify(a)).not.toContain('BS.');
  });

  it('"Nhờ Lê Sơn gọi lại" sets the staff flag once and shows the reminder time', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'minh_khoa');
    const before = (await api.customer.appointments.list()).processing[0]!;
    expect(before.canCallBack).toBe(true);
    await api.customer.appointments.callMeBack(before.id);
    const after = (await api.customer.appointments.list()).processing[0]!;
    expect(after.canCallBack).toBe(false);
    expect(after.reminderSentAt).toBe('2026-10-19T09:00:00+07:00');
    expect(db.read().t.booking_requests.find((r) => r.code === 'YC-0245')!.resubmit_flag_at).toBeTruthy();
    await loginAs(api, 'lan_nguyen');
    await expect(api.customer.appointments.callMeBack(before.id)).rejects.toThrow(NotFoundError);
  });

  it('request detail has a customer timeline without staff names or reasons', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'lan_nguyen');
    const d = await api.customer.appointments.getRequest('req-YC-0228');
    expect(d.timeline[0]!.label).toBe('Bạn gửi yêu cầu');
    expect(d.timeline.map((e) => e.label)).toContain('Đã xác nhận');
    expect(JSON.stringify(d)).not.toMatch(/Hà|BS\.|Hẹn 9 giờ/);
  });

  it('customer adds a web pet and edits the account', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'minh_khoa');
    await api.customer.pets.create({ name: 'Mây', species: 'cat' });
    expect((await api.customer.pets.list()).map((p) => p.name).sort()).toEqual(['Gạo', 'Mây']);
    await api.customer.account.update({ display_name: 'Đỗ Minh Khoa', salutation: 'anh' });
    expect((await api.customer.account.get()).salutation).toBe('anh');
  });
});
