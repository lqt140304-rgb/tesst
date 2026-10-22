import type { Cap, PresetId } from '../rules/capabilities';
import type {
  AppointmentSource, AppointmentStatus, CalendarView, CallOutcome, Density, ExpiryState, LandingPage, MotionPref, NudgeKey, PageSize,
  PaymentMethod, ReportRange, RequestSnapshot, RequestStatus, Service, Species, StockIssueReason, StockKind, StockLevel, StockMoveKind, StockReason,
  StockStatusFilter, TextSize,
} from './enums';

export type RequestTab = 'can_xu_ly' | RequestStatus | 'tat_ca';

export type StaffRequestCard = {
  id: string; code: string; status: RequestStatus; version: number; flaggedAt?: string; createdAt: string;
  contactName: string; phone: string; petName: string; species: Species; breed?: string; service: Service; desiredDate: string;
  source: 'guest' | 'account'; accountUsername?: string; callCount: number; handlerName?: string;
  /** Still waiting for staff and older than the "request_overdue_hours" setting. Always set by the API. */
  overdue?: boolean;
};

export type StaffRequestEvent = { at: string; label: string; actorName: string; note?: string; kind: 'created' | 'status' | 'call' | 'resubmit' };

export type StaffRequestDetail = StaffRequestCard & {
  snapshot: RequestSnapshot;
  events: StaffRequestEvent[];
  appointment?: { id: string; start_at: string; assigneeName?: string; status: AppointmentStatus };
  account?: { username: string; linkedCustomerCode?: string };
  phoneMatches: { id: string; code: string; full_name: string }[];
};

export type ConfirmInput = {
  start_at: string; duration_min: number; assignee_id?: string;
  customer: { existingId: string } | { create: true };
  pet: { existingId: string } | { create: true };
  note_internal?: string;
};

export type StaffAppointment = {
  id: string; code: string; start_at: string; duration_min: number; service: Service; status: AppointmentStatus;
  source: AppointmentSource; petId: string; petName: string; species: Species; customerId: string; customerName: string;
  customerPhone: string; assigneeId?: string; assigneeName?: string; requestCode?: string; past: boolean; version: number;
  note_internal?: string; alerts: string[]; photoKey?: string;
  /** The customer asked to move it (part 3); closed when staff move it or keep it. */
  rescheduleRequest?: { id: string; desiredDate: string; preferredSlot?: import('./enums').TimeSlot; reason?: string };
};

/** "Đổi lịch" rows in "Yêu cầu đặt lịch": pending only, oldest first. */
export type StaffRescheduleRow = {
  id: string; createdAt: string; appointmentId: string; appointmentCode: string; currentStart: string; service: Service;
  petName: string; species: Species; photoKey?: string; customerId: string; customerName: string; phone: string; accountUsername?: string;
  desiredDate: string; preferredSlot?: import('./enums').TimeSlot; reason?: string;
};

export type AppointmentInput = {
  customer_id: string; pet_id: string; service: Service; start_at: string; duration_min: number; assignee_id?: string;
  source: 'phone' | 'walk_in'; note_internal?: string;
};

export interface StaffRequestsApi {
  list(f: { tab: RequestTab; q?: string }): Promise<StaffRequestCard[]>;
  counts(): Promise<Record<RequestTab, number>>;
  get(id: string): Promise<StaffRequestDetail>;
  startContact(id: string, version: number): Promise<void>;
  logCall(id: string, version: number, input: { outcome: CallOutcome; note?: string; markUnreachable?: boolean }): Promise<void>;
  markUnreachable(id: string, version: number): Promise<void>;
  confirm(id: string, version: number, input: ConfirmInput): Promise<string>;
  cancel(id: string, version: number, input: { reason_code: string; reason_text?: string }): Promise<void>;
  reject(id: string, version: number, input: { reason_code: string; reason_text?: string; duplicate_of?: string }): Promise<void>;
  /** Customers' wishes to move an appointment. Moving it (appointments.reschedule) closes the wish. */
  reschedules(): Promise<StaffRescheduleRow[]>;
  /** "Không đổi": the customer keeps the current time. */
  keepAppointment(rescheduleId: string, input?: { note?: string }): Promise<void>;
}

