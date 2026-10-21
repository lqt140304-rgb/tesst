import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';

describe('customer interactions', () => {
  it('lists every kind of contact, newest first, at most 50', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    const h = (await api.staff.customers.get('cus-01')).interactions;
    expect(h.length).toBeLessThanOrEqual(50);
    const times = h.map((x) => Date.parse(x.at));
    expect(times).toEqual([...times].sort((a, b) => b - a));
    expect(new Set(h.map((x) => x.kind))).toEqual(new Set(['customer', 'request', 'appointment', 'stay', 'invoice', 'payment', 'link']));
    expect(h).toContainEqual(expect.objectContaining({ kind: 'request', label: 'YC-0235: Đã xác nhận', actorName: 'Nguyễn Thu Hà', refId: 'req-YC-0235' }));
    expect(h).toContainEqual(expect.objectContaining({ kind: 'stay', label: 'Nhập viện Miu (NT-0041)', refId: 'stay-NT-0041' }));
    expect(h).toContainEqual(expect.objectContaining({ kind: 'link', label: 'Liên kết tài khoản web lan_nguyen' }));
    expect(h).toContainEqual(expect.objectContaining({ kind: 'customer', label: 'Tạo hồ sơ KH-0001' }));
  });

  it('billing rows need a billing capability; stays need inpatient.view', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    const spa = (await api.staff.customers.get('cus-01')).interactions;
    expect(spa.some((x) => x.kind === 'invoice' || x.kind === 'payment')).toBe(false);
    expect(spa.some((x) => x.kind === 'stay')).toBe(true);
  });

  it('carries nothing clinical: no orders, care notes or internal reasons', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    const json = JSON.stringify((await api.staff.customers.get('cus-01')).interactions);
    const t = db.read().t;
    for (const v of [...t.care_orders.map((o) => o.item_name), ...t.care_notes.map((n) => n.text), ...t.stays.map((s) => s.reason_internal)]) expect(json.includes(v)).toBe(false);
  });

  it('Final I2: two profiles sharing a phone do not see each other\'s booking requests', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    const other = db.read().t.customers.find((c) => c.id === 'cus-14')!; // owner of YC-0226
    const lan = await api.staff.customers.get('cus-01');
    await api.staff.customers.update('cus-01', lan.version, { full_name: lan.full_name, phone: other.phone_e164 });
    const mine = (await api.staff.customers.get('cus-01')).interactions;
    expect(mine.some((x) => x.refId === 'req-YC-0226')).toBe(false);
    expect((await api.staff.customers.get('cus-14')).interactions.some((x) => x.refId === 'req-YC-0226')).toBe(true);
    // A request nobody has claimed yet (no customer_id) is still matched by its phone.
    expect((await api.staff.customers.get('cus-01')).interactions.some((x) => x.refId === 'req-YC-0235')).toBe(true);
  });

  it('M4: keeps only the newest 50 rows', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'quanly_ha');
    db.transact('test', (d) => {
      for (let n = 0; n < 60; n++) d.t.appointments.push({ ...d.t.appointments.find((a) => a.customer_id === 'cus-01')!, id: `extra-${n}`, code: `LH-9${String(n).padStart(3, '0')}`, created_at: `2026-10-19T08:${String(n).padStart(2, '0')}:00+07:00` });
    });
    const h = (await api.staff.customers.get('cus-01')).interactions;
    expect(h).toHaveLength(50);
    expect(h[0]!.label).toMatch(/^Tạo lịch hẹn LH-9059/); // newest first
    expect(h.some((x) => x.kind === 'customer')).toBe(false); // the oldest rows were cut
  });

  it('M4: someone without inpatient.view gets no stay rows', async () => {
    const { api, db } = makeTestApi();
    db.transact('test', (d) => { Object.assign(d.t.staff_users.find((u) => u.id === 'stf-ngocanh')!, { preset_ids: [], extra_capabilities: ['customers.view'] }); });
    await loginAs(api, 'spa_ngocanh');
    const h = (await api.staff.customers.get('cus-01')).interactions;
    expect(h.some((x) => x.kind === 'stay' || x.kind === 'invoice' || x.kind === 'payment')).toBe(false);
    expect(h.some((x) => x.kind === 'appointment')).toBe(true);
  });
});
