/** DTOs the customer zone receives. Built field by field from internal rows (never spread). */
import type { DiaryCategory, GeneralStatus, PartOfDay, PaymentState, RequestStatus, Service, Sex, Species } from './enums';

export type CustomerPetCard = {
  id: string; name: string; species: Species; breed?: string; sex?: Sex; ageYears?: number; birthYear?: number; source: 'hospital' | 'web';
  /** "Điều Lê Sơn nên biết" — the customer's own note, web pets only. */
  note?: string;
};
export type CustomerPetInput = { name: string; species: Species; breed?: string; sex?: Sex; birth_year?: number; note?: string };

export type CustomerBookingRow = {
  id: string; kind: 'request' | 'appointment'; code?: string; status: RequestStatus; group: 'upcoming' | 'processing' | 'past';
  petName: string; service: Service; desiredDate?: string; appointmentAt?: string; appointmentCancelled?: boolean;
  viaPhone: boolean; viaCounter: boolean; reminderSentAt?: string; canCallBack: boolean; rescheduledFrom?: string; createdAt: string;
};
export type CustomerRequestDetail = CustomerBookingRow & {
  snapshot: { contact_name: string; phone: string; pet_name: string; species: Species; breed?: string; service: Service; desired_date: string; note?: string };
  timeline: { label: string; at: string; tone: 'main' | 'side' | 'reminder' }[];
};

export type CustomerStayCard = {
  id: string; petName: string; species: Species; admittedAt: string; dayNumber: number; current: boolean; dischargedAt?: string;
  latestStatus?: GeneralStatus; updatedLabel?: string; latestText?: string; videoCount: number;
};
export type CustomerDiaryEntry = { id: string; dayLabel: string; part_of_day: PartOfDay; category: DiaryCategory; general_status: GeneralStatus; text: string };
export type CustomerVideo = {
  id: string; petName: string; whenLabel: string; caption?: string; mediaKey: string; durationS: number; daysLeft: number;
  tone: 'normal' | 'orange' | 'rose'; expiresDate: string; stayId?: string;
};

export type CustomerInvoiceRow = { id: string; code: string; issuedAt: string; petNames: string[]; summary: string; total: number; paid: number; remaining: number; state: PaymentState };
export type CustomerInvoiceDetail = CustomerInvoiceRow & {
  customerName: string; phoneMasked: string; subtotal: number; discount?: { label: string; amount: number }; note?: string;
  lines: { label: string; qty: number | null; unitPrice: number | null; total: number; note?: string }[];
  payments: { dateLabel: string; methodLabel: string }[];
};

export type CustomerAccount = { username: string; display_name: string; phone: string; salutation: 'anh' | 'chi' | 'ban'; linkCode: string; linked: boolean; linkedAt?: string; createdAt: string };

export type CustomerOverview = {
  greetingName: string; salutation: 'anh' | 'chi' | 'ban'; linked: boolean; linkCode: string; activeStays: CustomerStayCard[];
  nextAppointment?: CustomerBookingRow; processingCount: number; unpaid: { count: number; remaining: number }; pets: CustomerPetCard[];
  /** Dismissed one-time cards ("welcome", "linked"). */
  seen: string[]; accountCreatedAt: string; linkedAt?: string;
};

export interface CustomerApi {
  overview(): Promise<CustomerOverview>;
  markSeen(key: string): Promise<void>;
  account: {
    get(): Promise<CustomerAccount>;
    update(input: { display_name?: string; salutation?: 'anh' | 'chi' | 'ban' }): Promise<void>;
    changePassword(input: { current: string; password: string; password2: string }): Promise<void>;
  };
  pets: {
    list(): Promise<CustomerPetCard[]>;
    get(id: string): Promise<{ pet: CustomerPetCard; bookings: CustomerBookingRow[] }>;
    create(input: CustomerPetInput): Promise<string>;
    /** Web pets only; hospital records are updated by staff. */
    update(id: string, input: CustomerPetInput): Promise<void>;
    remove(id: string): Promise<void>;
  };
  appointments: {
    list(): Promise<{ upcoming: CustomerBookingRow[]; processing: CustomerBookingRow[]; past: CustomerBookingRow[] }>;
    getRequest(id: string): Promise<CustomerRequestDetail>;
    callMeBack(requestId: string): Promise<void>;
  };
  stays: {
    list(): Promise<{ current: CustomerStayCard[]; past: CustomerStayCard[] }>;
    get(id: string): Promise<{ stay: CustomerStayCard; diary: CustomerDiaryEntry[]; videos: CustomerVideo[] }>;
  };
  videos: { list(): Promise<CustomerVideo[]> };
  invoices: { list(): Promise<CustomerInvoiceRow[]>; get(id: string): Promise<CustomerInvoiceDetail> };
}
