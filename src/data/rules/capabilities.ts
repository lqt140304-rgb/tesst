export const CAPS = [
  'requests.handle',
  'appointments.view',
  'appointments.manage',
  'customers.view',
  'customers.edit',
  'accounts.link',
  'inpatient.view',
  'inpatient.admit',
  'inpatient.clinical',
  'inpatient.diary_write',
  'inpatient.share',
  'invoices.create',
  'payments.record',
  'invoices.void',
  'pricelist.edit',
  'reports.revenue',
  'stock.view',
  'stock.manage',
  'reports.operations',
] as const;
export type Cap = (typeof CAPS)[number];

export const CAP_LABEL: Record<Cap, string> = {
  'requests.handle': 'Tiếp nhận yêu cầu đặt lịch',
  'appointments.view': 'Xem lịch hẹn',
  'appointments.manage': 'Sắp xếp lịch hẹn',
  'customers.view': 'Xem hồ sơ khách hàng',
  'customers.edit': 'Cập nhật hồ sơ khách hàng',
  'accounts.link': 'Liên kết tài khoản web',
  'inpatient.view': 'Xem nội trú',
  'inpatient.admit': 'Nhập viện, xuất viện',
  'inpatient.clinical': 'Hồ sơ điều trị nội bộ',
  'inpatient.diary_write': 'Viết nhật ký, tải video',
  'inpatient.share': 'Chia sẻ với khách',
  'invoices.create': 'Lập hóa đơn',
  'payments.record': 'Thu tiền',
  'invoices.void': 'Hủy hóa đơn, hủy phiếu thu',
  'pricelist.edit': 'Sửa bảng giá',
  'reports.revenue': 'Xem doanh thu',
  'stock.view': 'Xem kho',
  'stock.manage': 'Quản lý kho',
  'reports.operations': 'Xem báo cáo vận hành',
};

export type PresetId = 'quan_ly' | 'bac_si' | 'spa';
export const PRESET_LABEL: Record<PresetId, string> = { quan_ly: 'Quản lý', bac_si: 'Bác sĩ', spa: 'Nhân viên Spa' };

export const PRESETS: Record<PresetId, readonly Cap[]> = {
  quan_ly: CAPS,
  bac_si: [
    'appointments.view', 'appointments.manage', 'customers.view', 'customers.edit', 'inpatient.view', 'inpatient.admit',
    'inpatient.clinical', 'inpatient.diary_write', 'inpatient.share', 'invoices.create',
  ],
  spa: ['appointments.view', 'customers.view', 'inpatient.view', 'inpatient.admit', 'inpatient.diary_write', 'inpatient.share'],
};

export function effectiveCaps(u: { preset_ids: readonly PresetId[]; extra_capabilities: readonly Cap[] }): ReadonlySet<Cap> {
  return new Set([...u.preset_ids.flatMap((p) => PRESETS[p]), ...u.extra_capabilities]);
}
