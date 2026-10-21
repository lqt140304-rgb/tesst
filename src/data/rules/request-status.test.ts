import { describe, expect, it } from 'vitest';
import { REQUEST_STATUSES } from '../contracts/enums';
import { OPEN_REQUEST_STATUSES, canTransition, holdsDedupeLock } from './request-status';

const ALLOWED: Record<string, string[]> = {
  pending: ['contacting', 'cancelled', 'rejected'],
  contacting: ['confirmed', 'unreachable', 'cancelled', 'rejected'],
  unreachable: ['contacting', 'cancelled', 'rejected'],
  confirmed: ['cancelled'],
  cancelled: [],
  rejected: [],
};

describe('request status machine', () => {
  for (const from of REQUEST_STATUSES) {
    for (const to of REQUEST_STATUSES) {
      const expected = ALLOWED[from]!.includes(to);
      it(`${from} → ${to} is ${expected ? 'allowed' : 'forbidden'}`, () => {
        expect(canTransition(from, to)).toBe(expected);
      });
    }
  }
  it('lock is held by open and confirmed requests only', () => {
    expect(REQUEST_STATUSES.filter(holdsDedupeLock)).toEqual(['pending', 'contacting', 'confirmed', 'unreachable']);
  });
});

describe('open requests', () => {
  it('"cần xử lý" means pending, contacting or unreachable', () => {
    expect([...OPEN_REQUEST_STATUSES]).toEqual(['pending', 'contacting', 'unreachable']);
  });
});
