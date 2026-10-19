import type {
  AppointmentSource, AppointmentStatus, CallOutcome, RequestSnapshot, RequestStatus, Service, Species,
} from './enums';

export type RequestTab = 'can_xu_ly' | RequestStatus | 'tat_ca';

export type StaffRequestCard = {
  id: string; code: string; status: RequestStatus; version: number; flaggedAt?: string; createdAt: string;
  contactName: string; phone: string; petName: string; species: Species; breed?: string; service: Service; desiredDate: string;
  source: 'guest' | 'account'; accountUsername?: string; callCount: number; handlerName?: string;
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
  note_internal?: string; alerts: string[];
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
}

export interface StaffAppointmentsApi {
  listRange(fromDate: string, toDate: string, f?: { assignee_id?: string }): Promise<StaffAppointment[]>;
  create(input: AppointmentInput): Promise<string>;
  reschedule(id: string, version: number, input: { start_at: string; reason?: string }): Promise<void>;
  cancel(id: string, version: number, input: { reason: string }): Promise<void>;
}

export type StaffOption = { id: string; name: string; title: string };

export type StaffCustomerRow = { id: string; code: string; full_name: string; phone: string; petNames: string[]; linkedUsername?: string };
export type StaffPet = {
  id: string; code: string; name: string; species: Species; breed?: string; sex?: 'male' | 'female'; birth_year?: number;
  neutered?: boolean; alerts: string[]; note_internal?: string;
};
export type StaffCustomerDetail = {
  id: string; code: string; full_name: string; phone: string; address?: string; note_internal?: string; created_at: string;
  pets: StaffPet[]; appointments: StaffAppointment[]; linkedAccount?: { id: string; username: string; linked_at: string };
  stays: { id: string; code: string; petName: string; admitted_at: string; discharged_at?: string }[];
  invoices: { id: string; code: string; total: number; status: 'draft' | 'issued' | 'voided'; state?: 'unpaid' | 'partial' | 'paid'; remaining: number; issued_at?: string }[];
};
export type CustomerInput = { full_name: string; phone: string; address?: string; note_internal?: string };
export type PetInput = { name: string; species: Species; breed?: string; sex?: 'male' | 'female'; birth_year?: number; alerts?: string[] };

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
    ownerWeb: 'linked' | 'unlinked' | 'none'; expectedDischarge?: string; alerts: string[];
  };
};
export type StaffDiaryRow = {
  id: string; status: 'draft' | 'shared' | 'withdrawn'; part_of_day: import('./enums').PartOfDay; category: import('./enums').DiaryCategory;
  general_status: import('./enums').GeneralStatus; text: string; authorName?: string; created_at: string; shared_at?: string; sharedByName?: string;
};
export type StaffVideoRow = {
  id: string; media_key: string; caption?: string; duration_s: number; uploaded_at: string; uploaderName?: string; expires_at: string;
  share_status: 'draft' | 'shared' | 'unshared'; deleted: boolean;
};
export type StaffStayView = {
  id: string; code: string; version: number; petId: string; petName: string; species: Species; breed?: string; alerts: string[];
  ownerId: string; ownerName: string; ownerPhone: string; ownerWeb: 'linked' | 'unlinked' | 'none'; cageCode: string;
  doctorName?: string; admitted_at: string; expected_discharge_at?: string; discharged_at?: string; dayNumber: number;
  internalStatus: import('./enums').InternalStatus; diary: StaffDiaryRow[]; videos: StaffVideoRow[]; invoiceId?: string;
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

export interface StaffInpatientApi {
  board(): Promise<CageTile[]>;
  getStay(id: string): Promise<StaffStayView>;
  admit(input: { pet_id: string; cage_id: string; doctor_id?: string; reason_internal: string; expected_discharge_at?: string }): Promise<string>;
  discharge(id: string, version: number, input: { note_internal?: string }): Promise<void>;
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
  };
}

export type StaffPriceItem = {
  id: string; code: string; category: import('./enums').PriceCategory; name: string; unit: string; price: number;
  price_mode: 'fixed' | 'open'; active: boolean; customer_group: import('./enums').CustomerGroup;
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
  lines: { id: string; price_item_id: string; code: string; name: string; unit: string; unit_price: number; qty: number; line_total: number; petName?: string; category: import('./enums').PriceCategory; customer_group: import('./enums').CustomerGroup }[];
  payments: { id: string; code: string; amount: number; method: import('./enums').PaymentMethod; received_at: string; receivedByName?: string; cash_given?: number; change?: number; reversed_at?: string; reverse_reason?: string }[];
};
export type DraftLineInput = { price_item_id: string; pet_id?: string; qty: number; unit_price?: number };
export type RevenueReport = {
  from: string; to: string; collected: number; byMethod: Record<import('./enums').PaymentMethod, number>;
  byCategory: Record<import('./enums').PriceCategory, number>; outstanding: number; outstandingCount: number;
  daily: { date: string; amount: number }[]; invoicesIssued: number;
};

export interface StaffPricesApi { list(): Promise<StaffPriceItem[]> }
export interface StaffInvoicesApi {
  list(f: { state?: InvoiceStateFilter; q?: string }): Promise<StaffInvoiceRow[]>;
  get(id: string): Promise<StaffInvoiceDetail>;
  createDraft(input: { customer_id: string; pet_ids: string[]; source_type: 'appointment' | 'stay' | 'counter'; source_id?: string }): Promise<string>;
  updateDraft(id: string, version: number, input: { lines: DraftLineInput[]; note_customer?: string }): Promise<void>;
  issue(id: string, version: number): Promise<void>;
  payments: { record(invoiceId: string, input: { amount: number; method: import('./enums').PaymentMethod; cash_given?: number; note?: string }): Promise<{ change: number }> };
}
export interface StaffReportsApi { revenue(range: { from: string; to: string }): Promise<RevenueReport> }
