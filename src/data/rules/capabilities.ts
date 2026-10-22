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
  'staff.manage',
  'settings.manage',
  'support.inbox',
  'stock.receive',
  'stock.issue',
  'stock.adjust',
  'stock.items',
  'content.publish',
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
  'stock.manage': 'Quản lý kho (gồm cả bốn việc ghi kho)',
  'reports.operations': 'Xem báo cáo vận hành',
  'staff.manage': 'Quản lý tài khoản nhân viên',
  'settings.manage': 'Quản lý cài đặt hệ thống',
  'support.inbox': 'Xử lý góp ý, báo lỗi',
  'stock.receive': 'Nhập thêm kho',
  'stock.issue': 'Xuất kho',
  'stock.adjust': 'Kiểm kê kho',
  'stock.items': 'Thêm, sửa, ngừng dùng món kho',
  'content.publish': 'Đăng nội dung trang giới thiệu',
};

export type PresetId = 'quan_ly' | 'bac_si' | 'spa';
export const PRESET_LABEL: Record<PresetId, string> = { quan_ly: 'Quản lý', bac_si: 'Bác sĩ', spa: 'Nhân viên Spa' };

export const PRESETS: Record<PresetId, readonly Cap[]> = {
  quan_ly: CAPS,
  bac_si: [
    'appointments.view', 'appointments.manage', 'customers.view', 'customers.edit', 'inpatient.view', 'inpatient.admit',
    'inpatient.clinical', 'inpatient.diary_write', 'inpatient.share', 'invoices.create', 'stock.view', 'content.publish',
  ],
  spa: ['appointments.view', 'customers.view', 'inpatient.view', 'inpatient.admit', 'inpatient.diary_write', 'inpatient.share', 'stock.view'],
};

/** The four rights to write the stock; the older `stock.manage` stands for all of them until the screens ask for the new ones. */
export const STOCK_WRITE_CAPS = ['stock.receive', 'stock.issue', 'stock.adjust', 'stock.items'] as const satisfies readonly Cap[];

export function effectiveCaps(u: { preset_ids: readonly PresetId[]; extra_capabilities: readonly Cap[] }): ReadonlySet<Cap> {
  const caps = new Set([...u.preset_ids.flatMap((p) => PRESETS[p]), ...u.extra_capabilities]);
  if (caps.has('stock.manage')) for (const c of STOCK_WRITE_CAPS) caps.add(c);
  return caps;
}
