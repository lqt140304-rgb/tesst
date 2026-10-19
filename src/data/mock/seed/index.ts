import type { Doc } from '../store/schema';
import { appendAudit } from '../audit';
import { seedAccounts, STAFF, acc } from './accounts';
import { seedAppointments } from './appointments';
import { seedBilling } from './billing';
import { createCtx } from './ctx';
import { seedInpatient } from './inpatient';
import { seedRequests } from './requests';

export { DEMO_PASSWORD } from './accounts';

/** Deterministic demo data, every date relative to `now` (proposal-staff.md §11 + QUYET-DINH R2, R3, R7, R8). */
export function buildSeed(now: Date): Doc {
  const c = createCtx(now);
  seedAccounts(c);
  seedRequests(c);
  seedAppointments(c);
  seedInpatient(c);
  seedBilling(c);
  const { doc } = c;
  const flagged = doc.t.booking_requests.find((r) => r.resubmit_flag_at)!;
  appendAudit(doc, now, { at: flagged.resubmit_flag_at, actor_type: 'guest', actor_name_snapshot: 'Khách', action: 'request.resubmit_flag', entity_type: 'booking_request', entity_id: flagged.id, summary_vi: `Khách vừa gửi lại yêu cầu ${flagged.code} — cần gọi lại`, sensitive: true });
  for (const l of doc.t.account_links) {
    appendAudit(doc, now, { at: l.linked_at, actor_type: 'staff', actor_id: STAFF.ha, actor_name_snapshot: 'Nguyễn Thu Hà', action: 'account.link', entity_type: 'web_account', entity_id: l.account_id, summary_vi: `Liên kết tài khoản web ${l.account_id.replace(acc(''), '')} với hồ sơ khách hàng`, sensitive: true });
  }
  const purged = doc.t.videos.find((v) => v.deleted_by === 'system');
  if (purged) {
    appendAudit(doc, now, { at: purged.deleted_at, actor_type: 'system', actor_name_snapshot: 'Hệ thống', action: 'video.auto_delete', entity_type: 'video', entity_id: purged.id, summary_vi: 'Hệ thống tự xóa 1 video sau 60 ngày', sensitive: true });
  }
  return doc;
}
