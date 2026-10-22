import type { Service, Species, TimeSlot } from './enums';

/** Booking request form. For a logged-in customer, name and phone come from the account. */
export type BookingInput = {
  contact_name: string;
  phone: string;
  pet_name: string;
  species: Species;
  breed?: string;
  service: Service;
  desired_date: string;
  /** "Khung giờ (tùy chọn)". */
  preferred_slot?: TimeSlot;
  note?: string;
  /** Guests only; customers consented at sign-up. */
  consent: boolean;
  /** Logged-in: a pet from the linked hospital record. */
  pet_id?: string;
  /** Logged-in: a pet the customer added on the web. */
  account_pet_id?: string;
  /** Logged-in "+ Bé khác": also save the new pet to the profile. */
  save_pet?: boolean;
};

export interface PublicApi {
  bookings: {
    submit(input: BookingInput): Promise<{ ok: true }>;
    /** Days from today on when the hospital is closed, sorted, dates only (the staff note is never sent). Booking or asking to move onto one is refused on `desired_date`. */
    closedDays(): Promise<string[]>;
  };
}
