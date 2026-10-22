/**
 * Mock database document. Table and field names follow proposal-staff.md §8 (+ QUYET-DINH R2, R7, R8, R28)
 * so they map 1:1 to Postgres tables later.
 */
import type {
  AppointmentSource, AppointmentStatus, CallOutcome, CustomerGroup, DiaryCategory, GeneralStatus, InternalStatus,
  FeaturedCategory, InquiryStatus, InvoiceStatus, PartOfDay, PaymentMethod, PriceCategory, RequestSnapshot, RequestStatus, Service, Sex, Species, SupportKind, SupportStatus, TimeSlot,
} from '../../contracts/enums';
import type { AppSettingsValues, StaffPrefsPatch } from '../../contracts/staff';
import type { Cap, PresetId } from '../../rules/capabilities';

export const SCHEMA_VERSION = 1 as const;
export const CODE_PREFIXES = ['YC', 'LH', 'NT', 'HD', 'PT', 'KH', 'TC', 'KHO', 'HT', 'LN'] as const;
export type CodePrefix = (typeof CODE_PREFIXES)[number];

export type StaffUser = {
  id: string; username: string; display_name: string; title: string; preset_ids: PresetId[];
  extra_capabilities: Cap[]; is_sample: true; active: boolean; password_salt: string; password_hash: string; version: number;
};

export type WebAccount = {
  id: string; username: string; phone_e164: string; display_name: string; email?: string;
  salutation: 'anh' | 'chi' | 'ban'; link_code: string; status: 'active' | 'locked'; created_at: string;
  password_salt: string; password_hash: string;
};
export type AccountPet = {
  id: string; account_id: string; name: string; species: Species; breed?: string; sex?: Sex; birth_year?: number;
  note?: string; created_at: string;
  /** Photo key (not a URL), mapped to files by src/assets/media.ts `petPhoto` (redesign §5.3). */
  photo_key?: string;
};
export type AccountSeen = { account_id: string; key: string; seen_at: string };

export type Customer = {
  id: string; code: string; full_name: string; phone_e164: string; phone_alt?: string; address?: string;
  note_internal?: string; created_at: string; created_by: string; version: number;
};
export type AccountLink = {
  id: string; account_id: string; customer_id: string; linked_at: string; linked_by: string;
  method: 'in_person_app' | 'other'; method_note?: string; unlinked_at?: string; unlinked_by?: string; unlink_reason?: string;
};
export type PetLink = { id: string; account_pet_id: string; pet_id: string; link_id: string };
export type Pet = {
  id: string; code: string; customer_id: string; name: string; species: Species; breed?: string; sex?: Sex;
  neutered?: boolean; birth_year?: number; color?: string; weight_kg?: number; alerts: string[]; note_internal?: string;
  /** Photo key (not a URL), mapped to files by src/assets/media.ts `petPhoto` (redesign §5.3). */
  photo_key?: string; version: number;
};

export type BookingRequest = {
  id: string; code: string; scope: 'account' | 'guest'; account_id?: string; snapshot: RequestSnapshot;
  dedupe_key: string; status: RequestStatus; resubmit_flag_at?: string; handler_id?: string; appointment_id?: string;
  customer_id?: string; pet_id?: string; version: number; created_at: string; updated_at: string;
};
export type RequestEvent = {
  id: string; request_id: string; type: 'created' | 'status_change' | 'call' | 'resubmit' | 'handler_change';
  from_status?: RequestStatus; to_status?: RequestStatus; call_outcome?: CallOutcome; reason_code?: string;
  reason_text?: string; note?: string; actor_type: 'staff' | 'customer' | 'guest' | 'system'; actor_id?: string; at: string;
};
export type Appointment = {
  id: string; code: string; customer_id: string; pet_id: string; service: Service; start_at: string; duration_min: number;
  assignee_id?: string; status: AppointmentStatus; source: AppointmentSource; request_id?: string; note_internal?: string;
  cancel_reason?: string; rescheduled_from?: string; version: number; created_by: string; created_at: string;
};

/** A customer's wish to move an appointment (part 3). Staff call, then move it ("done") or keep it ("kept"). */
export type RescheduleRequest = {
  id: string; appointment_id: string; account_id: string; desired_date: string; preferred_slot?: TimeSlot; reason?: string;
  status: 'pending' | 'done' | 'kept' | 'cancelled'; created_at: string; closed_at?: string; closed_by?: string; note?: string;
};

