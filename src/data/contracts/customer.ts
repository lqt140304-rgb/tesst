/** DTOs the customer zone receives. Built field by field from internal rows (never spread). */
import type { DiaryCategory, GeneralStatus, PartOfDay, PaymentState, RequestStatus, Service, Sex, Species, TimeSlot } from './enums';

export type CustomerPetCard = {
  id: string; name: string; species: Species; breed?: string; sex?: Sex; ageYears?: number; birthYear?: number; source: 'hospital' | 'web';
  /** "Điều Lê Sơn nên biết" — the customer's own note, web pets only. */
  note?: string;
  /** For PetAvatar (`petPhoto(key, size)`); absent → species icon. */
  photoKey?: string;
  /** From the hospital record; web pets have none. */
  weightKg?: number;
};
/** "Tình trạng chung": the latest shared diary line of each category (never "Lời nhắn"). */
export type CustomerPetCondition = { category: Exclude<DiaryCategory, 'loi_nhan'>; text: string; dateLabel: string };
export type CustomerPetInput = { name: string; species: Species; breed?: string; sex?: Sex; birth_year?: number; note?: string };

export type CustomerBookingRow = {
  id: string; kind: 'request' | 'appointment'; code?: string; status: RequestStatus; group: 'upcoming' | 'processing' | 'past';
  petName: string; service: Service; desiredDate?: string; preferredSlot?: TimeSlot; appointmentAt?: string; appointmentCancelled?: boolean;
  viaPhone: boolean; viaCounter: boolean; reminderSentAt?: string; canCallBack: boolean; rescheduledFrom?: string; createdAt: string;
  /** "Đang chờ đổi lịch": the customer's pending wish to move this appointment. */
  rescheduleRequest?: { desiredDate: string; preferredSlot?: TimeSlot; createdAt: string };
};
export type RescheduleInput = { desired_date: string; preferred_slot?: TimeSlot; reason?: string };
export type CustomerRequestDetail = CustomerBookingRow & {
  snapshot: { contact_name: string; phone: string; pet_name: string; species: Species; breed?: string; service: Service; desired_date: string; preferred_slot?: TimeSlot; note?: string };
  timeline: { label: string; at: string; tone: 'main' | 'side' | 'reminder' }[];
};

export type CustomerStayCard = {
  id: string; petName: string; species: Species; admittedAt: string; dayNumber: number; current: boolean; dischargedAt?: string;
  latestStatus?: GeneralStatus; updatedLabel?: string; latestText?: string; videoCount: number; photoKey?: string;
};
/** `date`: YYYY-MM-DD in Vietnam, for "Chọn ngày". */
export type CustomerDiaryEntry = { id: string; dayLabel: string; date: string; part_of_day: PartOfDay; category: DiaryCategory; general_status: GeneralStatus; text: string };
export type CustomerVideo = {
  id: string; petName: string; whenLabel: string; caption?: string; mediaKey: string;
  /** 0 = unknown length (show "—"). */
  durationS: number;
  /** Where playback stops (seconds, at most 15), always without sound. */
  clipEndS: number; daysLeft: number;
  tone: 'normal' | 'orange' | 'rose'; expiresDate: string; stayId?: string;
  /** Kept only on the browser it was uploaded from ("Chỉ lưu trên trình duyệt này"). */
  isLocal: boolean;
  /** YYYY-MM-DD (Vietnam) the video was recorded. */
  date: string;
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

/** One line in the bell (part 3): never a clock time, a medicine or a staff name. `unseen` = newer than the last time the bell was opened. */
export type CustomerUpdate = {
  id: string; kind: 'diary' | 'video' | 'request' | 'invoice'; text: string; dateLabel: string; partOfDay?: PartOfDay;
  target: { kind: 'stay' | 'request' | 'invoice'; id: string }; unseen: boolean;
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
    get(id: string): Promise<{ pet: CustomerPetCard; bookings: CustomerBookingRow[]; condition: CustomerPetCondition[] }>;
    create(input: CustomerPetInput): Promise<string>;
    /** Web pets only; hospital records are updated by staff. */
    update(id: string, input: CustomerPetInput): Promise<void>;
    remove(id: string): Promise<void>;
  };
  appointments: {
    list(): Promise<{ upcoming: CustomerBookingRow[]; processing: CustomerBookingRow[]; past: CustomerBookingRow[] }>;
    getRequest(id: string): Promise<CustomerRequestDetail>;
    callMeBack(requestId: string): Promise<void>;
    /** `id` is the row id (CustomerBookingRow.id); only an upcoming "Đã hẹn" appointment without a pending request. */
    requestReschedule(id: string, input: RescheduleInput): Promise<void>;
  };
  stays: {
    list(): Promise<{ current: CustomerStayCard[]; past: CustomerStayCard[] }>;
    get(id: string): Promise<{ stay: CustomerStayCard; diary: CustomerDiaryEntry[]; videos: CustomerVideo[] }>;
  };
  videos: { list(): Promise<CustomerVideo[]> };
  invoices: { list(): Promise<CustomerInvoiceRow[]>; get(id: string): Promise<CustomerInvoiceDetail> };
  /** The bell: at most 10 updates from the last 30 days, newest first. */
  updates: { list(): Promise<CustomerUpdate[]>; markAllSeen(): Promise<void> };
}
