import { describe, expect, it } from 'vitest';
import { daysLeft, expiryTone, videoExpiresAt } from './video-expiry';

describe('video expiry', () => {
  it('expires 60 days after upload', () => {
    expect(videoExpiresAt('2026-10-19T08:10:00+07:00')).toBe('2026-12-18T08:10:00+07:00');
  });
  it('counts whole days left', () => {
    expect(daysLeft('2026-10-22T08:00:00+07:00', new Date('2026-10-19T09:00:00+07:00'))).toBe(3);
  });
  it('maps days left to a tone', () => {
    expect(expiryTone(3)).toBe('rose');
    expect(expiryTone(4)).toBe('orange');
    expect(expiryTone(14)).toBe('orange');
    expect(expiryTone(15)).toBe('normal');
  });
});
