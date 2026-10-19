import type { Cap } from '../../../rules/capabilities';
import { NotFoundError } from '../../../contracts/errors';
import type { Env } from '../../env';
import { assertCap, currentActor } from '../../guard';
import type { Doc, StaffUser } from '../../store/schema';
import { appendAudit } from '../../audit';

export type StaffActor = { staff: StaffUser; caps: ReadonlySet<Cap> };

/** Every staff function starts here: the subject comes from the session, never from parameters. */
export function staffActor(env: Env, cap: Cap | Cap[]): StaffActor {
  const actor = currentActor(env.db, env.session.get());
  assertCap(actor, cap);
  return { staff: actor.staff, caps: actor.caps };
}

export function find<T extends { id: string }>(rows: T[], id: string): T {
  const row = rows.find((r) => r.id === id);
  if (!row) throw new NotFoundError();
  return row;
}

export const staffName = (doc: Readonly<Doc>, id?: string) => (id ? doc.t.staff_users.find((s) => s.id === id)?.display_name : undefined);

export function audit(d: Doc, env: Env, a: StaffActor, action: string, entity_type: string, entity_id: string, summary_vi: string, opts?: { reason?: string; sensitive?: boolean }) {
  appendAudit(d, env.clock(), { actor_type: 'staff', actor_id: a.staff.id, actor_name_snapshot: a.staff.display_name, action, entity_type, entity_id, summary_vi, reason: opts?.reason, sensitive: opts?.sensitive ?? false });
}

/** Lower-case, accent-insensitive text for search. */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}