export interface StaffAppointmentsApi {
  /** Doctors and spa staff, for "Người phụ trách". */
  assignees(): Promise<StaffOption[]>;
  listRange(fromDate: string, toDate: string, f?: { assignee_id?: string }): Promise<StaffAppointment[]>;
  create(input: AppointmentInput): Promise<string>;
  reschedule(id: string, version: number, input: { start_at: string; reason?: string }): Promise<void>;
  cancel(id: string, version: number, input: { reason: string }): Promise<void>;
}

export type StaffOption = { id: string; name: string; title: string };

export type StaffCustomerRow = {
  id: string; code: string; full_name: string; phone: string; petNames: string[]; linkedUsername?: string;
  /** For the table's pet avatars; `petNames` is kept for older screens. */
  pets: { id: string; name: string; species: Species; photoKey?: string }[];
  /** Remaining on issued invoices. */
  outstanding: number; inpatient: boolean;
  /** The next scheduled appointment, else the latest past one. */
  nearestAppointment?: { start_at: string; upcoming: boolean };
};
export type StaffPet = {
  id: string; code: string; name: string; species: Species; breed?: string; sex?: 'male' | 'female'; birth_year?: number;
  neutered?: boolean; alerts: string[]; note_internal?: string; version: number; weight_kg?: number; color?: string;
  /** For PetAvatar (`petPhoto(key, size)`); absent → species icon. */
  photoKey?: string;
};
/** One line of a customer's history, newest first (part 4). Staff-only; never contains orders or care notes. */
export type StaffInteractionKind = 'customer' | 'request' | 'appointment' | 'stay' | 'invoice' | 'payment' | 'link';
export type StaffInteraction = { at: string; kind: StaffInteractionKind; label: string; actorName?: string; refId?: string };
export type StaffCustomerDetail = {
  id: string; code: string; full_name: string; phone: string; address?: string; note_internal?: string; created_at: string; version: number;
  /** Newest first, at most 50. Invoice/payment rows need invoices.create or payments.record; stays need inpatient.view. */
  interactions: StaffInteraction[];
  pets: StaffPet[]; appointments: StaffAppointment[]; linkedAccount?: { id: string; username: string; linked_at: string };
  stays: { id: string; code: string; petName: string; admitted_at: string; discharged_at?: string }[];
  invoices: { id: string; code: string; total: number; status: 'draft' | 'issued' | 'voided'; state?: 'unpaid' | 'partial' | 'paid'; remaining: number; issued_at?: string }[];
};
export type CustomerInput = { full_name: string; phone: string; address?: string; note_internal?: string };
export type PetInput = {
  name: string; species: Species; breed?: string; sex?: 'male' | 'female'; birth_year?: number; alerts?: string[];
  /** kg, 0,1–120, at most one decimal. */
  weight_kg?: number; color?: string; neutered?: boolean; note_internal?: string;
};

export type WebAccountRow = { id: string; username: string; display_name: string; phone: string; created_at: string; linked: boolean; customerCode?: string; customerName?: string };
export type WebAccountForLinking = {
  account: { id: string; username: string; display_name: string; phone: string; created_at: string };
  alreadyLinked: boolean;
  webPets: { id: string; name: string; species: Species; breed?: string }[];
  phoneMatches: { id: string; code: string; full_name: string; pets: { id: string; name: string; species: Species }[] }[];
};
export type LinkInput = {
  customer_id: string; pet_matches: { account_pet_id: string; pet_id: string }[]; method: 'in_person_app' | 'other'; method_note?: string; confirmed: true;
};