export type Cage = { id: string; code: string; zone: string; species_hint: Species | 'any'; active: boolean };
export type Stay = {
  id: string; code: string; pet_id: string; customer_id: string; cage_id: string; doctor_id: string; admitted_at: string;
  admitted_by: string; reason_internal: string; internal_status: InternalStatus; expected_discharge_at?: string;
  discharged_at?: string; discharged_by?: string; discharge_note_internal?: string; appointment_id?: string;
  invoice_id?: string;
  /** LT01–LT03 chosen at admission; undefined = "Chưa ghi tiền nội trú". */
  day_price_item_id?: string; version: number;
};
export type CareOrder = {
  id: string; stay_id: string; kind: 'drug' | 'fluid' | 'care'; item_name: string; dose?: string; route?: string;
  schedule_times: string[]; start_date: string; end_date?: string; status: 'active' | 'stopped'; ordered_by: string;
  ordered_at: string; stopped_by?: string; stopped_at?: string; note?: string;
};
export type CareAdministration = {
  id: string; stay_id: string; order_id?: string; slot_time?: string; item_name: string; dose?: string;
  performed_at: string; performed_by: string; note?: string;
};
export type CareNote = {
  id: string; stay_id: string; type: 'observation' | 'feeding' | 'hygiene' | 'note'; text: string; temp_c?: number;
  weight_kg?: number; author_id: string; at: string;
};
export type DiaryEntry = {
  id: string; stay_id: string; pet_id: string; status: 'draft' | 'shared' | 'withdrawn'; part_of_day: PartOfDay;
  category: DiaryCategory; general_status: GeneralStatus; text: string; author_id: string; created_at: string;
  shared_by?: string; shared_at?: string; withdrawn_by?: string; withdrawn_at?: string;
};
export type Video = {
  id: string; pet_id: string; customer_id: string; stay_id?: string; media_key: string; duration_s: number;
  caption?: string; recorded_at: string; uploaded_by: string; uploaded_at: string; expires_at: string;
  audio_removed: true; share_status: 'draft' | 'shared' | 'unshared'; shared_by?: string; shared_at?: string;
  deleted_at?: string; deleted_by?: string;
};

export type PriceItem = {
  id: string; code: string; category: PriceCategory; customer_group: CustomerGroup; name: string; unit: string;
  price: number; price_mode: 'fixed' | 'open'; active: boolean; updated_at: string; updated_by: string; version: number;
  /** Open-price items only: a hint the invoice editor pre-fills; never applied by the API. */
  reference_price?: number;
};
export type Invoice = {
  id: string; code: string; customer_id: string; pet_ids: string[]; source_type: 'appointment' | 'stay' | 'counter';
  source_id?: string; status: InvoiceStatus; discount?: { type: 'percent' | 'amount'; value: number; amount: number; reason: string };
  subtotal: number; total: number; note_customer?: string; issued_at?: string; issued_by?: string; voided_at?: string;
  voided_by?: string; void_reason_code?: string; void_reason_text?: string; replaces_invoice_id?: string;
  created_by: string; created_at: string; version: number;
};
export type InvoiceLine = {
  id: string; invoice_id: string; price_item_id: string; pet_id?: string; name_snapshot: string;
  category_snapshot: PriceCategory; customer_group_snapshot: CustomerGroup; unit_snapshot: string; unit_price: number;
  qty: number; line_total: number;
};
export type Payment = {
  id: string; code: string; invoice_id: string; amount: number; method: PaymentMethod; received_at: string;
  received_by: string; cash_given?: number; note?: string; reversed_at?: string; reversed_by?: string; reverse_reason?: string;
};

/** Kho: one row per medicine or supply; `qty` always equals the latest movement's `qty_after`. */
export type StockItem = {
  id: string; code: string; name: string; kind: 'thuoc' | 'vat_tu'; unit: string; qty: number; min_qty: number;
  expires_on?: string; active: boolean; version: number; created_at: string; created_by: string;
};
export type StockMove = {
  id: string; item_id: string; kind: 'in' | 'out' | 'adjust'; delta: number; qty_after: number;
  reason: 'nhap_hang' | 'dung_tai_phong' | 'hu_hong' | 'het_han' | 'kiem_ke' | 'khac';
  supplier?: string; note?: string; at: string; by: string; by_name: string;
};
/** Hỗ trợ: one ticket from a staff member; the reply is empty until someone with `support.inbox` answers. */
export type SupportTicket = {
  id: string; code: string; kind: SupportKind; title: string; body: string; screen?: string; status: SupportStatus;
  created_at: string; created_by: string; created_by_name: string; reply_text?: string; replied_by_name?: string; replied_at?: string; version: number;
};

