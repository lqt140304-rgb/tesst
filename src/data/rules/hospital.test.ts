import { describe, expect, it } from 'vitest';
import { HOSPITAL_INFO } from './hospital';

describe('hospital information', () => {
  it('is word for word what CLAUDE.md fixes', () => {
    expect(HOSPITAL_INFO).toEqual({
      name: 'Bệnh viện Thú y Lê Sơn',
      address: '101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội',
      hotline: '097 355 51 05',
      hotlineTel: 'tel:+84973555105',
      emergencyHours: '24/24',
      headDoctor: 'Bác sĩ trưởng Lê Thái Sơn',
    });
  });
  it('carries no ordinary opening hours (not confirmed): the only hours are the emergency ones', () => {
    expect(Object.keys(HOSPITAL_INFO).filter((k) => /hour|gio/i.test(k))).toEqual(['emergencyHours']);
  });
});
