import type { DiaryCategory, GeneralStatus, InternalStatus } from '../../contracts/enums';
import type { DemoClip } from '../../contracts/staff';
import { partOfDay, toIsoVN } from '../../../lib/dates';
import { videoExpiresAt } from '../../rules/video-expiry';
import type { CareOrder } from '../store/schema';
import { appendAudit } from '../audit';
import { pet, petCustomer, STAFF } from './accounts';
import type { SeedCtx } from './ctx';

const CAGES: [string, string, 'dog' | 'cat' | 'any'][] = [
  ['C1', 'Khu chó', 'dog'], ['C2', 'Khu chó', 'dog'], ['C3', 'Khu chó', 'dog'], ['C4', 'Khu chó', 'dog'], ['C5', 'Khu chó', 'dog'], ['C6', 'Khu chó', 'dog'],
  ['M1', 'Khu mèo', 'cat'], ['M2', 'Khu mèo', 'cat'], ['M3', 'Khu mèo', 'cat'], ['M4', 'Khu mèo', 'cat'],
  ['R1', 'Phòng riêng', 'any'], ['R2', 'Phòng riêng', 'any'],
];
export const cage = (code: string) => `cage-${code}`;

/** Bundled clips staff may attach to any stay ("Video minh họa"). Durations match the files. */
export const DEMO_CLIPS: DemoClip[] = [
  { key: 'demo:v1-mieu-an-sang', label: 'Mèo ăn sáng', duration_s: 10 },
  { key: 'demo:v2-mieu-suoi-nang', label: 'Mèo sưởi nắng', duration_s: 10 },
  { key: 'demo:v3-mieu-nghi', label: 'Mèo chợp mắt', duration_s: 8 },
  { key: 'demo:v4-kem-uong-nuoc', label: 'Chó uống nước', duration_s: 10 },
  { key: 'demo:v5-gao', label: 'Mèo nằm nghỉ', duration_s: 8 },
  { key: 'demo:v6-bo-spa', label: 'Chó sau khi tắm sấy', duration_s: 10 },
];
export const stay = (code: string) => `stay-${code}`;

type OrderSeed = [kind: CareOrder['kind'], item: string, dose: string, route: string, times: string[], skipToday?: string[]];
type StaySeed = {
  code: string; slug: string; cage: string | null; admitted: string; doctor: string; status: InternalStatus; reason: string;
  expected?: string; discharged?: string; orders: OrderSeed[]; notes: [string, 'observation' | 'feeding' | 'hygiene' | 'note', string, string][];
};