/** Nội dung nổi bật: a retail product shown on the public intro page. `price_vnd` is kept but not sent publicly yet (rules/content FEATURED_SHOW_PRICE). */
export type FeaturedProduct = {
  id: string; name: string; category: FeaturedCategory; note?: string; price_vnd?: number; image_key?: string; visible: boolean; sample: boolean;
  created_at: string; created_by_name: string; updated_at: string; updated_by_name: string; version: number;
};
/** Nội dung nổi bật: a story shown on the public intro page; `pet_name` is a display name, not linked to any pet record. */
export type FeaturedCase = {
  id: string; title: string; story: string; pet_name: string; species: Species; image_key?: string; visible: boolean; sample: boolean;
  consent_by_name: string; consent_at: string; created_at: string; created_by_name: string; updated_at: string; updated_by_name: string; version: number;
};

/** Lời nhắn của khách trên trang giới thiệu (not a booking). `about`: the product the visitor asked about. */
export type Inquiry = {
  id: string; code: string; name: string; phone_e164: string; text: string; about?: string; status: InquiryStatus; created_at: string;
  created_by_account?: string; handled_by_name?: string; handled_at?: string; version: number;
};

/** Cài đặt C: one row, id `main`; reading merges the defaults under these values, so a missing row or key is the default. */
export type AppSettingsRow = { id: 'main'; version: number; values: AppSettingsValues };

/** Cài đặt B: only the keys the person changed; the role defaults are merged in at read time. */
export type StaffPrefsRow = { staff_id: string; values: StaffPrefsPatch };

export type AuditEvent = {
  id: string; at: string; actor_type: 'staff' | 'customer' | 'guest' | 'system'; actor_id?: string;
  actor_name_snapshot: string; action: string; entity_type: string; entity_id: string; summary_vi: string;
  reason?: string; sensitive: boolean;
};

export type Tables = {
  staff_users: StaffUser[]; web_accounts: WebAccount[]; account_pets: AccountPet[]; account_seen: AccountSeen[];
  customers: Customer[]; account_links: AccountLink[]; pet_links: PetLink[]; pets: Pet[];
  booking_requests: BookingRequest[]; request_events: RequestEvent[]; appointments: Appointment[]; reschedule_requests: RescheduleRequest[];
  cages: Cage[]; stays: Stay[]; care_orders: CareOrder[]; care_administrations: CareAdministration[];
  care_notes: CareNote[]; diary_entries: DiaryEntry[]; videos: Video[];
  price_items: PriceItem[]; invoices: Invoice[]; invoice_lines: InvoiceLine[]; payments: Payment[];
  stock_items: StockItem[]; stock_moves: StockMove[]; staff_prefs: StaffPrefsRow[]; app_settings: AppSettingsRow[]; support_tickets: SupportTicket[];
  featured_products: FeaturedProduct[]; featured_cases: FeaturedCase[]; inquiries: Inquiry[];
  audit_events: AuditEvent[];
};

export type Doc = {
  schemaVersion: typeof SCHEMA_VERSION; seededAt: string; dirty: boolean; rev: number;
  /** Unique per write (and per seed), so tabs tell documents apart even when their rev numbers match. */
  writeId?: string;
  counters: Record<CodePrefix, number>; t: Tables;
};

export const emptyTables = (): Tables => ({
  staff_users: [], web_accounts: [], account_pets: [], account_seen: [], customers: [], account_links: [], pet_links: [],
  pets: [], booking_requests: [], request_events: [], appointments: [], reschedule_requests: [], cages: [], stays: [], care_orders: [],
  care_administrations: [], care_notes: [], diary_entries: [], videos: [], price_items: [], invoices: [],
  invoice_lines: [], payments: [], stock_items: [], stock_moves: [], staff_prefs: [], app_settings: [], support_tickets: [],
  featured_products: [], featured_cases: [], inquiries: [], audit_events: [],
});