export interface StaffCustomersApi {
  list(q?: string): Promise<StaffCustomerRow[]>;
  get(id: string): Promise<StaffCustomerDetail>;
  create(input: CustomerInput): Promise<string>;
  createPet(customerId: string, input: PetInput): Promise<string>;
  /** Replaces the editable fields (an empty optional field clears it). */
  update(id: string, version: number, input: CustomerInput): Promise<void>;
  /** Replaces the editable fields, except `alerts` (safety warnings): left out = kept, `[]` = cleared. */
  updatePet(petId: string, version: number, input: PetInput): Promise<void>;
  /** Customers already using this phone (any spelling), for a warning — never a block. */
  findByPhone(phone: string, excludeId?: string): Promise<{ id: string; code: string; full_name: string }[]>;
}
export interface StaffAccountsApi {
  list(f?: { linked?: boolean }): Promise<WebAccountRow[]>;
  findByLinkCode(code: string): Promise<WebAccountForLinking | null>;
  link(accountId: string, input: LinkInput): Promise<void>;
}

export type CageTile = {
  cageId: string; cageCode: string; zone: string;
  stay?: {
    id: string; code: string; petName: string; species: Species; ownerName: string; doctorName?: string;
    internalStatus: import('./enums').InternalStatus; dayNumber: number; slotsPending: number; diaryToday: boolean;
    ownerWeb: 'linked' | 'unlinked' | 'none'; expectedDischarge?: string; alerts: string[]; photoKey?: string;
  };
};
export type StaffDiaryRow = {
  id: string; status: 'draft' | 'shared' | 'withdrawn'; part_of_day: import('./enums').PartOfDay; category: import('./enums').DiaryCategory;
  general_status: import('./enums').GeneralStatus; text: string; authorName?: string; created_at: string; shared_at?: string; sharedByName?: string;
};
export type StaffVideoRow = {
  id: string; media_key: string; caption?: string;
  /** 0 = the browser could not read the length (show "—"). */
  duration_s: number; uploaded_at: string; uploaderName?: string; expires_at: string;
  share_status: 'draft' | 'shared' | 'unshared'; deleted: boolean;
  /** Kept only in this browser ("Chỉ lưu trên trình duyệt này"); play it through useMediaUrls. */
  isLocal: boolean;
};
export type StaffStayView = {
  id: string; code: string; version: number; petId: string; petName: string; species: Species; breed?: string; alerts: string[]; photoKey?: string;
  ownerId: string; ownerName: string; ownerPhone: string; ownerWeb: 'linked' | 'unlinked' | 'none'; cageCode: string;
  doctorName?: string; admitted_at: string; expected_discharge_at?: string; discharged_at?: string; dayNumber: number;
  internalStatus: import('./enums').InternalStatus; diary: StaffDiaryRow[]; videos: StaffVideoRow[]; invoiceId?: string;
  /** The stay's invoice and its day line; absent when the stay has no invoice. */
  billing?: StayBilling;
  /** Present only for staff holding inpatient.clinical. */
  internal?: {
    reason: string;
    orders: { id: string; kind: 'drug' | 'fluid' | 'care'; item_name: string; dose?: string; route?: string; schedule_times: string[]; status: 'active' | 'stopped'; orderedByName?: string; todaySlots: { time: string; done: boolean; due: boolean }[] }[];
    administrations: { id: string; item_name: string; dose?: string; performed_at: string; performedByName?: string; slot_time?: string }[];
    notes: { id: string; type: 'observation' | 'feeding' | 'hygiene' | 'note'; text: string; at: string; authorName?: string; temp_c?: number; weight_kg?: number }[];
  };
};
export type DiaryDraftInput = {
  id?: string; part_of_day: import('./enums').PartOfDay; category: import('./enums').DiaryCategory; general_status: import('./enums').GeneralStatus; text: string;
};
export type VideoShareChecks = { only_this_pet: true; no_people_or_private_info: true };

