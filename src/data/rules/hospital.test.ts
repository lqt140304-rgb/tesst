import { describe, expect, it } from 'vitest';
import { HOSPITAL_INFO } from './hospital';

describe('hospital information', () => {
  it('is word for word what CLAUDE.md fixes', () => {
    expect(HOSPITAL_INFO).toEqual({
      name: 'Bệnh viện Thú y Lê Sơn',
      address: '101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội',
      hotline: '097 355 51 05',
      hotlineTel: 'tel:+84973555105',
      openingHours: '08:00–21:00',
      emergencyHours: '24/24',
      headDoctor: 'Bác sĩ trưởng Lê Thái Sơn',
    });
  });
  it('opening hours are 08:00–21:00 (owner, 22/10/2026); after that it is emergency only, and "24/24" belongs to the emergency line alone', () => {
    expect(HOSPITAL_INFO.openingHours).toBe('08:00–21:00');
    expect(Object.entries(HOSPITAL_INFO).filter(([, v]) => v.includes('24/24')).map(([k]) => k)).toEqual(['emergencyHours']);
  });
});
