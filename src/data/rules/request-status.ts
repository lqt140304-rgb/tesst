import type { RequestStatus } from '../contracts/enums';

const NEXT: Record<RequestStatus, readonly RequestStatus[]> = {
  pending: ['contacting', 'cancelled', 'rejected'],
  contacting: ['confirmed', 'unreachable', 'cancelled', 'rejected'],
  unreachable: ['contacting', 'cancelled', 'rejected'],
  confirmed: ['cancelled'],
  cancelled: [],
  rejected: [],
};

/** What the "cần xử lý" tab and the operations report call waiting for staff. */
export const OPEN_REQUEST_STATUSES: readonly RequestStatus[] = ['pending', 'contacting', 'unreachable'];

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return NEXT[from].includes(to);
}

/** Cancelled and rejected release the lock so the customer can simply submit again. */
export function holdsDedupeLock(s: RequestStatus): boolean {
  return s !== 'cancelled' && s !== 'rejected';
}
