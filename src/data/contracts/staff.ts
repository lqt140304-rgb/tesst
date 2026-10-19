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
