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
});