export function seedInpatient(c: SeedCtx): void {
  const { t } = c.doc;
  const { d, ago } = c;
  CAGES.forEach(([code, zone, hint]) => t.cages.push({ id: cage(code), code, zone, species_hint: hint, active: true }));

  const STAYS: StaySeed[] = [
    { code: 'NT-0041', slug: 'miu', cage: 'M2', admitted: d(-2, '10:30'), doctor: STAFF.mai, status: 'stable', reason: 'Nôn, mất nước nhẹ; theo dõi tiêu hóa.',
      orders: [['fluid', 'Dịch truyền NaCl 0,9%', '150 ml', 'Tĩnh mạch', ['08:00', '20:00']], ['drug', 'Kháng sinh tiêm', '0,5 ml', 'Dưới da', ['08:00']], ['drug', 'Giảm đau đường uống', '½ viên', 'Uống', ['08:00', '20:00']]],
      notes: [[d(-2, '14:00'), 'observation', 'Nhiệt độ 39,4°C, niêm mạc hơi khô.', STAFF.mai], [d(-1, '08:30'), 'feeding', 'Ăn 1/2 phần pate, uống nước tốt.', STAFF.ngocanh], [d(-1, '20:30'), 'observation', 'Hết nôn từ trưa, đi lại bình thường.', STAFF.mai], [ago(80), 'hygiene', 'Vệ sinh khay cát, thay đệm.', STAFF.ngocanh]] },
    { code: 'NT-0044', slug: 'kem', cage: 'C4', admitted: ago(180), doctor: STAFF.duc, status: 'watch', reason: 'Tiêu chảy, theo dõi mất nước.',
      orders: [['fluid', 'Ringer lactat', '250 ml', 'Tĩnh mạch', ['10:00', '16:00', '22:00']], ['drug', 'Men tiêu hóa', '1 gói', 'Uống', ['12:00', '18:00'], ['12:00']]],
      notes: [[ago(170), 'observation', 'Phân lỏng, tỉnh táo, nhiệt độ 38,9°C.', STAFF.duc]] },
    { code: 'NT-0039', slug: 'mochi', cage: 'C1', admitted: d(-4, '11:00'), doctor: STAFF.duc, status: 'stable', reason: 'Viêm da có nhiễm trùng thứ phát.', expected: d(1, '10:00'),
      orders: [['drug', 'Kháng sinh đường uống', '1 viên', 'Uống', ['08:00', '20:00']]],
      notes: [[d(-3, '09:00'), 'observation', 'Vùng da tổn thương khô hơn.', STAFF.duc], [d(-1, '10:00'), 'hygiene', 'Tắm thuốc theo chỉ định.', STAFF.ngocanh]] },
    { code: 'NT-0040', slug: 'lu', cage: 'C3', admitted: d(-3, '09:45'), doctor: STAFF.mai, status: 'critical', reason: 'Nghi viêm dạ dày ruột cấp, nôn nhiều, mất nước nặng.',
      orders: [['fluid', 'Dịch truyền Ringer lactat', '300 ml', 'Tĩnh mạch', ['08:00', '14:00', '20:00']], ['drug', 'Thuốc chống nôn', '0,4 ml', 'Dưới da', ['08:00']], ['drug', 'Kháng sinh tiêm tĩnh mạch', '1 ml', 'Tĩnh mạch', ['08:00', '20:00']]],
      notes: [[d(-3, '10:30'), 'observation', 'Nhiệt độ 40,1°C, mất nước khoảng 8%.', STAFF.mai], [d(-2, '09:00'), 'observation', 'Còn nôn một lần trong đêm.', STAFF.mai], [d(-1, '09:00'), 'note', 'Gọi chủ nuôi báo tình hình, chủ đồng ý tiếp tục điều trị.', STAFF.ha]] },
    { code: 'NT-0043', slug: 'gao', cage: 'M4', admitted: d(-1, '11:40'), doctor: STAFF.mai, status: 'watch', reason: 'Viêm kết mạc, rối loạn tiêu hóa nhẹ.',
      orders: [['drug', 'Men tiêu hóa', '½ gói', 'Uống', ['08:00', '18:00']], ['drug', 'Thuốc nhỏ mắt', '1 giọt', 'Nhỏ mắt', ['08:00', '14:00', '20:00']]],
      notes: [[d(-1, '15:00'), 'observation', 'Mắt bớt đỏ, ăn được hạt mềm.', STAFF.mai]] },
    { code: 'NT-0035', slug: 'bo', cage: null, admitted: d(-58, '09:00'), doctor: STAFF.duc, status: 'stable', reason: 'Theo dõi sau thủ thuật.', discharged: d(-52, '16:00'), orders: [], notes: [] },
    { code: 'NT-0031', slug: 'su', cage: null, admitted: d(-75, '10:00'), doctor: STAFF.mai, status: 'stable', reason: 'Theo dõi tiêu hóa.', discharged: d(-70, '17:00'), orders: [], notes: [] },
  ];

  const nowMs = c.now.getTime();
  for (const s of STAYS) {
    const sid = stay(s.code);
    t.stays.push({
      id: sid, code: s.code, pet_id: pet(s.slug), customer_id: petCustomer(s.slug), cage_id: s.cage ? cage(s.cage) : cage('R2'),
      doctor_id: s.doctor, admitted_at: s.admitted, admitted_by: s.doctor, reason_internal: s.reason, internal_status: s.status,
      expected_discharge_at: s.expected, discharged_at: s.discharged, discharged_by: s.discharged ? s.doctor : undefined, version: 1,
    });
    s.orders.forEach(([kind, item, dose, route, times, skipToday], i) => {
      const oid = `${sid}-o${i + 1}`;
      t.care_orders.push({ id: oid, stay_id: sid, kind, item_name: item, dose, route, schedule_times: times, start_date: s.admitted.slice(0, 10), status: 'active', ordered_by: s.doctor, ordered_at: s.admitted });
      // Administrations for every scheduled slot between admission and now (some of today's skipped on purpose).
      for (let day = -5; day <= 0; day++) {
        for (const hhmm of times) {
          const slot = c.d(day, hhmm);
          const ms = new Date(slot).getTime();
          if (ms < new Date(s.admitted).getTime() || ms > nowMs) continue;
          if (day === 0 && skipToday?.includes(hhmm)) continue;
          t.care_administrations.push({ id: `${oid}-a${day}-${hhmm}`, stay_id: sid, order_id: oid, slot_time: hhmm, item_name: item, dose, performed_at: toIsoVN(new Date(ms + 7 * 60_000)), performed_by: day % 2 === 0 ? s.doctor : STAFF.ngocanh });
        }
      }
    });
    s.notes.forEach(([at, type, text, author], i) => t.care_notes.push({ id: `${sid}-n${i + 1}`, stay_id: sid, type, text, author_id: author, at }));
  }
  c.doc.counters.NT = 44;

  type D = [stayCode: string, slug: string, at: string, status: GeneralStatus, cat: DiaryCategory, text: string, author: string, shared: boolean];
  const DIARY: D[] = [
    ['NT-0041', 'miu', d(-2, '20:40'), 'watch', 'tinh_than', 'Miu đã ở phòng nội trú, được giữ ấm và nằm nghỉ. Bé còn hơi mệt nên Lê Sơn sẽ để ý bé sát hơn trong đêm nay.', STAFF.mai, true],
    ['NT-0041', 'miu', d(-1, '15:30'), 'recovering', 'an_uong', 'Miu đã ăn được nửa phần pate buổi trưa và tự uống nước. Bé tỉnh táo hơn, rất thích được vuốt nhẹ ở đầu.', STAFF.mai, true],
    ['NT-0041', 'miu', ago(70), 'stable', 'nghi_ngoi', 'Miu ngủ ngon, dậy vươn vai rồi đi dạo quanh chuồng. Lê Sơn sẽ cập nhật tiếp cho bạn vào buổi sau.', STAFF.mai, true],
    ['NT-0039', 'mochi', d(-4, '19:00'), 'watch', 'tinh_than', 'Mochi hơi lạ chỗ nên còn rụt rè, bé đã chịu nằm trên đệm mềm.', STAFF.duc, true],
    ['NT-0039', 'mochi', d(-3, '18:30'), 'recovering', 'an_uong', 'Mochi ăn hết phần cơm tối, vẫy đuôi khi các bạn ở Lê Sơn đến thăm.', STAFF.duc, true],
    ['NT-0039', 'mochi', d(-2, '11:00'), 'recovering', 'van_dong', 'Mochi được đi dạo ngắn trong sân, bé đi lại nhanh nhẹn.', STAFF.duc, true],
    ['NT-0039', 'mochi', d(-1, '17:00'), 'stable', 'nghi_ngoi', 'Bộ lông của Mochi mượt hơn hẳn, bé ngủ ngon cả buổi chiều.', STAFF.duc, true],
    ['NT-0039', 'mochi', ago(40), 'ready_home', 'loi_nhan', 'Mochi đã sẵn sàng về nhà. Lê Sơn sẽ gọi bạn để hẹn giờ đón bé nhé.', STAFF.ngocanh, false],
    ['NT-0043', 'gao', d(-1, '19:10'), 'watch', 'tinh_than', 'Gạo đã quen phòng, bé nằm cạnh cửa sổ và ăn được ít hạt mềm. Lê Sơn đang theo dõi thêm cho bé.', STAFF.mai, true],
  ];
  DIARY.forEach(([code, slug, atIso, status, category, text, author, shared], i) => {
    t.diary_entries.push({
      id: `diary-${i + 1}`, stay_id: stay(code), pet_id: pet(slug), status: shared ? 'shared' : 'draft', part_of_day: partOfDay(atIso),
      category, general_status: status, text, author_id: author, created_at: atIso, shared_by: shared ? author : undefined, shared_at: shared ? atIso : undefined,
    });
  });

  type V = [id: string, slug: string, stayCode: string, mediaKey: string, duration: number, caption: string, uploaded: string, by: string, share: 'draft' | 'shared', deleted?: string];
  const VIDEOS: V[] = [
    ['V1', 'miu', 'NT-0041', 'demo:v1-mieu-an-sang', 10, 'Miu ăn sáng ngon lành', d(-1, '08:10'), STAFF.mai, 'shared'],
    ['V2', 'miu', 'NT-0041', 'demo:v2-mieu-suoi-nang', 10, 'Miu nằm sưởi nắng bên cửa sổ', ago(120), STAFF.ngocanh, 'shared'],
    ['V3', 'miu', 'NT-0041', 'demo:v3-mieu-nghi', 8, 'Miu chợp mắt sau bữa ăn', ago(10), STAFF.ngocanh, 'draft'],
    ['V4', 'kem', 'NT-0044', 'demo:v4-kem-uong-nuoc', 10, 'Kem đã chịu uống nước', ago(60), STAFF.duc, 'shared'],
    ['V5', 'gao', 'NT-0043', 'demo:v5-gao', 8, 'Gạo nằm nghỉ cạnh cửa sổ', d(-1, '17:20'), STAFF.mai, 'shared'],
    ['V6', 'bo', 'NT-0035', 'demo:v6-bo-spa', 10, 'Bơ được tắm sấy thơm tho trước ngày về', d(-57, '10:00'), STAFF.ngocanh, 'shared'],
    ['V7', 'su', 'NT-0031', 'demo:v6-bo-spa', 10, 'Su nghỉ ngơi', d(-72, '10:00'), STAFF.mai, 'shared', d(-12, '10:00')],
  ];
  for (const [id, slug, stayCode, mediaKey, duration, caption, uploaded, by, share, deleted] of VIDEOS) {
    const sharer = share === 'shared' ? (by === STAFF.ngocanh ? STAFF.mai : by) : undefined;
    t.videos.push({
      id: `video-${id}`, pet_id: pet(slug), customer_id: petCustomer(slug), stay_id: stay(stayCode), media_key: mediaKey, duration_s: duration,
      caption, recorded_at: uploaded, uploaded_by: by, uploaded_at: uploaded, expires_at: videoExpiresAt(uploaded), audio_removed: true,
      share_status: share, shared_by: sharer, shared_at: share === 'shared' ? uploaded : undefined, deleted_at: deleted, deleted_by: deleted ? 'system' : undefined,
    });
  }
  seedStayAudit(c);
}

