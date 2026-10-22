import { INQUIRY_STATUSES, type InquiryStatus } from '../../../contracts/enums';
import { ConflictError, ValidationError } from '../../../contracts/errors';
import type { StaffInquiriesApi, StaffInquiryRow } from '../../../contracts/staff';
import { toIsoVN } from '../../../../lib/dates';
import { isOverdue } from '../../../rules/app-settings';
import type { Env } from '../../env';
import { sleepRead, sleepWrite } from '../../latency';
import { readSettings } from '../../settings';
import type { Inquiry } from '../../store/schema';
import { audit, find, staffActor } from './common';

const CAP = 'requests.handle' as const;
const str = (v: unknown) => (typeof v === 'string' ? v : '');
const optStr = (v: unknown) => (typeof v === 'string' && v ? v : undefined);

const isStatus = (s: unknown): s is InquiryStatus => INQUIRY_STATUSES.includes(s as InquiryStatus);

/** A stored message is not trusted: an odd status reads as waiting, a missing text as empty, and a missing time is never overdue. */
function toRow(q: Inquiry, now: Date, overdueHours: number): StaffInquiryRow {
  const status: InquiryStatus = isStatus(q.status) ? q.status : 'new';
  const createdAt = str(q.created_at);
  return {
    id: q.id, code: q.code, name: str(q.name), phone: str(q.phone_e164), text: str(q.text), about: optStr(q.about), status, createdAt,
    handledByName: optStr(q.handled_by_name), handledAt: optStr(q.handled_at),
    overdue: status === 'new' && !Number.isNaN(Date.parse(createdAt)) && isOverdue(createdAt, now, overdueHours), version: Number.isInteger(q.version) ? q.version : 1,
  };
}

export function staffInquiriesApi(env: Env): StaffInquiriesApi {
  const { db } = env;
  return {
    async list(filter) {
      staffActor(env, CAP);
      await sleepRead();
      if (filter?.status !== undefined && !isStatus(filter.status)) throw new ValidationError({ status: 'Trạng thái lọc chưa đúng.' });
      const doc = db.read();
      const now = env.clock();
      const hours = readSettings(doc.t).values.request_overdue_hours;
      return doc.t.inquiries.map((q, i) => ({ row: toRow(q, now, hours), i }))
        .filter(({ row }) => !filter?.status || row.status === filter.status)
        .sort((x, y) => Number(x.row.status === 'called') - Number(y.row.status === 'called') || y.row.createdAt.localeCompare(x.row.createdAt) || y.i - x.i)
        .map(({ row }) => row);
    },

    async markCalled(id, version) {
      const a = staffActor(env, CAP);
      await sleepWrite();
      db.transact('inquiry.called', (d) => {
        const q = find(d.t.inquiries, id);
        // Strict: the exact whole number that was read, never a missing one.
        if (!Number.isInteger(version) || q.version !== version) throw new ConflictError();
        if (q.status === 'called') throw new ValidationError({ status: 'Lời nhắn này đã được gọi lại.' });
        q.status = 'called';
        q.handled_by_name = a.staff.display_name;
        q.handled_at = toIsoVN(env.clock());
        q.version += 1;
        audit(d, env, a, 'inquiry.called', 'inquiry', q.id, `${a.staff.display_name} đánh dấu đã gọi lại lời nhắn ${q.code}`);
      });
    },
  };
}