export type AdmitPetOption = {
  id: string; name: string; species: Species; breed?: string; weight_kg?: number; ownerName: string; ownerPhone: string; inpatient: boolean; photoKey?: string;
  /** LT01–LT03 price item id from species + weight; absent when the pet has no weight (no day charge by default). */
  suggestedDayItemId?: string;
};
export type StayHistoryIcon = 'admit' | 'transfer' | 'status' | 'discharge' | 'diary' | 'video' | 'clinical';
export type StayHistoryItem = { at: string; label: string; actorName: string; icon: StayHistoryIcon };
export type DemoClip = { key: string; label: string; duration_s: number };
export type VideoUploadInput = {
  source: { kind: 'demo'; key: string } | { kind: 'device'; file: Blob };
  caption?: string; recorded_at?: string;
  /** Seconds the browser read; 0 or absent = unknown (shown "—"). Ignored for sample clips. */
  duration_s?: number;
  /** Only for staff with inpatient.share; both boxes ticked. */
  share?: VideoShareChecks;
};
export type AdmitInput = {
  pet_id: string; cage_id: string; doctor_id?: string; reason_internal: string; expected_discharge_at?: string;
  initial_status?: import('./enums').InternalStatus; appointment_id?: string;
  /** Present = "Tạo hóa đơn nội trú nháp" ticked; no day_price_item_id = "Chưa ghi tiền nội trú". */
  invoice?: { day_price_item_id?: string };
};
export type DischargeInput = { discharged_at?: string; note_internal?: string; farewell?: { text: string; share: boolean } };
export type DischargeResult = { days: number; invoiceUpdated: boolean };
/** Day fields come from the day line (LT01–LT03 for this pet); none = "Chưa ghi tiền nội trú". */
export type StayBilling = { invoiceId: string; invoiceCode: string; status: import('./enums').InvoiceStatus; dayItemName?: string; dayPrice?: number; dayQty?: number };
export type DayPriceItem = { id: string; code: string; name: string; price: number };
export type AdmitOptions = {
  cages: { id: string; code: string; zone: string; species_hint: Species | 'any' }[];
  doctors: StaffOption[];
  dayItems: DayPriceItem[];
  /** Today's "Đã hẹn" appointments whose pet is not staying. */
  today: { appointmentId: string; start_at: string; service: Service; pet: AdmitPetOption; draftInvoice?: { id: string; code: string } }[];
};

export interface StaffInpatientApi {
  board(): Promise<CageTile[]>;
  getStay(id: string): Promise<StaffStayView>;
  /** Everything the "Nhập viện" dialog offers. */
  admitOptions(): Promise<AdmitOptions>;
  /** Pet name, owner name or phone, accent-insensitive. */
  findPets(q: string): Promise<AdmitPetOption[]>;
  admit(input: AdmitInput): Promise<string>;
  transfer(id: string, version: number, input: { cage_id: string; reason?: string }): Promise<void>;
  /** Newest first; orders, care and administrations only for inpatient.clinical. */
  history(stayId: string): Promise<StayHistoryItem[]>;
  discharge(id: string, version: number, input: DischargeInput): Promise<DischargeResult>;
  setInternalStatus(id: string, version: number, status: import('./enums').InternalStatus): Promise<void>;
  orders: {
    create(stayId: string, input: { kind: 'drug' | 'fluid' | 'care'; item_name: string; dose?: string; route?: string; schedule_times: string[] }): Promise<string>;
    stop(orderId: string): Promise<void>;
  };
  administrations: { record(stayId: string, input: { order_id?: string; slot_time?: string; item_name?: string; dose?: string; note?: string }): Promise<void> };
  careNotes: { create(stayId: string, input: { type: 'observation' | 'feeding' | 'hygiene' | 'note'; text: string; temp_c?: number; weight_kg?: number }): Promise<void> };
  diary: {
    saveDraft(stayId: string, input: DiaryDraftInput): Promise<string>;
    share(id: string): Promise<void>;
    withdraw(id: string): Promise<void>;
    lint(text: string): Promise<string[]>;
  };
  videos: {
    share(id: string, checks: VideoShareChecks): Promise<void>;
    unshare(id: string): Promise<void>;
    delete(id: string): Promise<void>;
    /** Sample clip or device file (≤ 20 MB, ≤ 15 s, kept in this browser). Returns the video id. */
    upload(stayId: string, input: VideoUploadInput): Promise<string>;
    demoClips(): Promise<DemoClip[]>;
    /** False when this browser cannot keep files: "Chọn từ máy" is then off. */
    deviceUploadAvailable(): Promise<boolean>;
  };
}

