/** Enum values are ASCII; every Vietnamese label lives in the label maps below. */

export const REQUEST_STATUSES = ['pending', 'contacting', 'confirmed', 'unreachable', 'cancelled', 'rejected'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  pending: 'Chờ xác nhận',
  contacting: 'Đang liên hệ',
  confirmed: 'Đã xác nhận',
  unreachable: 'Không liên lạc được',
  cancelled: 'Đã hủy',
  rejected: 'Từ chối',
};

export const SERVICES = ['kham', 'spa', 'noi_tru'] as const;
export type Service = (typeof SERVICES)[number];
export const SERVICE_LABEL: Record<Service, string> = { kham: 'Khám và điều trị', spa: 'Spa & Grooming', noi_tru: 'Nội trú' };

/** "Khung giờ (tùy chọn)" on the booking form (part 2 §4). A wish, not a booking: staff still call to confirm. */
export const TIME_SLOTS = ['08-10', '10-12', '14-16', '16-18', '18-20'] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];
export const TIME_SLOT_LABEL: Record<TimeSlot, string> = {
  '08-10': '08:00–10:00',
  '10-12': '10:00–12:00',
  '14-16': '14:00–16:00',
  '16-18': '16:00–18:00',
  '18-20': '18:00–20:00',
};

export const APPOINTMENT_STATUSES = ['scheduled', 'cancelled'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = { scheduled: 'Đã hẹn', cancelled: 'Đã hủy' };
export type AppointmentSource = 'web_request' | 'phone' | 'walk_in';
export const APPOINTMENT_SOURCE_LABEL: Record<AppointmentSource, string> = {
  web_request: 'Yêu cầu trên web',
  phone: 'Điện thoại',
  walk_in: 'Tại quầy',
};

export const CALL_OUTCOMES = ['talked', 'no_answer', 'busy', 'call_back_later'] as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];
export const CALL_OUTCOME_LABEL: Record<CallOutcome, string> = {
  talked: 'Đã trao đổi',
  no_answer: 'Không nghe máy',
  busy: 'Máy bận / thuê bao',
  call_back_later: 'Khách hẹn gọi lại',
};

export type Species = 'dog' | 'cat' | 'other';
export const SPECIES_LABEL: Record<Species, string> = { dog: 'Chó', cat: 'Mèo', other: 'Khác' };
export type Sex = 'male' | 'female';
export const SEX_LABEL: Record<Sex, string> = { male: 'Đực', female: 'Cái' };

export const INTERNAL_STATUSES = ['stable', 'watch', 'critical'] as const;
export type InternalStatus = (typeof INTERNAL_STATUSES)[number];
export const INTERNAL_STATUS_LABEL: Record<InternalStatus, string> = { stable: 'Ổn định', watch: 'Cần theo dõi', critical: 'Nặng' };

export const GENERAL_STATUSES = ['stable', 'recovering', 'watch', 'ready_home', 'want_to_talk'] as const;
export type GeneralStatus = (typeof GENERAL_STATUSES)[number];
export const GENERAL_STATUS_LABEL: Record<GeneralStatus, string> = {
  stable: 'Ổn định',
  recovering: 'Đang hồi phục tốt',
  watch: 'Cần theo dõi thêm',
  ready_home: 'Sẵn sàng về nhà',
  want_to_talk: 'Lê Sơn muốn trao đổi với bạn',
};

export const PARTS_OF_DAY = ['sang', 'chieu', 'toi'] as const;
export type PartOfDay = (typeof PARTS_OF_DAY)[number];
export const PART_OF_DAY_LABEL: Record<PartOfDay, string> = { sang: 'Sáng', chieu: 'Chiều', toi: 'Tối' };

export const DIARY_CATEGORIES = ['an_uong', 'nghi_ngoi', 'tinh_than', 'van_dong', 'loi_nhan'] as const;
export type DiaryCategory = (typeof DIARY_CATEGORIES)[number];
export const DIARY_CATEGORY_LABEL: Record<DiaryCategory, string> = {
  an_uong: 'Ăn uống',
  nghi_ngoi: 'Nghỉ ngơi',
  tinh_than: 'Tinh thần',
  van_dong: 'Vận động',
  loi_nhan: 'Lời nhắn',
};

