import type { HospitalInfo } from '../contracts/staff';

/** Word for word what CLAUDE.md fixes, plus the opening hours the owner confirmed on 22/10/2026 (08:00–21:00; after that, emergency only). */
export const HOSPITAL_INFO: HospitalInfo = {
  name: 'Bệnh viện Thú y Lê Sơn',
  address: '101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội',
  hotline: '097 355 51 05',
  hotlineTel: 'tel:+84973555105',
  openingHours: '08:00–21:00',
  emergencyHours: '24/24',
  headDoctor: 'Bác sĩ trưởng Lê Thái Sơn',
};
