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
