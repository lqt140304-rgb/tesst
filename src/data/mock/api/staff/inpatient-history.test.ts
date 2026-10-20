import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';
import { purgeExpiredVideos } from './inpatient';

describe('stay history', () => {
  it('a doctor sees the full history; spa never sees orders or care notes', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_mai');
    const doctor = await api.staff.inpatient.history('stay-NT-0041');
    expect(doctor.at(-1)).toEqual({ at: '2026-10-17T10:30:00+07:00', label: 'Nhập viện Miu vào chuồng M2 (NT-0041)', actorName: 'BS. Phạm Thanh Mai', icon: 'admit' });
    expect(doctor.some((h) => h.icon === 'clinical' && h.label === 'Thêm y lệnh cho NT-0041')).toBe(true);
    await loginAs(api, 'spa_ngocanh');
    const spa = await api.staff.inpatient.history('stay-NT-0041');
    expect(spa.some((h) => h.icon === 'clinical')).toBe(false);
    expect(JSON.stringify(spa)).not.toMatch(/y lệnh|ghi chú chăm sóc|NaCl|Kháng sinh|0,5 ml/);
    expect(spa.some((h) => h.icon === 'video' && h.label === 'Tải lên 1 video của Miu')).toBe(true);
    expect(spa.some((h) => h.icon === 'diary' && h.label === 'Chia sẻ nhật ký với khách')).toBe(true);
  });

  it('orders mixed timestamp formats by time', async () => {
    const { api } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    const kem = (await api.staff.inpatient.getStay('stay-NT-0044'));
    await api.staff.inpatient.transfer(kem.id, kem.version, { cage_id: 'cage-C5' });
    const h = await api.staff.inpatient.history('stay-NT-0044');
    expect(h[0]).toMatchObject({ label: 'Chuyển Kem từ chuồng C4 sang C5', actorName: 'BS. Trần Minh Đức', icon: 'transfer' });
    expect(h.map((x) => Date.parse(x.at))).toEqual([...h.map((x) => Date.parse(x.at))].sort((a, b) => b - a));
  });

  it('shows system deletions as Hệ thống', async () => {
    const { api, db } = makeTestApi();
    purgeExpiredVideos(db, new Date('2026-10-23T09:00:00+07:00'));
    await loginAs(api, 'quanly_ha');
    expect((await api.staff.inpatient.history('stay-NT-0035'))[0]).toMatchObject({ actorName: 'Hệ thống', label: 'Tự xóa 1 video của Bơ sau 60 ngày', icon: 'video' });
  });
});