/** What staff did on each seeded stay, so "Lịch sử" is not empty. Per-slot administrations are left out (too many rows). */
function seedStayAudit(c: SeedCtx): void {
  const { doc } = c;
  const { t } = doc;
  const name = (id: string) => t.staff_users.find((u) => u.id === id)!.display_name;
  const log = (at: string, actor: string, action: string, entity_type: 'stay' | 'video', entity_id: string, summary: string, sensitive = false) =>
    appendAudit(doc, c.now, { at, actor_type: 'staff', actor_id: actor, actor_name_snapshot: name(actor), action, entity_type, entity_id, summary_vi: `${name(actor)} ${summary}`, sensitive });
  for (const s of t.stays) {
    const petName = t.pets.find((p) => p.id === s.pet_id)!.name;
    const cageCode = t.cages.find((x) => x.id === s.cage_id)!.code;
    log(s.admitted_at, s.admitted_by, 'stay.admit', 'stay', s.id, `nhập viện ${petName} vào chuồng ${cageCode} (${s.code})`);
    for (const o of t.care_orders.filter((x) => x.stay_id === s.id)) log(o.ordered_at, o.ordered_by, 'order.create', 'stay', s.id, `thêm y lệnh cho ${s.code}`);
    for (const n of t.care_notes.filter((x) => x.stay_id === s.id)) log(n.at, n.author_id, 'care_note.create', 'stay', s.id, `thêm ghi chú chăm sóc cho ${s.code}`);
    for (const e of t.diary_entries.filter((x) => x.stay_id === s.id)) {
      if (e.status === 'shared') log(e.shared_at!, e.shared_by!, 'diary.share', 'stay', s.id, 'chia sẻ nhật ký với khách', true);
      else log(e.created_at, e.author_id, 'diary.draft', 'stay', s.id, `lưu nháp nhật ký cho ${s.code}`);
    }
    for (const v of t.videos.filter((x) => x.stay_id === s.id)) {
      log(v.uploaded_at, v.uploaded_by, 'video.upload', 'video', v.id, `tải lên 1 video của ${petName}`, true);
      if (v.shared_at) log(v.shared_at, v.shared_by!, 'video.share', 'video', v.id, 'chia sẻ video với khách', true);
    }
    if (s.discharged_at) log(s.discharged_at, s.discharged_by!, 'stay.discharge', 'stay', s.id, `cho xuất viện ${s.code}`);
  }
}
