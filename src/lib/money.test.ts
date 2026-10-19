import { describe, expect, it } from 'vitest';
import { formatVnd } from './money';

const plain = (s: string) => s.replace(/\s/g, ' ');

describe('formatVnd', () => {
  it('formats integer VND with dot thousands and the dong sign', () => {
    expect(plain(formatVnd(150000))).toBe('150.000 ₫');
    expect(plain(formatVnd(3450000))).toBe('3.450.000 ₫');
    expect(plain(formatVnd(0))).toBe('0 ₫');
  });
});
