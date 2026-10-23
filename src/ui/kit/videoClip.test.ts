import { describe, expect, it } from 'vitest';
import { clipLimit, shouldStop } from './videoClip';

describe('clipLimit', () => {
  it('is the shorter of the real length and the clip end', () => {
    expect(clipLimit(20, 15)).toBe(15);
    expect(clipLimit(9.5, 15)).toBe(9.5);
    expect(clipLimit(15, 15)).toBe(15);
  });
  it('is the real length when there is no clip end, and the clip end while the length is unknown', () => {
    expect(clipLimit(20)).toBe(20);
    expect(clipLimit(0, 15)).toBe(15);
    expect(clipLimit(Number.NaN, 15)).toBe(15);
    expect(clipLimit(Number.POSITIVE_INFINITY, 15)).toBe(15);
  });
  it('is 0 when nothing is known', () => {
    expect(clipLimit(0)).toBe(0);
    expect(clipLimit(Number.NaN)).toBe(0);
  });
  it('ignores a clip end that is not a positive number', () => {
    expect(clipLimit(20, 0)).toBe(20);
    expect(clipLimit(20, -3)).toBe(20);
    expect(clipLimit(20, Number.NaN)).toBe(20);
  });
});

describe('shouldStop', () => {
  it('stops at or after the end of the clip, never before, and never without a clip end', () => {
    expect(shouldStop(14.9, 15)).toBe(false);
    expect(shouldStop(15, 15)).toBe(true);
    expect(shouldStop(18, 15)).toBe(true);
    expect(shouldStop(18, 0)).toBe(false);
  });
});
