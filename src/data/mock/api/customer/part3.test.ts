import { describe, expect, it } from 'vitest';
import { loginAs, makeTestApi } from '../../testing';

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
