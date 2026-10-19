import type { AppointmentSource, Service } from '../../contracts/enums';
import { pet, petCustomer, STAFF } from './accounts';
import type { SeedCtx } from './ctx';

type A = [day: number, hhmm: string, slug: string, service: Service, assignee: string | null, source: AppointmentSource, cancelled?: string];

const { duc, mai, ngocanh } = STAFF;
const LIST: A[] = [
  // Today (+ Mít 10:30 from YC-0232)
  [0, '08:00', 'bin', 'kham', mai, 'phone'], [0, '08:30', 'com', 'spa', ngocanh, 'walk_in'], [0, '09:00', 'map', 'kham', duc, 'phone'],
  [0, '14:00', 'oi', 'kham', duc, 'phone'], [0, '15:30', 'sushi', 'spa', ngocanh, 'phone'], [0, '17:00', 'bo', 'kham', duc, 'phone'],
  // Rest of the week (+ Lucky d+1, Bông d+2 from requests)
  [1, '11:00', 'bin', 'kham', mai, 'phone'], [1, '15:00', 'map', 'spa', ngocanh, 'phone'], [1, '16:00', 'com', 'kham', mai, 'phone'],
  [2, '09:00', 'sushi', 'kham', duc, 'phone'], [2, '16:30', 'mit', 'spa', ngocanh, 'walk_in'],
  [3, '09:00', 'milo', 'kham', duc, 'phone'], [3, '10:00', 'lucky', 'kham', null, 'phone'], [3, '14:00', 'oi', 'spa', ngocanh, 'phone'],
  [4, '10:00', 'kem', 'kham', duc, 'phone'], [4, '15:00', 'tom', 'spa', ngocanh, 'phone'],
  [5, '09:00', 'mit', 'spa', ngocanh, 'phone'], [5, '10:30', 'sushi', 'spa', ngocanh, 'phone'], [5, '14:00', 'bo', 'spa', ngocanh, 'phone'], [5, '16:00', 'na', 'kham', mai, 'phone'],
  [6, '10:00', 'su', 'kham', mai, 'phone'],
  // Past 7 days (+ Miu d−2, Kem d−1, Milo d−1 cancelled from requests)
  [-1, '09:30', 'bin', 'kham', mai, 'phone'], [-1, '14:00', 'com', 'spa', ngocanh, 'walk_in'], [-1, '11:00', 'gao', 'kham', mai, 'walk_in'],
  [-2, '10:00', 'sushi', 'spa', ngocanh, 'phone'], [-2, '15:00', 'oi', 'kham', duc, 'phone'],
  [-3, '09:00', 'lu', 'kham', mai, 'phone'], [-3, '16:00', 'map', 'spa', ngocanh, 'phone', 'Khách đã đặt lại qua điện thoại'],
  [-4, '08:30', 'bo', 'kham', duc, 'phone'], [-4, '10:00', 'mochi', 'kham', duc, 'phone'],
  [-5, '09:00', 'tom', 'kham', duc, 'walk_in'], [-5, '14:30', 'lucky', 'spa', ngocanh, 'phone'],
  [-6, '10:00', 'soi', 'kham', duc, 'phone'], [-6, '15:00', 'muop', 'kham', mai, 'phone'],
];

export function seedAppointments(c: SeedCtx): void {
  const { t } = c.doc;
  LIST.forEach(([day, hhmm, slug, service, assignee, source, cancelled], i) => {
    t.appointments.push({
      id: `apt-${i + 1}`, code: '', customer_id: petCustomer(slug), pet_id: pet(slug), service, start_at: c.d(day, hhmm),
      duration_min: service === 'spa' ? 60 : 30, assignee_id: assignee ?? undefined, status: cancelled ? 'cancelled' : 'scheduled',
      source, cancel_reason: cancelled, version: 1, created_by: STAFF.ha, created_at: c.d(Math.min(day, 0) - 2, '10:00'),
    });
  });
  // Human codes in chronological order.
  [...t.appointments].sort((a, b) => a.start_at.localeCompare(b.start_at)).forEach((a, i) => {
    a.code = `LH-${String(i + 1).padStart(4, '0')}`;
  });
  c.doc.counters.LH = t.appointments.length;
}
