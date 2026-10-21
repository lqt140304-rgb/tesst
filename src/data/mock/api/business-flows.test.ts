/** Data-layer half of docs/tham-khao/bang-kiem-thu-nghiep-vu-2026-10-21.md: cases the table marked "thiếu". */
import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../testing';
import { ForbiddenError, ValidationError } from '../../contracts/errors';
import type { BookingInput } from '../../contracts/public';

const booking: BookingInput = {
  contact_name: 'Hoàng Minh', phone: '0912345678', pet_name: 'Bông Lan', species: 'dog', service: 'kham', desired_date: '2026-10-22', consent: true,
};

describe('luồng 1 · đặt lịch: lỗi ghi rồi thử lại', () => {
  it('a refused submit writes nothing; the retry creates exactly one request, a second retry none', async () => {
    const { api, db } = makeTestApi();
    const before = db.read().t.booking_requests.length;
    await expect(api.public.bookings.submit({ ...booking, phone: '123' })).rejects.toThrow(ValidationError);
    expect(db.read().t.booking_requests).toHaveLength(before);
    await api.public.bookings.submit(booking);
    expect(db.read().t.booking_requests).toHaveLength(before + 1);
    await api.public.bookings.submit(booking);
    expect(db.read().t.booking_requests).toHaveLength(before + 1);
  });
});

describe('luồng 3 · đổi/hủy lịch: lịch đã hủy', () => {
  it('a cancelled appointment cannot be moved, and cancelling again changes nothing', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const id = await api.staff.appointments.create({ customer_id: 'cus-05', pet_id: 'pet-lu', service: 'kham', start_at: '2026-10-26T09:00:00+07:00', duration_min: 30, source: 'phone' });
    const get = () => db.read().t.appointments.find((x) => x.id === id)!;
    await api.staff.appointments.cancel(id, get().version, { reason: 'Khách báo bận' });
    const cancelled = { ...get() };
    const audits = db.read().t.audit_events.length;
    await expect(api.staff.appointments.reschedule(id, cancelled.version, { start_at: '2026-10-27T10:00:00+07:00' })).rejects.toThrow('Lịch hẹn đã hủy, không đổi giờ được.');
    await api.staff.appointments.cancel(id, cancelled.version, { reason: 'Hủy lần nữa' });
    expect(get()).toEqual(cancelled);
    expect(db.read().t.audit_events).toHaveLength(audits);
  });
});

describe('luồng 4 · hồ sơ thú cưng: đổi tên không mất lịch sử', () => {
  it('after a rename, bookings, appointments and invoices still belong to the same pet id', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const pet = db.read().t.pets.find((p) => p.id === 'pet-miu')!;
    const bookings = (await (async () => { await loginAs(api, 'lan_nguyen'); return (await api.customer.pets.get('pet-miu')).bookings.map((b) => b.code); })());
    await loginAs(api, 'quanly_ha');
    const apts = db.read().t.appointments.filter((a) => a.pet_id === 'pet-miu').map((a) => a.id);
    await api.staff.customers.updatePet('pet-miu', pet.version, { name: 'Miu Nhỏ', species: 'cat' });
    const week = await api.staff.appointments.listRange('2026-10-01', '2026-11-30');
    const mine = week.filter((a) => a.petId === 'pet-miu');
    expect(mine.map((a) => a.id).sort()).toEqual(apts.sort());
    expect(new Set(mine.map((a) => a.petName))).toEqual(new Set(['Miu Nhỏ']));
    await loginAs(api, 'lan_nguyen');
    expect((await api.customer.pets.get('pet-miu')).bookings.map((b) => b.code)).toEqual(bookings);
    expect(bookings.length).toBeGreaterThan(0);
  });
});

describe('luồng 9 · nhật ký/video: ngừng chia sẻ', () => {
  it('a withdrawn diary entry and an unshared video disappear for the customer, the rest stay', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    await api.staff.inpatient.diary.withdraw('diary-1');
    await api.staff.inpatient.videos.unshare('video-V1');
    await loginAs(api, 'lan_nguyen');
    const detail = await api.customer.stays.get('stay-NT-0041');
    expect(detail.diary).toHaveLength(2);
    expect(detail.videos.map((v) => v.id)).toEqual(['video-V2']);
    expect((await api.customer.videos.list()).map((v) => v.id)).toEqual(['video-V2']);
  });
});

describe('luồng 10 · hóa đơn: đã phát hành thì không sửa âm thầm', () => {
  it('updateDraft and a second issue are refused on an issued invoice, which stays as it was', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const inv = await api.staff.invoices.get('inv-2');
    const keep = db.read().t.invoice_lines.filter((l) => l.invoice_id === 'inv-2');
    await expect(api.staff.invoices.updateDraft('inv-2', inv.version, { lines: [{ price_item_id: 'pi-KB01', qty: 5 }] })).rejects.toThrow('Hóa đơn đã phát hành không sửa được.');
    await expect(api.staff.invoices.issue('inv-2', inv.version)).rejects.toThrow('Hóa đơn đã phát hành không sửa được.');
    expect(db.read().t.invoice_lines.filter((l) => l.invoice_id === 'inv-2')).toEqual(keep);
    expect((await api.staff.invoices.get('inv-2')).version).toBe(inv.version);
  });
});

