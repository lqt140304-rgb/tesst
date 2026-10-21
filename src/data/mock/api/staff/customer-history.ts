/** "Lịch sử tương tác" of one customer, built from the tables' own timestamps (part 4 §3.1). */
import { CALL_OUTCOME_LABEL, REQUEST_STATUS_LABEL, SERVICE_LABEL } from '../../../contracts/enums';
import type { StaffInteraction } from '../../../contracts/staff';
import { formatVnd } from '../../../../lib/money';
import type { Cap } from '../../../rules/capabilities';
import type { Doc } from '../../store/schema';
import { staffName } from './common';

const MAX = 50;

export function customerInteractions(doc: Readonly<Doc>, customerId: string, caps: ReadonlySet<Cap>): StaffInteraction[] {
  const { t } = doc;
  const c = t.customers.find((x) => x.id === customerId)!;
  const out: StaffInteraction[] = [];
  const add = (at: string | undefined, kind: StaffInteraction['kind'], label: string, actorId?: string, refId?: string) => {
    if (at) out.push({ at, kind, label, actorName: staffName(doc, actorId), refId });
  };
  add(c.created_at, 'customer', `Tạo hồ sơ ${c.code}`, c.created_by, c.id);

  for (const r of t.booking_requests.filter((x) => x.customer_id === customerId || x.snapshot.phone_e164 === c.phone_e164)) {
    for (const e of t.request_events.filter((x) => x.request_id === r.id)) {
      if (e.type === 'created') add(e.at, 'request', `Gửi yêu cầu ${r.code}`, undefined, r.id);
      else if (e.type === 'status_change' && e.to_status) add(e.at, 'request', `${r.code}: ${REQUEST_STATUS_LABEL[e.to_status]}`, e.actor_id, r.id);
      else if (e.type === 'call' && e.call_outcome) add(e.at, 'request', `Gọi về ${r.code}: ${CALL_OUTCOME_LABEL[e.call_outcome]}`, e.actor_id, r.id);
    }
  }
  for (const a of t.appointments.filter((x) => x.customer_id === customerId)) add(a.created_at, 'appointment', `Tạo lịch hẹn ${a.code} · ${SERVICE_LABEL[a.service]}`, a.created_by, a.id);

  if (caps.has('inpatient.view')) {
    for (const s of t.stays.filter((x) => x.customer_id === customerId)) {
      const pet = t.pets.find((p) => p.id === s.pet_id)?.name ?? '';
      add(s.admitted_at, 'stay', `Nhập viện ${pet} (${s.code})`, s.admitted_by, s.id);
      add(s.discharged_at, 'stay', `Xuất viện ${pet} (${s.code})`, s.discharged_by, s.id);
    }
  }
  if (caps.has('invoices.create') || caps.has('payments.record')) {
    for (const i of t.invoices.filter((x) => x.customer_id === customerId)) {
      add(i.created_at, 'invoice', `Tạo hóa đơn ${i.code}`, i.created_by, i.id);
      add(i.issued_at, 'invoice', `Phát hành ${i.code} · ${formatVnd(i.total)}`, i.issued_by, i.id);
      add(i.voided_at, 'invoice', `Hủy ${i.code}`, i.voided_by, i.id);
      for (const p of t.payments.filter((x) => x.invoice_id === i.id)) {
        add(p.received_at, 'payment', `Thu ${formatVnd(p.amount)} · ${i.code}`, p.received_by, i.id);
        add(p.reversed_at, 'payment', `Hủy phiếu thu ${p.code}`, p.reversed_by, i.id);
      }
    }
  }
  for (const l of t.account_links.filter((x) => x.customer_id === customerId)) {
    add(l.linked_at, 'link', `Liên kết tài khoản web ${t.web_accounts.find((a) => a.id === l.account_id)?.username ?? ''}`, l.linked_by, l.account_id);
  }
  // Same instant → keep the order they were added (stable sort).
  return out.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, MAX);
}