export type StaffPriceItem = {
  id: string; code: string; category: import('./enums').PriceCategory; name: string; unit: string; price: number;
  price_mode: 'fixed' | 'open'; active: boolean; customer_group: import('./enums').CustomerGroup;
  version: number;
  /** Open-price items only: a hint the invoice editor pre-fills (the API never applies it). */
  reference_price?: number;
};
/** `category` cannot change on update; `price` is ignored for open items and `reference_price` for fixed ones; `active` is for `create` (on update use `setActive` — a different value is refused). */
export type PriceInput = {
  category: import('./enums').PriceCategory; name: string; unit: string; price_mode: 'fixed' | 'open'; price?: number; reference_price?: number;
  customer_group?: import('./enums').CustomerGroup; active?: boolean;
};
export type InvoiceStateFilter = import('./enums').PaymentState | 'draft' | 'voided';
export type StaffInvoiceRow = {
  id: string; code: string; customerId: string; customerName: string; petNames: string[]; status: import('./enums').InvoiceStatus;
  state?: import('./enums').PaymentState; total: number; paid: number; remaining: number; created_at: string; issued_at?: string;
  sourceType: 'appointment' | 'stay' | 'counter';
};
export type StaffInvoiceDetail = StaffInvoiceRow & {
  version: number; subtotal: number; discount?: { type: 'percent' | 'amount'; value: number; amount: number; reason: string };
  note_customer?: string; customerPhone: string; issuedByName?: string; createdByName?: string; voidReason?: string; replacesCode?: string;
  lines: { id: string; price_item_id: string; code: string; name: string; unit: string; unit_price: number; qty: number; line_total: number; pet_id?: string; petName?: string; category: import('./enums').PriceCategory; customer_group: import('./enums').CustomerGroup; price_mode: 'fixed' | 'open' }[];
  payments: { id: string; code: string; amount: number; method: import('./enums').PaymentMethod; received_at: string; receivedByName?: string; cash_given?: number; change?: number; reversed_at?: string; reverse_reason?: string }[];
};
export type DraftLineInput = { price_item_id: string; pet_id?: string; qty: number; unit_price?: number };
export type RevenueReport = {
  from: string; to: string; collected: number; byMethod: Record<import('./enums').PaymentMethod, number>;
  /** Issued invoices of the range, after discount — adds up to `invoiced`. */
  byCategory: Record<import('./enums').PriceCategory, number>;
  /** Total of the invoices issued in the range (drafts and voided ones excluded). */
  invoiced: number; outstanding: number; outstandingCount: number;
  daily: { date: string; amount: number }[]; invoicesIssued: number;
};

export interface StaffPricesApi {
  list(): Promise<StaffPriceItem[]>;
  /** pricelist.edit. The code is generated (KB10…). */
  create(input: PriceInput): Promise<string>;
  update(id: string, version: number, input: PriceInput): Promise<void>;
  /** A switched-off item cannot be added to invoices; lines already on invoices stay. */
  setActive(id: string, version: number, active: boolean): Promise<void>;
}
export interface StaffInvoicesApi {
  list(f: { state?: InvoiceStateFilter; q?: string }): Promise<StaffInvoiceRow[]>;
  get(id: string): Promise<StaffInvoiceDetail>;
  createDraft(input: { customer_id: string; pet_ids: string[]; source_type: 'appointment' | 'stay' | 'counter'; source_id?: string }): Promise<string>;
  /** Returns the draft's new version, so an open editor checks its next save against what it last wrote. */
  updateDraft(id: string, version: number, input: { lines: DraftLineInput[]; note_customer?: string }): Promise<number>;
  issue(id: string, version: number): Promise<void>;
  payments: { record(invoiceId: string, input: { amount: number; method: import('./enums').PaymentMethod; cash_given?: number; note?: string }): Promise<{ change: number }> };
}
export interface StaffReportsApi {
  revenue(range: { from: string; to: string }): Promise<RevenueReport>;
  /** `reports.operations`. Days are Vietnam days, `from ≤ to`, at most 366 days; the money block needs `reports.revenue` as well. */
  operations(range: OpsRange): Promise<OperationsReport>;
}