describe('luồng 11, 13 · khoản thu và báo cáo qua ngày/tháng', () => {
  /** Issue an invoice of one KB01 line at `issueAt`, take `first` then the rest at `payAt`. */
  async function flow(issueAt: string, payAt: string, first: number) {
    // The seed is built at the usual test time; only the clock moves, so other days keep their seed data.
    const t = makeTestApi();
    const { api } = t;
    t.setNow(issueAt);
    await loginAs(api, 'quanly_ha');
    const id = await api.staff.invoices.createDraft({ customer_id: 'cus-05', pet_ids: ['pet-lu'], source_type: 'counter' });
    const v = (await api.staff.invoices.get(id)).version;
    await api.staff.invoices.updateDraft(id, v, { lines: [{ price_item_id: 'pi-KB01', qty: 1 }] });
    await api.staff.invoices.issue(id, (await api.staff.invoices.get(id)).version);
    const total = (await api.staff.invoices.get(id)).total;
    await api.staff.invoices.payments.record(id, { amount: first, method: 'transfer' });
    t.setNow(payAt);
    await api.staff.invoices.payments.record(id, { amount: total - first, method: 'cash' });
    return { ...t, id, total };
  }
  const range = (api: ReturnType<typeof makeTestApi>['api'], from: string, to: string) => api.staff.reports.revenue({ from, to });

  it('issued money and collected money fall on their own days across midnight and the month end', async () => {
    const { api, total } = await flow('2026-10-31T23:30:00+07:00', '2026-11-01T00:05:00+07:00', 50_000);
    const day1 = await range(api, '2026-10-31', '2026-10-31');
    const day2 = await range(api, '2026-11-01', '2026-11-01');
    expect(day1).toMatchObject({ invoiced: total, collected: 50_000, invoicesIssued: 1 }); // seed has nothing on 31/10
    expect(day2).toMatchObject({ invoiced: 0, collected: total - 50_000, invoicesIssued: 0 });
    const oct = await range(api, '2026-10-01', '2026-10-31');
    const nov = await range(api, '2026-11-01', '2026-11-30');
    const upToOct30 = await range(api, '2026-10-01', '2026-10-30');
    expect(oct.invoiced - upToOct30.invoiced).toBe(total);
    expect(nov).toMatchObject({ invoiced: 0, collected: total - 50_000 });
    expect(oct.collected - upToOct30.collected).toBe(50_000);
    expect(day1.collected + day2.collected).toBe(total);
    // Money still owed is a snapshot of now, not a figure for the chosen days.
    expect([day1.outstanding, oct.outstanding, nov.outstanding]).toEqual([day2.outstanding, day2.outstanding, day2.outstanding]);
  });

  it('a payment stamped in UTC at 17:00 counts on the next Vietnam day', async () => {
    const { api, db, id } = await flow('2026-10-20T09:00:00+07:00', '2026-10-20T09:05:00+07:00', 50_000);
    const cash = db.read().t.payments.find((p) => p.invoice_id === id && p.method === 'cash')!;
    const [oct31, nov1] = [await range(api, '2026-10-31', '2026-10-31'), await range(api, '2026-11-01', '2026-11-01')];
    db.transact('test.stamp', (d) => { d.t.payments.find((p) => p.id === cash.id)!.received_at = '2026-10-31T17:00:00Z'; });
    expect((await range(api, '2026-10-31', '2026-10-31')).collected).toBe(oct31.collected);
    expect((await range(api, '2026-11-01', '2026-11-01')).collected).toBe(nov1.collected + cash.amount);
  });

  it('a reversed payment leaves collected money and comes back as money still owed', async () => {
    const { api, db, id, total } = await flow('2026-10-20T09:00:00+07:00', '2026-10-20T09:05:00+07:00', 50_000);
    const day = await range(api, '2026-10-20', '2026-10-20');
    const cash = db.read().t.payments.find((p) => p.invoice_id === id && p.method === 'cash')!;
    db.transact('test.reverse', (d) => { d.t.payments.find((p) => p.id === cash.id)!.reversed_at = '2026-10-20T10:00:00+07:00'; });
    const after = await range(api, '2026-10-20', '2026-10-20');
    expect(after.collected).toBe(day.collected - cash.amount);
    expect(after.outstanding).toBe(day.outstanding + cash.amount);
    expect(after.invoiced).toBe(day.invoiced);
    await api.staff.invoices.payments.record(id, { amount: cash.amount, method: 'cash' });
    expect((await range(api, '2026-10-20', '2026-10-20')).outstanding).toBe(day.outstanding);
    expect((await api.staff.invoices.get(id)).total).toBe(total);
  });

  it('a payment above what is still owed is refused', async () => {
    const t = await flow('2026-10-20T09:00:00+07:00', '2026-10-20T09:05:00+07:00', 50_000);
    await expect(t.api.staff.invoices.payments.record(t.id, { amount: 1, method: 'cash' })).rejects.toThrow(ValidationError);
  });
});

