import type { RequestStatus } from '../contracts/enums';

const NEXT: Record<RequestStatus, readonly RequestStatus[]> = {
  pending: ['contacting', 'cancelled', 'rejected'],
  contacting: ['confirmed', 'unreachable', 'cancelled', 'rejected'],
  unreachable: ['contacting', 'cancelled', 'rejected'],
  confirmed: ['cancelled'],
  cancelled: [],
  rejected: [],
};

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return NEXT[from].includes(to);
}

/** Cancelled and rejected release the lock so the customer can simply submit again. */
export function holdsDedupeLock(s: RequestStatus): boolean {
  return s !== 'cancelled' && s !== 'rejected';
}
