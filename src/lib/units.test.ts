import { describe, expect, it } from 'vitest';
import { formatKg } from './units';

describe('formatKg (owner standard: decimal comma, no-break space before the unit)', () => {
  it('uses a comma and a no-break space', () => {
    expect(formatKg(4.2)).toBe('4,2\u00A0kg');
  });
  it('drops a trailing .0 and keeps one decimal at most', () => {
    expect(formatKg(12)).toBe('12\u00A0kg');
    expect(formatKg(5.5)).toBe('5,5\u00A0kg');
    expect(formatKg(4.25)).toBe('4,3\u00A0kg');
  });
});
