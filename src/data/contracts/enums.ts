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
export const TIME_SLOTS = ['08-10', '10-12', '12-14', '14-16', '16-18', '18-20', '20-21'] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];
export const TIME_SLOT_LABEL: Record<TimeSlot, string> = {
  '08-10': '08:00–10:00',
  '10-12': '10:00–12:00',
  '12-14': '12:00–14:00',
  '14-16': '14:00–16:00',
  '16-18': '16:00–18:00',
  '18-20': '18:00–20:00',
  '20-21': '20:00–21:00',
};

/** "Giờ khác (ngoài giờ làm việc)": offered on the form after the real slots, but never a booking — the API refuses it and the screen turns "Gửi" into a call to the hotline (owner, 22/10/2026). */
export const OUT_OF_HOURS_SLOT = 'other' as const;
export const TIME_SLOT_CHOICES = [...TIME_SLOTS, OUT_OF_HOURS_SLOT] as const;
export type TimeSlotChoice = (typeof TIME_SLOT_CHOICES)[number];
export const TIME_SLOT_CHOICE_LABEL: Record<TimeSlotChoice, string> = { ...TIME_SLOT_LABEL, other: 'Giờ khác (ngoài giờ làm việc)' };

export const APPOINTMENT_STATUSES = ['scheduled', 'cancelled'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = { scheduled: 'Đã hẹn', cancelled: 'Đã hủy' };
export type AppointmentSource = 'web_request' | 'phone' | 'walk_in';
export const APPOINTMENT_SOURCES: readonly AppointmentSource[] = ['web_request', 'phone', 'walk_in'];
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

/** Cài đặt B (phần 5, giai đoạn 4): tùy chọn cá nhân của nhân viên. */
export const TEXT_SIZES = ['md', 'lg'] as const;
export type TextSize = (typeof TEXT_SIZES)[number];
export const TEXT_SIZE_LABEL: Record<TextSize, string> = { md: 'Vừa', lg: 'Lớn' };

export const DENSITIES = ['comfortable', 'compact'] as const;
export type Density = (typeof DENSITIES)[number];
export const DENSITY_LABEL: Record<Density, string> = { comfortable: 'Thoáng', compact: 'Gọn' };

export const MOTION_PREFS = ['system', 'reduced'] as const;
export type MotionPref = (typeof MOTION_PREFS)[number];
export const MOTION_PREF_LABEL: Record<MotionPref, string> = { system: 'Theo máy', reduced: 'Luôn giảm' };

export const LANDING_PAGES = ['home', 'appointments', 'inpatient', 'invoices'] as const;
export type LandingPage = (typeof LANDING_PAGES)[number];
export const LANDING_PAGE_LABEL: Record<LandingPage, string> = { home: 'Trang chủ', appointments: 'Lịch hẹn', inpatient: 'Nội trú', invoices: 'Hóa đơn' };

export const CALENDAR_VIEWS = ['week', 'day'] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];
export const CALENDAR_VIEW_LABEL: Record<CalendarView, string> = { week: 'Tuần', day: 'Ngày' };

export const PAGE_SIZES = [10, 20, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export const REPORT_RANGES = ['7d', '30d', 'month'] as const;
export type ReportRange = (typeof REPORT_RANGES)[number];
export const REPORT_RANGE_LABEL: Record<ReportRange, string> = { '7d': '7 ngày qua', '30d': '30 ngày qua', month: 'Tháng này' };

export const NUDGE_KEYS = ['requests', 'reschedules', 'stock', 'drafts'] as const;
export type NudgeKey = (typeof NUDGE_KEYS)[number];
export const NUDGE_LABEL: Record<NudgeKey, string> = {
  requests: 'Yêu cầu đặt lịch chờ xử lý', reschedules: 'Khách xin đổi lịch', stock: 'Kho sắp hết', drafts: 'Hóa đơn nháp lâu chưa phát hành',
};

/** Cài đặt C (phần 5, giai đoạn 5): cài đặt hệ thống do Quản lý chỉnh. */
export const APP_SETTING_KEYS = [
  'stock_expiry_days', 'stock_default_min', 'default_duration_kham', 'default_duration_spa', 'calendar_start', 'calendar_end',
  'payment_methods', 'request_overdue_hours', 'holidays',
] as const;
export type AppSettingKey = (typeof APP_SETTING_KEYS)[number];
export const APP_SETTING_LABEL: Record<AppSettingKey, string> = {
  stock_expiry_days: 'Số ngày báo sắp hết hạn', stock_default_min: 'Ngưỡng sắp hết mặc định', default_duration_kham: 'Thời lượng khám mặc định',
  default_duration_spa: 'Thời lượng spa mặc định', calendar_start: 'Giờ bắt đầu của lưới lịch', calendar_end: 'Giờ kết thúc của lưới lịch',
  payment_methods: 'Phương thức thanh toán đang dùng', request_overdue_hours: 'Số giờ chờ coi là quá hạn', holidays: 'Ngày nghỉ',
};

/** Hỗ trợ nhân viên (phần 5, giai đoạn 6): phiếu hỏi cách dùng, báo lỗi, góp ý. */
export const SUPPORT_KINDS = ['howto', 'bug', 'idea'] as const;
export type SupportKind = (typeof SUPPORT_KINDS)[number];
export const SUPPORT_KIND_LABEL: Record<SupportKind, string> = { howto: 'Hỏi cách dùng', bug: 'Báo lỗi', idea: 'Góp ý' };

export const SUPPORT_STATUSES = ['new', 'seen', 'answered'] as const;
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];
export const SUPPORT_STATUS_LABEL: Record<SupportStatus, string> = { new: 'Mới', seen: 'Đang xem', answered: 'Đã trả lời' };

/** Nội dung nổi bật trên trang giới thiệu: sản phẩm bán lẻ (không thuốc). */
export const FEATURED_CATEGORIES = ['food', 'litter', 'accessory'] as const;
export type FeaturedCategory = (typeof FEATURED_CATEGORIES)[number];
export const FEATURED_CATEGORY_LABEL: Record<FeaturedCategory, string> = { food: 'Thức ăn', litter: 'Cát vệ sinh', accessory: 'Phụ kiện' };

/** Lời nhắn của khách trên trang giới thiệu: chưa xử lý, rồi nhân viên đã gọi lại. */
export const INQUIRY_STATUSES = ['new', 'called'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];
export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = { new: 'Mới', called: 'Đã gọi lại' };