describe('luồng 14 · đồng thời: hai phiên cùng làm một việc', () => {
  const outcome = (rs: PromiseSettledResult<unknown>[]) => rs.map((r) => (r.status === 'fulfilled' ? 'ok' : (r.reason as Error).name)).sort();

  it('two confirms of one request: one wins, the other is told its screen is old, one appointment exists', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const r = db.read().t.booking_requests.find((x) => x.code === 'YC-0236')!;
    const before = db.read().t.appointments.length;
    const input = { duration_min: 30, customer: { existingId: 'cus-09' }, pet: { existingId: 'pet-na' } };
    const rs = await Promise.allSettled([
      api.staff.requests.confirm(r.id, r.version, { ...input, start_at: '2026-10-22T09:00:00+07:00' }),
      api.staff.requests.confirm(r.id, r.version, { ...input, start_at: '2026-10-22T10:00:00+07:00' }),
    ]);
    expect(outcome(rs)).toEqual(['ConflictError', 'ok']);
    expect(db.read().t.appointments).toHaveLength(before + 1);
  });

  it('two moves of one appointment and two issues of one invoice: the second is refused', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const a = db.read().t.appointments.find((x) => x.status === 'scheduled' && x.start_at > '2026-10-20')!;
    const moves = await Promise.allSettled([
      api.staff.appointments.reschedule(a.id, a.version, { start_at: '2026-11-02T09:00:00+07:00' }),
      api.staff.appointments.reschedule(a.id, a.version, { start_at: '2026-11-03T09:00:00+07:00' }),
    ]);
    expect(outcome(moves)).toEqual(['ConflictError', 'ok']);
    const id = await api.staff.invoices.createDraft({ customer_id: 'cus-05', pet_ids: ['pet-lu'], source_type: 'counter' });
    const v = (await api.staff.invoices.get(id)).version;
    await api.staff.invoices.updateDraft(id, v, { lines: [{ price_item_id: 'pi-KB01', qty: 1 }] });
    const v2 = (await api.staff.invoices.get(id)).version;
    const issues = await Promise.allSettled([api.staff.invoices.issue(id, v2), api.staff.invoices.issue(id, v2)]);
    expect(outcome(issues)).toEqual(['ConflictError', 'ok']);
  });

  it('two full payments at once never take more than the invoice total', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const id = await api.staff.invoices.createDraft({ customer_id: 'cus-05', pet_ids: ['pet-lu'], source_type: 'counter' });
    await api.staff.invoices.updateDraft(id, (await api.staff.invoices.get(id)).version, { lines: [{ price_item_id: 'pi-KB01', qty: 1 }] });
    await api.staff.invoices.issue(id, (await api.staff.invoices.get(id)).version);
    const { total } = await api.staff.invoices.get(id);
    const rs = await Promise.allSettled([1, 2].map(() => api.staff.invoices.payments.record(id, { amount: total, method: 'cash' })).flat());
    expect(outcome(rs)).toEqual(['ValidationError', 'ok']);
    expect(db.read().t.payments.filter((p) => p.invoice_id === id).reduce((n, p) => n + p.amount, 0)).toBe(total);
  });
});

describe('luồng 15 · truy cập chéo: bị từ chối ở lớp dữ liệu, không chỉ ẩn nút', () => {
  it('a customer session cannot call staff functions', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'lan_nguyen');
    await expect(api.staff.invoices.list({})).rejects.toThrow(ForbiddenError);
    await expect(api.staff.reports.revenue({ from: '2026-10-01', to: '2026-10-31' })).rejects.toThrow(ForbiddenError);
    await expect(api.staff.customers.updatePet('pet-miu', 1, { name: 'X', species: 'cat' })).rejects.toThrow(ForbiddenError);
    await expect(api.staff.inpatient.diary.share('diary-1')).rejects.toThrow(ForbiddenError);
    await expect(api.staff.appointments.cancel('apt-1', 1, { reason: 'x' })).rejects.toThrow(ForbiddenError);
  });

  it('a signed-out visitor cannot call staff or customer functions', async () => {
    const { api } = makeTestApi();
    await expect(api.staff.invoices.list({})).rejects.toThrow(ForbiddenError);
    await expect(api.customer.invoices.list()).rejects.toThrow(ForbiddenError);
    await expect(api.customer.pets.get('pet-miu')).rejects.toThrow(ForbiddenError);
  });

  it('staff cannot call customer functions, and a doctor cannot take money or read revenue', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    await expect(api.customer.overview()).rejects.toThrow(ForbiddenError);
    await expect(api.staff.reports.revenue({ from: '2026-10-01', to: '2026-10-31' })).rejects.toThrow(ForbiddenError);
    await expect(api.staff.invoices.payments.record('inv-28', { amount: 1000, method: 'cash' })).rejects.toThrow(ForbiddenError);
  });
});
