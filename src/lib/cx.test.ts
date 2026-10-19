import { describe, expect, it } from 'vitest';
import { cx } from './cx';

describe('cx', () => {
  it('joins truthy class names with a space', () => {
    expect(cx('a', false, null, 'b')).toBe('a b');
  });
  it('returns an empty string when nothing is given', () => {
    expect(cx()).toBe('');
  });
});
