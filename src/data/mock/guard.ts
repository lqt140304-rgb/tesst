import type { Session } from '../contracts/api';
import { ForbiddenError, NotLinkedError } from '../contracts/errors';
import { effectiveCaps, type Cap } from '../rules/capabilities';
import type { Db } from './store/db';
import type { StaffUser, WebAccount } from './store/schema';

export type Actor =
  | { type: 'staff'; staff: StaffUser; caps: ReadonlySet<Cap> }
  | { type: 'customer'; account: WebAccount; customerId: string | null }
  | { type: 'guest' };

export function currentActor(db: Db, session: Session | null): Actor {
  if (!session) return { type: 'guest' };
  const { t } = db.read();
  if (session.kind === 'staff') {
    const staff = t.staff_users.find((s) => s.id === session.staffId && s.active);
    return staff ? { type: 'staff', staff, caps: effectiveCaps(staff) } : { type: 'guest' };
  }
  const account = t.web_accounts.find((a) => a.id === session.accountId && a.status === 'active');
  if (!account) return { type: 'guest' };
  const link = t.account_links.find((l) => l.account_id === account.id && !l.unlinked_at);
  return { type: 'customer', account, customerId: link?.customer_id ?? null };
}

/** Any-of semantics for an array. */
export function assertCap(actor: Actor, cap: Cap | Cap[]): asserts actor is Extract<Actor, { type: 'staff' }> {
  if (actor.type !== 'staff') throw new ForbiddenError();
  const caps = Array.isArray(cap) ? cap : [cap];
  if (!caps.some((c) => actor.caps.has(c))) throw new ForbiddenError();
}

export function assertCustomer(actor: Actor): asserts actor is Extract<Actor, { type: 'customer' }> {
  if (actor.type !== 'customer') throw new ForbiddenError('Bạn đăng nhập để tiếp tục nhé.');
}

export function customerScope(actor: Actor): { accountId: string; customerId: string | null } {
  assertCustomer(actor);
  return { accountId: actor.account.id, customerId: actor.customerId };
}

export function requireLinked(scope: { customerId: string | null }): string {
  if (!scope.customerId) throw new NotLinkedError();
  return scope.customerId;
}
