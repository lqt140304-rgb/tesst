import type { CallOutcome, RequestSnapshot, RequestStatus, Service, Species } from '../../contracts/enums';
import { dedupeKey } from '../../rules/dedupe';
import type { Appointment, BookingRequest, RequestEvent } from '../store/schema';
import { acc, cus, pet, STAFF } from './accounts';
import { phone, type SeedCtx } from './ctx';

type Ev = { at: string; to?: RequestStatus; call?: CallOutcome; note?: string; by?: string; reason_code?: string; reason_text?: string };
type ReqSeed = {
  code: string; created: string; account?: string; name: string; phoneN: number; petName: string; species: Species;
  breed?: string; service: Service; desired: number; note?: string; accountPet?: string; petSlug?: string;
  handler?: string; events: Ev[]; flagAgo?: number;
  appointment?: { day: number; hhmm: string; assignee: string; duration: number; cancelled?: string };
};

export function seedRequests(c: SeedCtx): void {
  const { d, ago } = c;
  const H = STAFF.ha, DUC = STAFF.duc;
  const R: ReqSeed[] = [
    { code: 'YC-0225', created: d(-9, '10:12'), name: 'Khách thử', phoneN: 99, petName: 'Mèo', species: 'cat', service: 'kham', desired: -7,
      events: [{ at: d(-9, '10:40'), to: 'rejected', by: H, reason_code: 'thong_tin_khong_hop_le', reason_text: 'Tên và số điện thoại là nội dung thử' }] },
    { code: 'YC-0226', created: d(-7, '14:30'), name: 'Cao Minh Tuấn', phoneN: 14, petName: 'Milo', species: 'dog', breed: 'Bắc Kinh lai', service: 'spa', desired: -1, petSlug: 'milo', handler: H,
      events: [{ at: d(-7, '15:00'), to: 'contacting', by: H }, { at: d(-7, '15:05'), call: 'talked', by: H, note: 'Khách chốt 10:00 hôm trước ngày mong muốn.' }, { at: d(-7, '15:06'), to: 'confirmed', by: H }, { at: d(-2, '17:20'), to: 'cancelled', by: H, reason_code: 'khach_bao_khong_den' }],
      appointment: { day: -1, hhmm: '10:00', assignee: STAFF.ngocanh, duration: 60, cancelled: 'Khách báo không đến' } },
    { code: 'YC-0227', created: d(-4, '07:58'), name: 'Nguyễn Thị Lan', phoneN: 1, petName: 'Miu', species: 'cat', breed: 'Mèo ta lông vàng', service: 'kham', desired: -2,
      events: [{ at: d(-4, '08:30'), to: 'rejected', by: H, reason_code: 'trung_yeu_cau', reason_text: 'Trùng với YC-0228' }] },
    { code: 'YC-0228', created: d(-4, '08:06'), account: 'lan_nguyen', name: 'Nguyễn Thị Lan', phoneN: 1, petName: 'Miu', species: 'cat', breed: 'Mèo ta lông vàng', service: 'kham', desired: -2, petSlug: 'miu', handler: H,
      note: 'Bé nôn hai lần từ tối qua, ăn ít.',
      events: [{ at: d(-4, '08:31'), to: 'contacting', by: H }, { at: d(-4, '08:35'), call: 'talked', by: H, note: 'Hẹn 9 giờ sáng.' }, { at: d(-4, '08:36'), to: 'confirmed', by: H }],
      appointment: { day: -2, hhmm: '09:00', assignee: STAFF.mai, duration: 30 } },
    { code: 'YC-0229', created: d(-3, '19:20'), account: 'hoang_long', name: 'Vũ Hoàng Long', phoneN: 3, petName: 'Mochi', species: 'dog', breed: 'Poodle', service: 'spa', desired: 1, petSlug: 'mochi',
      events: [{ at: d(-2, '08:15'), to: 'cancelled', by: H, reason_code: 'ke_hoach_khac' }] },
    { code: 'YC-0230', created: d(-3, '20:05'), account: 'thuy_pham', name: 'Phạm Thu Thủy', phoneN: 2, petName: 'Kem', species: 'dog', breed: 'Golden Retriever', service: 'kham', desired: -1, petSlug: 'kem', handler: DUC,
      note: 'Bé đi ngoài lỏng hai ngày nay.',
      events: [{ at: d(-2, '08:40'), to: 'contacting', by: DUC }, { at: d(-2, '08:45'), call: 'talked', by: DUC }, { at: d(-2, '08:46'), to: 'confirmed', by: DUC }],
      appointment: { day: -1, hhmm: '16:00', assignee: STAFF.duc, duration: 30 } },
    { code: 'YC-0231', created: d(-2, '09:40'), name: 'Lý Thu Trang', phoneN: 13, petName: 'Lucky', species: 'dog', breed: 'Shih Tzu', service: 'spa', desired: 1, petSlug: 'lucky', handler: H,
      events: [{ at: d(-2, '10:00'), to: 'contacting', by: H }, { at: d(-2, '10:03'), call: 'talked', by: H }, { at: d(-2, '10:04'), to: 'confirmed', by: H }],
      appointment: { day: 1, hhmm: '09:30', assignee: STAFF.ngocanh, duration: 60 } },
    { code: 'YC-0232', created: d(-2, '11:15'), name: 'Lê Thị Hồng Nhung', phoneN: 7, petName: 'Mít', species: 'dog', breed: 'Phốc sóc', service: 'kham', desired: 1, petSlug: 'mit', handler: H,
      events: [{ at: d(-2, '11:30'), to: 'contacting', by: H }, { at: d(-2, '11:34'), call: 'talked', by: H, note: 'Khách muốn khám sớm hơn, chốt sáng hôm nay.' }, { at: d(-2, '11:35'), to: 'confirmed', by: H }],
      appointment: { day: 0, hhmm: '10:30', assignee: STAFF.mai, duration: 30 } },
    { code: 'YC-0233', created: d(-2, '15:50'), name: 'Nguyễn Văn Bình', phoneN: 20, petName: 'Lạc', species: 'dog', breed: 'Chó ta', service: 'spa', desired: 5, handler: H,
      events: [{ at: d(-2, '16:10'), to: 'contacting', by: H }, { at: d(-2, '16:11'), call: 'no_answer', by: H }, { at: d(-1, '09:00'), call: 'no_answer', by: H }, { at: d(-1, '14:00'), call: 'busy', by: H }, { at: d(-1, '14:01'), to: 'unreachable', by: H }] },
    { code: 'YC-0234', created: d(-1, '08:20'), name: 'Đặng Văn Tùng', phoneN: 10, petName: 'Đậu', species: 'dog', breed: 'Chó ta', service: 'kham', desired: 1, petSlug: 'dau', handler: H,
      events: [{ at: d(-1, '09:10'), to: 'contacting', by: H }, { at: d(-1, '09:11'), call: 'no_answer', by: H }, { at: d(-1, '15:30'), call: 'busy', by: H }, { at: d(-1, '15:31'), to: 'unreachable', by: H }],
      flagAgo: 35 },
    { code: 'YC-0235', created: d(-1, '09:05'), account: 'lan_nguyen', name: 'Nguyễn Thị Lan', phoneN: 1, petName: 'Bông', species: 'dog', breed: 'Poodle', service: 'spa', desired: 2, petSlug: 'bong', handler: H,
      events: [{ at: d(-1, '09:30'), to: 'contacting', by: H }, { at: d(-1, '09:32'), call: 'talked', by: H }, { at: d(-1, '09:33'), to: 'confirmed', by: H }],
      appointment: { day: 2, hhmm: '15:00', assignee: STAFF.ngocanh, duration: 60 } },
    { code: 'YC-0236', created: d(-1, '10:30'), name: 'Ngô Thanh Hương', phoneN: 9, petName: 'Na', species: 'cat', breed: 'Mèo Scottish tai cụp', service: 'kham', desired: 3, petSlug: 'na', handler: H,
      events: [{ at: ago(20), to: 'contacting', by: H }] },
    { code: 'YC-0237', created: d(-1, '13:10'), name: 'Bùi Quang Huy', phoneN: 8, petName: 'Sói', species: 'dog', breed: 'Husky', service: 'spa', desired: 1, petSlug: 'soi', handler: DUC,
      events: [{ at: d(-1, '16:00'), to: 'contacting', by: DUC }, { at: d(-1, '16:04'), call: 'talked', by: DUC, note: 'Đã trao đổi — khách cân nhắc giờ chiều, chờ khách chốt.' }] },
    { code: 'YC-0238', created: d(-1, '16:45'), account: 'ngoc_tran', name: 'Trần Bảo Ngọc', phoneN: 4, petName: 'Su', species: 'cat', breed: 'Mèo Anh lông ngắn', service: 'kham', desired: 2, petSlug: 'su', handler: H,
      events: [{ at: d(-1, '17:10'), to: 'contacting', by: H }, { at: d(-1, '17:12'), call: 'call_back_later', by: H, note: 'Khách hẹn gọi lại — đang họp, gọi lại sau 11 giờ.' }] },
    { code: 'YC-0239', created: d(-1, '18:00'), name: 'Phan Đức Anh', phoneN: 12, petName: 'Mướp', species: 'cat', breed: 'Mèo ta', service: 'kham', desired: 2, petSlug: 'muop', handler: H,
      events: [{ at: ago(65), to: 'contacting', by: H }, { at: ago(60), call: 'no_answer', by: H }, { at: ago(59), to: 'unreachable', by: H }] },
    { code: 'YC-0240', created: d(-1, '21:40'), name: 'Cao Minh Tuấn', phoneN: 14, petName: 'Milo', species: 'dog', breed: 'Bắc Kinh lai', service: 'kham', desired: 1, note: 'Bé ho nhiều về đêm', events: [] },
    { code: 'YC-0241', created: d(-1, '22:10'), account: 'lan_nguyen', name: 'Nguyễn Thị Lan', phoneN: 1, petName: 'Bông', species: 'dog', breed: 'Poodle', service: 'kham', desired: 4, petSlug: 'bong', note: 'Tiêm nhắc lại theo lịch', events: [] },
    { code: 'YC-0242', created: ago(120), name: 'Trịnh Mai Phương', phoneN: 11, petName: 'Tôm', species: 'dog', breed: 'Pug', service: 'kham', desired: 1, note: 'Bé hay thở khò khè khi ngủ', events: [] },
    { code: 'YC-0243', created: ago(55), account: 'maianh_do', name: 'Đỗ Mai Anh', phoneN: 19, petName: 'Bắp', species: 'dog', breed: 'Corgi', service: 'spa', desired: 3, accountPet: 'apet-bap', events: [] },
    { code: 'YC-0244', created: ago(12), name: 'Lý Thu Trang', phoneN: 13, petName: 'Xoài', species: 'cat', breed: 'Mèo Munchkin', service: 'kham', desired: 2, note: 'Bé bỏ ăn từ hôm qua', events: [] },
    { code: 'YC-0245', created: d(-1, '19:30'), account: 'minh_khoa', name: 'Đỗ Minh Khoa', phoneN: 6, petName: 'Gạo', species: 'cat', breed: 'Mèo mướp trắng', service: 'spa', desired: 4, accountPet: 'apet-gao', handler: H,
      events: [{ at: ago(95), to: 'contacting', by: H }, { at: ago(90), call: 'no_answer', by: H }, { at: ago(89), to: 'unreachable', by: H }] },
  ];

  const { t } = c.doc;
  for (const r of R) {
    const snapshot: RequestSnapshot = {
      contact_name: r.name, phone_e164: phone(r.phoneN), pet_name: r.petName, species: r.species, breed: r.breed,
      service: r.service, desired_date: c.d(r.desired, '00:00').slice(0, 10), note: r.note, account_pet_id: r.accountPet,
    };
    const scope = r.account ? { kind: 'account' as const, accountId: acc(r.account) } : { kind: 'guest' as const };
    const id = `req-${r.code}`;
    let status: RequestStatus = 'pending';
    const events: RequestEvent[] = [{ id: `${id}-e0`, request_id: id, type: 'created', to_status: 'pending', actor_type: r.account ? 'customer' : 'guest', actor_id: r.account ? acc(r.account) : undefined, at: r.created }];
    r.events.forEach((e, i) => {
      if (e.call) {
        events.push({ id: `${id}-e${i + 1}`, request_id: id, type: 'call', call_outcome: e.call, note: e.note, actor_type: 'staff', actor_id: e.by, at: e.at });
      } else if (e.to) {
        events.push({ id: `${id}-e${i + 1}`, request_id: id, type: 'status_change', from_status: status, to_status: e.to, reason_code: e.reason_code, reason_text: e.reason_text, actor_type: 'staff', actor_id: e.by, at: e.at });
        status = e.to;
      }
    });
    const req: BookingRequest = {
      id, code: r.code, scope: r.account ? 'account' : 'guest', account_id: r.account ? acc(r.account) : undefined, snapshot,
      dedupe_key: dedupeKey(scope, snapshot), status, handler_id: r.handler, version: events.length,
      created_at: r.created, updated_at: events[events.length - 1]!.at,
      customer_id: r.petSlug && r.appointment ? cusOf(t.pets, r.petSlug) : undefined,
      pet_id: r.petSlug && r.appointment ? pet(r.petSlug) : undefined,
    };
    if (r.flagAgo !== undefined) {
      req.resubmit_flag_at = c.ago(r.flagAgo);
      events.push({ id: `${id}-flag`, request_id: id, type: 'resubmit', actor_type: 'guest', at: req.resubmit_flag_at });
    }
    if (r.appointment && r.petSlug) {
      const a = r.appointment;
      const apt: Appointment = {
        id: `apt-${r.code}`, code: '', customer_id: cusOf(t.pets, r.petSlug), pet_id: pet(r.petSlug), service: r.service,
        start_at: c.d(a.day, a.hhmm), duration_min: a.duration, assignee_id: a.assignee, status: a.cancelled ? 'cancelled' : 'scheduled',
        source: 'web_request', request_id: id, cancel_reason: a.cancelled, version: 1, created_by: r.handler ?? STAFF.ha,
        created_at: events.find((e) => e.to_status === 'confirmed')?.at ?? r.created,
      };
      t.appointments.push(apt);
      req.appointment_id = apt.id;
    }
    t.booking_requests.push(req);
    t.request_events.push(...events);
  }
  c.doc.counters.YC = 245;
}

function cusOf(pets: { id: string; customer_id: string }[], slug: string): string {
  return pets.find((p) => p.id === pet(slug))?.customer_id ?? cus(0);
}