/** Kho (phần 5, giai đoạn 1). Quyền: `stock.view` đọc, `stock.manage` ghi (cần cả hai). */
export type StockInput = { name: string; kind: StockKind; unit: string; qty?: number; min_qty: number; expires_on?: string; active?: boolean };
export type StockReceiveInput = { qty: number; supplier?: string; note?: string; expires_on?: string };
export type StockIssueInput = { qty: number; reason: StockIssueReason; note?: string };
export type StockAdjustInput = { counted_qty: number; note?: string };
export type StockRow = {
  id: string; code: string; name: string; kind: StockKind; unit: string; qty: number; minQty: number; expiresOn?: string;
  active: boolean; level: StockLevel; expiry: ExpiryState; version: number;
};
export type StockMoveRow = {
  id: string; kind: StockMoveKind; delta: number; qtyAfter: number; reason: StockReason; supplier?: string; note?: string; at: string; byName: string;
};
export type StockDetail = { item: StockRow; moves: StockMoveRow[] };
export type StockSummary = { total: number; low: number; out: number; expiringSoon: number; expired: number };
export type StockListFilter = { q?: string; kind?: StockKind; status?: StockStatusFilter; includeInactive?: boolean };
export interface StaffStockApi {
  summary(): Promise<StockSummary>;
  list(f?: StockListFilter): Promise<StockRow[]>;
  get(id: string): Promise<StockDetail>;
  create(input: StockInput): Promise<string>;
  /** Replaces name, unit, min_qty and expires_on (left out or "" = no expiry); `active` left out keeps the current value. Never changes `qty`. */
  update(id: string, version: number, input: StockInput): Promise<void>;
  receive(id: string, version: number, input: StockReceiveInput): Promise<void>;
  issue(id: string, version: number, input: StockIssueInput): Promise<void>;
  /** Stock-take: sets the quantity to what was counted and records the difference. */
  adjust(id: string, version: number, input: StockAdjustInput): Promise<void>;
}

/** Báo cáo vận hành (phần 5, giai đoạn 2). Tỉ lệ và trung bình không tính được (mẫu số 0) là `null`. */
export type OpsRange = { from: string; to: string };
export type OpsAppointments = {
  scheduled: number; cancelled: number; total: number; cancelRate: number | null;
  /** The groups below count "Đã hẹn" only, so each adds up to `scheduled`. */
  daily: { date: string; count: number }[]; byService: Record<Service, number>; bySource: Record<AppointmentSource, number>;
  /** Only people with at least one appointment; the `id: null` row ("Chưa phân công") appears only when it has some. */
  byAssignee: { id: string | null; name: string; count: number }[]; previousScheduled: number;
};
export type OpsRequests = {
  received: number; byStatus: Record<RequestStatus, number>; confirmRate: number | null; avgFirstResponseMin: number | null;
  /** Needing staff right now, whatever the range. */
  waitingNow: number; previousReceived: number;
};
export type OpsInpatient = {
  admitted: number; discharged: number; currentlyAdmitted: number; bedDays: number; occupancyRate: number | null; previousAdmitted: number;
};
export type OpsCustomers = { newCustomers: number; previousNewCustomers: number };
export type OpsStock = { low: number; out: number; expiringSoon: number; expired: number };
export type OpsRevenue = { collected: number; invoiced: number; outstanding: number; previousCollected: number };
export type OperationsReport = {
  from: string; to: string; previous: OpsRange; appointments: OpsAppointments; requests: OpsRequests; inpatient: OpsInpatient;
  customers: OpsCustomers; stock: OpsStock;
  /** Only for staff who also hold `reports.revenue`. */
  revenue?: OpsRevenue;
};