export type InvoiceStatus = 'draft' | 'issued' | 'voided';
export const PAYMENT_STATES = ['unpaid', 'partial', 'paid'] as const;
export type PaymentState = (typeof PAYMENT_STATES)[number];
export const PAYMENT_STATE_LABEL: Record<PaymentState, string> = {
  unpaid: 'Chưa thanh toán',
  partial: 'Đã thanh toán một phần',
  paid: 'Đã thanh toán',
};
export const PAYMENT_METHODS = ['cash', 'transfer', 'qr'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = { cash: 'Tiền mặt', transfer: 'Chuyển khoản', qr: 'QR ngân hàng' };

export const PRICE_CATEGORIES = ['exam', 'spa', 'inpatient', 'medicine', 'supply'] as const;
export type PriceCategory = (typeof PRICE_CATEGORIES)[number];
export const PRICE_CATEGORY_LABEL: Record<PriceCategory, string> = {
  exam: 'Khám và điều trị',
  spa: 'Spa & Grooming',
  inpatient: 'Nội trú',
  medicine: 'Thuốc',
  supply: 'Vật tư',
};
/** R7: treatment lines are shown to customers as one combined line. */
export type CustomerGroup = 'itemized' | 'treatment';
export const TREATMENT_LINE_LABEL = 'Thuốc và vật tư điều trị';

/** What the customer typed, frozen at submit time. */
export type RequestSnapshot = {
  contact_name: string;
  phone_e164: string;
  pet_name: string;
  species: Species;
  breed?: string;
  service: Service;
  desired_date: string;
  preferred_slot?: TimeSlot;
  note?: string;
  account_pet_id?: string;
  pet_id?: string;
};

/** Kho (phần 5): thuốc và vật tư, tồn, lịch sử nhập–xuất. */
export const STOCK_KINDS = ['thuoc', 'vat_tu'] as const;
export type StockKind = (typeof STOCK_KINDS)[number];
export const STOCK_KIND_LABEL: Record<StockKind, string> = { thuoc: 'Thuốc', vat_tu: 'Vật tư' };

export const STOCK_MOVE_KINDS = ['in', 'out', 'adjust'] as const;
export type StockMoveKind = (typeof STOCK_MOVE_KINDS)[number];
export const STOCK_MOVE_KIND_LABEL: Record<StockMoveKind, string> = { in: 'Nhập', out: 'Xuất', adjust: 'Kiểm kê' };

export const STOCK_REASONS = ['nhap_hang', 'dung_tai_phong', 'hu_hong', 'het_han', 'kiem_ke', 'khac'] as const;
export type StockReason = (typeof STOCK_REASONS)[number];
export const STOCK_REASON_LABEL: Record<StockReason, string> = {
  nhap_hang: 'Nhập hàng', dung_tai_phong: 'Dùng tại phòng khám', hu_hong: 'Hư hỏng', het_han: 'Hết hạn', kiem_ke: 'Kiểm kê', khac: 'Khác',
};
/** Reasons a person may pick when taking stock out (the others are written by Nhập thêm and Kiểm kê). */
export const STOCK_ISSUE_REASONS = ['dung_tai_phong', 'hu_hong', 'het_han', 'khac'] as const;
export type StockIssueReason = (typeof STOCK_ISSUE_REASONS)[number];

export const STOCK_STATUS_FILTERS = ['all', 'low', 'out', 'expiring'] as const;
export type StockStatusFilter = (typeof STOCK_STATUS_FILTERS)[number];
export const STOCK_STATUS_LABEL: Record<StockStatusFilter, string> = { all: 'Tất cả', low: 'Sắp hết', out: 'Hết hàng', expiring: 'Sắp hết hạn' };

export type StockLevel = 'ok' | 'low' | 'out';
export type ExpiryState = 'none' | 'soon' | 'expired';
