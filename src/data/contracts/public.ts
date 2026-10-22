import type { FeaturedCategory, Service, Species, TimeSlot } from './enums';

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

/** What the intro page shows. No price (until the owner sends the price list), no consent, author, time or version. `sample`: show the label "Nội dung mẫu". */
export type PublicFeaturedProduct = { id: string; name: string; category: FeaturedCategory; note?: string; imageKey?: string; sample: boolean };
export type PublicFeaturedCase = { id: string; title: string; story: string; petName: string; species: Species; imageKey?: string; sample: boolean };

/** A message left on the intro page ("Hỏi mua" passes the product name in `about`). */
export type InquiryInput = { name: string; phone: string; text: string; about?: string };

export interface PublicApi {
  bookings: {
    submit(input: BookingInput): Promise<{ ok: true }>;
    /** Holidays from today on, sorted, dates only (the staff note is never sent). The hospital works until 19:00 on them: the slots that end after 19:00 (`18-20`, `20-21`) are refused on `preferred_slot`; `slotsOn(date, holidays)` (rules/booking) lists the slots to offer. */
    holidays(): Promise<string[]>;
  };
  inquiries: {
    /** A visitor or customer (staff are refused), also outside opening hours. The same message again while the first waits creates nothing but still answers ok; a phone number may leave 3 a day (the next gets a ValidationError on `text` that points to the hotline). */
    submit(input: InquiryInput): Promise<{ ok: true }>;
  };
  /** Anyone, signed in or not. Only the items that are shown, newest first. A picture is read with `media.local(imageKey)`. */
  featured: {
    products(): Promise<PublicFeaturedProduct[]>;
    cases(): Promise<PublicFeaturedCase[]>;
  };
}