/** Cài đặt A (phần 5, giai đoạn 3): tài khoản nhân viên, hồ sơ cá nhân, thông tin bệnh viện. */
export type StaffAdminRow = {
  id: string; username: string; name: string; title: string; presets: PresetId[]; extraCaps: Cap[]; active: boolean; isSelf: boolean; version: number;
};
export type StaffAccountInput = { display_name: string; title: string; preset_ids: PresetId[]; extra_capabilities: Cap[] };
export type StaffCreateInput = StaffAccountInput & { username: string; password: string };
/** `staff.manage`. Never takes or returns a password hash; the last active manager can be neither switched off nor demoted. */
export interface StaffTeamApi {
  /** Everyone, switched-off people last. */
  list(): Promise<StaffAdminRow[]>;
  create(input: StaffCreateInput): Promise<string>;
  update(id: string, version: number, input: StaffAccountInput): Promise<void>;
  setActive(id: string, version: number, active: boolean): Promise<void>;
  /** Someone else's password; your own is changed in the profile. */
  resetPassword(id: string, version: number, input: { password: string }): Promise<void>;
}
export type StaffProfile = { username: string; name: string; title: string; presets: PresetId[]; caps: Cap[] };
/** Any signed-in staff member, about themselves only (the subject comes from the session). */
export interface StaffProfileApi {
  get(): Promise<StaffProfile>;
  updateName(name: string): Promise<void>;
  changePassword(input: { current: string; next: string; next2: string }): Promise<void>;
}
/** `headDoctor` is the whole phrase to show as is ("Bác sĩ trưởng Lê Thái Sơn"): add no extra label in front of it. */
export type HospitalInfo = { name: string; address: string; hotline: string; hotlineTel: string; emergencyHours: string; headDoctor: string };
export interface StaffSettingsApi {
  /** Read-only, word for word CLAUDE.md; no ordinary opening hours (not confirmed). */
  hospital(): Promise<HospitalInfo>;
}

/** Cài đặt C: system settings. */
export type AppSettingsValues = {
  stock_expiry_days: number; stock_default_min: number; default_duration_kham: number; default_duration_spa: number;
  calendar_start: string; calendar_end: string; payment_methods: PaymentMethod[]; request_overdue_hours: number;
};
export type AppSettingsPatch = Partial<AppSettingsValues>;
/** A rule that is already decided and cannot be changed here; shown as read-only text. */
export type FixedRule = { label: string; value: string };
export type AppSettings = { version: number; values: AppSettingsValues; fixedRules: FixedRule[] };

/** Cài đặt B: tùy chọn cá nhân. Chỉ người đăng nhập, chỉ của chính họ. */
export type StaffPrefs = {
  text_size: TextSize; density: Density; motion: MotionPref; landing: LandingPage; appointments_view: CalendarView; page_size: PageSize;
  report_range: ReportRange; nudges: Record<NudgeKey, boolean>; onboarding_done: string[]; onboarding_hidden: boolean;
};
/** Only the keys named are changed; `nudges` is changed nudge by nudge. */
export type StaffPrefsPatch = Partial<Omit<StaffPrefs, 'nudges'>> & { nudges?: Partial<Record<NudgeKey, boolean>> };
export interface StaffPrefsApi {
  /** What the person set, over the defaults for their role; a landing page or nudge they lost the right to reads as the fallback. */
  get(): Promise<StaffPrefs>;
  save(patch: StaffPrefsPatch): Promise<StaffPrefs>;
  /** Back to the role defaults. */
  reset(): Promise<StaffPrefs>;
}
