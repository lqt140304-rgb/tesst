import { SUPPORT_KINDS, SUPPORT_KIND_LABEL, SUPPORT_STATUS_LABEL, SUPPORT_STATUSES, type SupportStatus } from '../../../contracts/enums';
import { ConflictError, ValidationError } from '../../../contracts/errors';
import type { StaffSupportApi, SupportTicketRow } from '../../../contracts/staff';
import { toIsoVN } from '../../../../lib/dates';
import { SUPPORT_MSG, isSupportStatus, validateReply, validateStatus, validateSupportInput } from '../../../rules/support';
import type { Env } from '../../env';
import { newId, nextCode } from '../../ids';
import { sleepRead, sleepWrite } from '../../latency';
import type { SupportTicket } from '../../store/schema';
import { audit, anyStaff, find, staffActor } from './common';

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const optStr = (v: unknown) => (typeof v === 'string' && v ? v : undefined);

/** A stored ticket is not trusted: an odd kind or status reads as the plain default and a missing text as empty. */
function toRow(t: SupportTicket): SupportTicketRow {
  return {
    id: t.id, code: t.code, kind: SUPPORT_KINDS.includes(t.kind) ? t.kind : 'howto', title: str(t.title), body: str(t.body), screen: optStr(t.screen),
    status: SUPPORT_STATUSES.includes(t.status) ? t.status : 'new', createdAt: str(t.created_at), createdByName: str(t.created_by_name),
    replyText: optStr(t.reply_text), repliedByName: optStr(t.replied_by_name), repliedAt: optStr(t.replied_at), version: Number.isInteger(t.version) ? t.version : 1,
  };
}

const RANK: Record<SupportStatus, number> = { new: 0, seen: 1, answered: 2 };

export function staffSupportApi(env: Env): StaffSupportApi {
  const { db } = env;
  const CAP = 'support.inbox' as const;
  // The version is compared strictly (not with `checkVersion`, which lets an undefined one through): a ticket never changes without the number that was read.
  return {
    async submit(input) {
      const a = anyStaff(env);
      await sleepWrite();
      const errors = validateSupportInput(input);
      if (Object.keys(errors).length) throw new ValidationError(errors);
      const title = input.title.trim();
      const body = input.body.trim();
      const screen = input.screen?.trim() || undefined;
      return db.transact('support.submit', (d) => {
        if (d.t.support_tickets.some((t) => t.created_by === a.staff.id && t.kind === input.kind && t.title === title && t.body === body && t.status !== 'answered')) {
          throw new ValidationError({ body: SUPPORT_MSG.duplicate });
        }
        const id = newId();
        const code = nextCode(d, 'HT');
        d.t.support_tickets.push({ id, code, kind: input.kind, title, body, screen, status: 'new', created_at: toIsoVN(env.clock()), created_by: a.staff.id, created_by_name: a.staff.display_name, version: 1 });
        audit(d, env, a, 'support.submit', 'support_ticket', id, `${a.staff.display_name} gửi phiếu ${code} (${SUPPORT_KIND_LABEL[input.kind]})`);
        return code;
      });
    },

    async mine() {
      const a = anyStaff(env);
      await sleepRead();
      return db.read().t.support_tickets.filter((t) => t.created_by === a.staff.id).map(toRow).sort((x, y) => y.createdAt.localeCompare(x.createdAt));
    },

    async inbox(filter) {
      staffActor(env, CAP);
      await sleepRead();
      if (filter?.status !== undefined && !isSupportStatus(filter.status)) throw new ValidationError({ status: SUPPORT_MSG.filter });
      return db.read().t.support_tickets.map(toRow)
        .filter((r) => !filter?.status || r.status === filter.status)
        .sort((x, y) => RANK[x.status] - RANK[y.status] || x.createdAt.localeCompare(y.createdAt));
    },

    async setStatus(id, version, status) {
      const a = staffActor(env, CAP);
      await sleepWrite();
      const bad = validateStatus(status);
      if (bad) throw new ValidationError({ status: bad });
      db.transact('support.setStatus', (d) => {
        const t = find(d.t.support_tickets, id);
        if (t.version !== version) throw new ConflictError();
        if (t.status === 'answered') throw new ValidationError({ status: SUPPORT_MSG.answered });
        t.status = status;
        t.version += 1;
        audit(d, env, a, 'support.status', 'support_ticket', t.id, `${a.staff.display_name} đặt phiếu ${t.code} sang ${SUPPORT_STATUS_LABEL[status]}`);
      });
    },

    async reply(id, version, text) {
      const a = staffActor(env, CAP);
      await sleepWrite();
      const bad = validateReply(text);
      if (bad) throw new ValidationError({ reply: bad });
      db.transact('support.reply', (d) => {
        const t = find(d.t.support_tickets, id);
        if (t.version !== version) throw new ConflictError();
        t.reply_text = text.trim();
        t.replied_by_name = a.staff.display_name;
        t.replied_at = toIsoVN(env.clock());
        t.status = 'answered';
        t.version += 1;
        audit(d, env, a, 'support.reply', 'support_ticket', t.id, `${a.staff.display_name} trả lời phiếu ${t.code}`);
      });
    },
  };
}
